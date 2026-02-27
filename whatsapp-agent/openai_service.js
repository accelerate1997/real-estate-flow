require('dotenv').config();
const OpenAI = require('openai');
const db = require('./database');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("Missing OPENAI_API_KEY in .env");
}

const openai = new OpenAI({
    apiKey: apiKey
});

const SYSTEM_PROMPT = `You are an AI Assistant for Rajesh Real Estate Agency. Your job is to handle customer inquiries for properties.

STRICT CONVERSATION FLOW & ANTI-HALLUCINATION RULES:
0. Phone Number Check: If the system note says "NO_PHONE_PROVIDED", and the user hasn't explicitly given a phone number in the chat, your first message MUST ask: "May I have your WhatsApp number for our records?"
1. Greeting: Ask the user how you can assist them and if they are looking for a property.
2. Qualification: If they say yes, ask for their name and specific requirements (BHK, Location).
3. Budget, Timeline, Purpose: Once you have their name and requirements, ask for their budget, when they plan to purchase, and the purpose (Personal, Investment, etc). Do not skip this step!
4. Search: When the user provides their budget, timeline, and purpose, you MUST return the JSON intent "SEARCH_PROPERTIES" along with the extracted parameters.
5. Results: Once you receive the search results via SYSTEM NOTE, present them to the user clearly (with URLs). Ask them when you can follow back up to know their decision.

CRITICAL ANTI-HALLUCINATION WARNING:
DO NOT EVER INVENT OR HALLUCINATE PROPERTIES OR PROPERTY LINKS. You have NO KNOWLEDGE of the available properties until you trigger the "SEARCH_PROPERTIES" intent and receive the SYSTEM NOTE back. If the user asks for properties before providing their budget and timeline, decline politely and ask for the missing information. NEVER provide fake URLs.

INTENTS:
- GENERAL_CHAT: Normal conversational responses.
- SEARCH_PROPERTIES: User has provided requirements and budget. You need to search the database.

OUTPUT FORMAT:
You must ALWAYS output valid JSON ONLY matching exactly this schema:
{
  "intent": "GENERAL_CHAT" | "SEARCH_PROPERTIES",
  "human_response": "What you actually say back to the user",
  "parameters": {
     "name": "User Name (if known)",
     "extracted_phone": "Numeric phone number if user explicitly types it (e.g. 9876543210)",
     "bhk": "A single digit representing the BHK, e.g., '2' or '3' (if known). Pick the lowest if they give a range.",
     "location": "e.g., Mumbai, Andheri, etc. (if known)",
     "budget_in_rupees": "numeric budget (e.g., 20000000 for 2Cr) (if known)",
     "timeframe": "When they want to buy (if known)",
     "purpose": "Personal, Investment, etc (if known)",
     "follow_up_date": "YYYY-MM-DD or readable date when they said they'll decide (if known)"
  }
}`;

// Store active chat sessions by phone number
const sessions = {};

async function processMessage(userInput, phone, agencyId) {
    try {
        if (!sessions[phone]) {
            sessions[phone] = [
                { role: "system", content: SYSTEM_PROMPT }
            ];
        }

        const chatContext = sessions[phone];

        // Let the AI know if we have a real phone number or a generic ID from a non-whatsapp platform
        const phoneContext = phone.match(/^\d+$/) ? '' : ' \n[SYSTEM NOTE: NO_PHONE_PROVIDED]';
        const finalInput = userInput + phoneContext;

        chatContext.push({ role: "user", content: finalInput });

        // Force strictly formatted JSON output
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatContext,
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const responseText = response.choices[0].message.content;
        chatContext.push({ role: "assistant", content: responseText });

        console.log(`\n[DEBUG - Raw AI Output]`);
        console.log(responseText);

        try {
            const parsed = JSON.parse(responseText);
            const intent = parsed.intent;
            const params = parsed.parameters || {};

            // Always attempt to save/update the Lead when the AI learns new information
            const hasLeadData = params.name || params.bhk || params.location || params.budget_in_rupees || params.purpose;
            if (hasLeadData && agencyId) {
                const leadPhone = phone.match(/^\d+$/) ? phone : (params.extracted_phone || phone);
                await db.upsertLead(leadPhone, agencyId, params);
            }

            if (intent === 'SEARCH_PROPERTIES') {
                console.log(`\n[ACTION] AI requesting property search for ${params.name || 'User'} with budget: Rs ${params.budget_in_rupees}`);

                // Query PocketBase
                const properties = await db.findProperties({
                    budget: params.budget_in_rupees,
                    bhk: params.bhk,
                    location: params.location
                });

                if (properties.length === 0) {
                    const failMsg = `SYSTEM NOTE: The database search returned NO properties matching the criteria. Inform the user politely and ask if they'd like to adjust their budget or location.`;
                    chatContext.push({ role: "system", content: failMsg });

                    const failResponse = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: chatContext,
                        response_format: { type: "json_object" }
                    });

                    const failData = JSON.parse(failResponse.choices[0].message.content);
                    chatContext.push({ role: "assistant", content: JSON.stringify(failData) });
                    return failData.human_response || "I couldn't find any properties matching that criteria.";
                }

                // Format properties into a readable string
                const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
                const propertyList = properties.map(p =>
                    `🏡 *${p.title}*\n📍 ${p.location} | ${p.bhk || 'N/A'}\n💰 ₹${(p.price / 10000000).toFixed(2)} Cr\n🔗 Link: ${baseUrl}/properties/${p.id}`
                ).join('\n\n');

                const successMsg = `SYSTEM NOTE: The database found these properties:\n${propertyList}\n\nPresent these to the user perfectly formatted and ask when you can follow up regarding their decision.`;
                chatContext.push({ role: "system", content: successMsg });

                const successResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: chatContext,
                    response_format: { type: "json_object" }
                });

                const successData = JSON.parse(successResponse.choices[0].message.content);
                chatContext.push({ role: "assistant", content: JSON.stringify(successData) });
                return successData.human_response || "Here are some properties I found:\n\n" + propertyList;
            }

            // Default fallback for GENERAL_CHAT
            return parsed.human_response || "I am still learning how to help you.";

        } catch (e) {
            console.error('[Error processing JSON AI output]:', e.message);
            return "I apologize, my system encountered an error understanding that format.";
        }
    } catch (error) {
        console.error('Process Message Error:', error.message || error);

        // Handle explicit OpenAI rate limit error 429
        if (error.status === 429) {
            return "Sorry, my OpenAI key has hit its API rate limit or run out of credits! Please check your billing dashboard.";
        }
        return "Sorry, I am having trouble connecting to my brain right now.";
    }
}

// New function to retrieve live chat history for the dashboard
function getChats(phone) {
    // Find the session key that includes this phone number (e.g. "918268919143@s.whatsapp.net")
    const sessionKey = Object.keys(sessions).find(key => key.includes(phone));

    if (!sessionKey || !sessions[sessionKey]) return [];

    // Filter out system prompts so the agency owner only sees actual user & assistant messages
    return sessions[sessionKey].filter(msg => msg.role === 'user' || msg.role === 'assistant').map(msg => ({
        role: msg.role,
        // Remove the invisible phone context note from user messages before displaying
        content: msg.content.replace(/\n\[SYSTEM NOTE: NO_PHONE_PROVIDED\]$/, '')
    }));
}

module.exports = { processMessage, getChats };
