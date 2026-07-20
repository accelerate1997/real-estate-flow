require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('./database');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are an AI Assistant for the Real Estate Agency. Your job is to handle customer inquiries for properties.

    STRICT CONVERSATION FLOW & ANTI-HALLUCINATION RULES:
    0. Phone Number Check: If the system note says "NO_PHONE_PROVIDED", and the user hasn't explicitly given a phone number in the chat, your first message MUST ask: "May I have your WhatsApp number for our records?"
    1. Greeting: Greet the lead and ask for their name.
    2. Qualification: Collect requirements step-by-step by asking targeted questions based on user's choices:
       - Ask if they want to Buy or Rent, and the Type of Property (Residential, Commercial, or Plots & Lands).
       - If user chooses Rent & Residential:
         - Ask what type (Apartment, Bungalow, Villas) and size (number of BHK).
         - Then ask for Purpose (Personal/Investment), Location, Budget, and Urgency (how urgent it is).
       - If user chooses Buy & Residential:
         - Ask if they prefer New projects or Ready to move.
         - Ask what type (Apartment, Bungalow, Villas) and size (number of BHK).
         - Then ask for Purpose (Personal/Investment), Location, Budget, and Urgency (how urgent it is).
       - If user chooses Rent & Commercial:
         - Ask what type (Shop, Office Space) and size (how much sqft).
         - Purpose is set to 'Investment' by default (do not ask for purpose unless user changes it).
         - Then ask for Location, Budget, and Urgency (how urgent it is).
       - If user chooses Buy & Commercial:
         - Ask if they prefer New projects or Ready to move.
         - Ask what type (Shop, Office Space) and size (how much sqft).
         - Purpose is set to 'Investment' by default (do not ask for purpose unless user changes it).
         - Then ask for Location, Budget, and Urgency (how urgent it is).
       - If user chooses Plots & Lands:
         - Ask related questions: Purpose (Personal/Investment), Location, Budget, and Urgency (how urgent it is).
       Keep intent "GENERAL_CHAT" during qualification. Do not show listings immediately.
    3. Search: When the user provides their requirements (Location and either Budget or BHK/Size), you MUST return the JSON intent "SEARCH_PROPERTIES" along with the extracted parameters.
    
    CRITICAL ANTI-HALLUCINATION WARNING:
    DO NOT EVER INVENT OR HALLUCINATE PROPERTIES OR PROPERTY LINKS. You have NO KNOWLEDGE of the available properties until you trigger the "SEARCH_PROPERTIES" intent and receive the SYSTEM NOTE back. If the user asks for properties before providing their budget and timeline, decline politely and ask for the missing information. NEVER provide fake URLs.
    
    INTENTS:
    - GENERAL_CHAT: Normal conversational responses.
    - SEARCH_PROPERTIES: User has provided requirements and budget. You need to search the database.
    
    OUTPUT FORMAT:
    You must ALWAYS output valid JSON ONLY. It must have the following structure:
    {
      "intent": "GENERAL_CHAT" | "SEARCH_PROPERTIES",
      "human_response": "What you actually say back to the user",
      "parameters": {
         "name": "User Name (if known)",
         "extracted_phone": "Numeric phone number if user explicitly types it (e.g. 9876543210)",
         "buy_or_rent": "Buy | Rent",
         "property_category": "Residential | Commercial | Plots & Lands",
         "construction_status": "New projects | Ready to move",
         "property_type": "Apartment | Bungalow | Villas | Shop | Office Space",
         "size": "e.g. 2BHK or 1500 sqft",
         "bhk": "e.g. 2BHK (if residential)",
         "location": "e.g. Bandra",
         "budget_in_rupees": "numeric budget (e.g., 20000000 for 2Cr) (if known)",
         "purpose": "Personal | Investment",
         "urgency": "e.g. Immediate, 1 month, 3 months"
      }
    }
    
    CRITICAL: NEVER output markdown formatting around the JSON (no \`\`\`json). Just the raw JSON object.`
});

// Store active chat sessions by phone number
const sessions = {};

async function processMessage(userInput, phone, agencyId) {
    try {
        if (!sessions[phone]) {
            sessions[phone] = model.startChat({
                history: [],
            });
        }

        const chat = sessions[phone];

        // Let the AI know if we have a real phone number or a generic ID from a non-whatsapp platform
        const phoneContext = phone.match(/^\d+$/) ? '' : ' \n[SYSTEM NOTE: NO_PHONE_PROVIDED]';
        const finalInput = userInput + phoneContext;

        const result = await chat.sendMessage(finalInput);
        let responseText = result.response.text();

        console.log(`\n[DEBUG - Raw AI Output]`);
        console.log(responseText);

        // Robust JSON extraction
        let cleanText = responseText;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(cleanText);
            const intent = parsed.intent;
            const params = parsed.parameters || {};

            // Always attempt to save/update the Lead when the AI learns new information
            const hasLeadData = params.name || params.bhk || params.location || params.budget_in_rupees || params.purpose;
            if (hasLeadData && agencyId) {
                // Use the phone number the user typed if the environment didn't provide one
                const leadPhone = phone.match(/^\d+$/) ? phone : (params.extracted_phone || phone);
                await db.upsertLead(leadPhone, agencyId, { ...params, isChatUpdate: true });
            }

            if (intent === 'SEARCH_PROPERTIES') {
                console.log(`\n[ACTION] AI is requesting a property search for ${params.name || 'User'} with budget: ₹${params.budget_in_rupees}`);

                // Query PocketBase
                const properties = await db.findProperties({
                    budget: params.budget_in_rupees,
                    bhk: params.bhk,
                    location: params.location,
                    buy_or_rent: params.buy_or_rent
                });

                if (properties.length === 0) {
                    // Tell the AI no properties were found, let it generate a polite response
                    const failResult = await chat.sendMessage(`SYSTEM NOTE: The database search returned NO properties matching the criteria. Inform the user politely and ask if they'd like to adjust their budget or location.`);

                    // Parse the new AI response
                    const failClean = failResult.response.text().match(/\{[\s\S]*\}/)?.[0] || failResult.response.text();
                    return JSON.parse(failClean).human_response || "I couldn't find any properties matching that criteria.";
                }

                // Format properties into a readable string
                // In a real scenario, you'd construct a URL to your actual frontend property detail page based on the ID.
                const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
                const propertyList = properties.map(p =>
                    `🏡 *${p.title}*\n📍 ${p.location} | ${p.bhk || 'N/A'}\n💰 ₹${(p.price / 10000000).toFixed(2)} Cr\n🔗 Link: ${baseUrl}/properties/${p.id}`
                ).join('\n\n');

                const successResult = await chat.sendMessage(`SYSTEM NOTE: The database found these properties:\n${propertyList}\n\nPresent these to the user perfectly formatted and ask when you can follow up regarding their decision.`);

                const successClean = successResult.response.text().match(/\{[\s\S]*\}/)?.[0] || successResult.response.text();
                return JSON.parse(successClean).human_response || "Here are some properties I found:\n" + propertyList;
            }

            // Default fallback for GENERAL_CHAT
            return parsed.human_response || "I am still learning how to help you.";

        } catch (e) {
            console.error('[Error processing JSON AI output]:', e.message);
            return "I apologize, my system encountered an error understanding that format.";
        }
    } catch (error) {
        console.error('Process Message Error:', error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return "Sorry, my Google AI API key has hit its free-tier rate limit! Please wait a few seconds and try sending your message again.";
        }
        return "Sorry, I am having trouble connecting to my brain right now.";
    }
}

module.exports = { processMessage };
