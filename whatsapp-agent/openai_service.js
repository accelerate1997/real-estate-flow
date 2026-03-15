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

const SYSTEM_PROMPT = `You are an AI Assistant for Rajesh Real Estate Agency. Your job is to handle customer inquiries and schedule SITE VISITS.

STRICT CONVERSATION FLOW:
1. Greet the user professionally.
2. Lead Check:
   - YOU ALWAYS KNOW THE USER'S PHONE NUMBER. NEVER ask for their WhatsApp number or phone number.
   - If SYSTEM NOTE says [LEAD_EXISTS: false], you MUST ask for their NAME before scheduling.
   - If SYSTEM NOTE says [LEAD_EXISTS: true], use their name (LEAD_NAME) and proceed directly to scheduling.
3. Scheduling Logic:
   - When a user is interested in a property (e.g. "I am interested in [Property]"), you MUST ask for their preferred DATE and TIME for a site visit. 
   - DO NOT skip the date and time request. You cannot schedule without them.
   - If they are a new lead (LEAD_EXISTS: false), ensure you have their Name as well.
4. Finalizing:
   - Once (and ONLY after) you have Name (if new), Date, and Time, confirm the details back including the Property Name and the confirmed timing.
   - Use intent "SCHEDULE_SITE_VISIT" and return valid JSON when ALL parameters are confirmed.

CRITICAL ANTI-HALLUCINATION:
DO NOT INVENT PROPERTIES. Only discuss properties mentioned by the user or found in SEARCH_PROPERTIES results.

INTENTS:
- GENERAL_CHAT: Normal talk, greetings, or answering questions.
- SEARCH_PROPERTIES: Search triggered by BHK/Location/Budget.
- SCHEDULE_SITE_VISIT: When Date, Time, and Name (for new leads) are ALL confirmed by the user.

OUTPUT FORMAT:
Return JSON ONLY:
{
  "intent": "GENERAL_CHAT" | "SEARCH_PROPERTIES" | "SCHEDULE_SITE_VISIT",
  "human_response": "...",
  "parameters": {
     "name": "...",
     "visit_date": "YYYY-MM-DD HH:mm",
     "visit_property_id": "..."
  }
}`;

const sessions = {};

async function processMessage(userInput, phone, agencyId) {
    try {
        // Force session reset if it's a new property inquiry (pre-filled message)
        const isNewInquiry = userInput.includes('I am interested in this property') && userInput.includes('schedule a sitevisit');
        
        if (!sessions[phone] || isNewInquiry) {
            console.log(`[SESSION] Initializing/Resetting session for ${phone}`);
            sessions[phone] = [
                { role: "system", content: SYSTEM_PROMPT }
            ];
        } else {
            // Always ensure the first message is the CURRENT system prompt in case of logic updates
            sessions[phone][0] = { role: "system", content: SYSTEM_PROMPT };
        }

        const chatContext = sessions[phone];

        // CHECK IF LEAD EXISTS
        const cleanPhone = phone.replace(/[^\d]/g, '');
        let leadExists = false;
        let leadName = "";
        try {
            const lead = await db.getLeadByPhone(cleanPhone);
            if (lead) {
                leadExists = true;
                leadName = lead.name;
            }
        } catch (e) {
            console.error("DB Lead Check Error:", e.message);
        }

        const phoneContext = `\n[SYSTEM NOTE: LEAD_EXISTS: ${leadExists}${leadName ? `, LEAD_NAME: ${leadName}` : ''}]`;
        const finalInput = userInput + phoneContext;

        chatContext.push({ role: "user", content: finalInput });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatContext,
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const responseText = response.choices[0].message.content;
        chatContext.push({ role: "assistant", content: responseText });

        try {
            const parsed = JSON.parse(responseText);
            const intent = parsed.intent;
            const params = parsed.parameters || {};

            // Always attempt to save/update the Lead
            const hasLeadData = params.name || params.bhk || params.location || params.budget_in_rupees || params.purpose;
            if (hasLeadData && agencyId) {
                const leadPhone = phone.match(/^\d+$/) ? phone : (params.extracted_phone || phone);
                await db.upsertLead(leadPhone, agencyId, params);
            }

            if (intent === 'SEARCH_PROPERTIES') {
                const properties = await db.findProperties({
                    budget: params.budget_in_rupees,
                    bhk: params.bhk,
                    location: params.location
                });

                if (properties.length === 0) {
                    const failMsg = `SYSTEM NOTE: The database search returned NO properties matching the criteria. Inform the user politely.`;
                    chatContext.push({ role: "system", content: failMsg });
                    const failResponse = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: chatContext,
                        response_format: { type: "json_object" }
                    });
                    const failData = JSON.parse(failResponse.choices[0].message.content);
                    chatContext.push({ role: "assistant", content: JSON.stringify(failData) });
                    return failData.human_response;
                }

                const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
                const propertyList = properties.map(p =>
                    `🏡 *${p.title}*\n📍 ${p.location}\n💰 ₹${(p.price / 10000000).toFixed(2)} Cr\n🔗 Link: ${baseUrl}/properties/${p.id}`
                ).join('\n\n');

                const successMsg = `SYSTEM NOTE: The database found these properties:\n${propertyList}\n\nPresent these clearly and ASK if they want to schedule a SITE VISIT for any of them.`;
                chatContext.push({ role: "system", content: successMsg });
                const successResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: chatContext,
                    response_format: { type: "json_object" }
                });
                const successData = JSON.parse(successResponse.choices[0].message.content);
                chatContext.push({ role: "assistant", content: JSON.stringify(successData) });
                return successData.human_response;
            }

            if (intent === 'SCHEDULE_SITE_VISIT') {
                if (!params.visit_date || params.visit_date.includes('YYYY')) {
                    const validationMsg = "SYSTEM NOTE: You attempted to schedule a visit but the DATE or TIME is missing or invalid. You MUST ask the user for a specific date and time before you can use the SCHEDULE_SITE_VISIT intent.";
                    chatContext.push({ role: "system", content: validationMsg });
                    const retryResponse = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: chatContext,
                        response_format: { type: "json_object" }
                    });
                    const retryData = JSON.parse(retryResponse.choices[0].message.content);
                    chatContext.push({ role: "assistant", content: JSON.stringify(retryData) });
                    return retryData.human_response;
                }
                
                console.log(`\n[ACTION] AI scheduling site visit for Lead: ${phone} on ${params.visit_date}`);
                
                const lead = await db.getLeadByPhone(phone);

                if (lead) {
                    const leadId = lead.id;
                    await db.scheduleVisit(
                        leadId,
                        params.visit_property_id,
                        params.visit_date,
                        agencyId,
                        `Scheduled via WhatsApp AI. User requested: ${params.visit_date}`
                    );
                    
                    const confirmationMsg = `SYSTEM NOTE: Site visit has been successfully recorded in the database. Confirm this to the user professionally, mentioning the property name and visit date/time.`;
                    chatContext.push({ role: "system", content: confirmationMsg });
                    const confirmResponse = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: chatContext,
                        response_format: { type: "json_object" }
                    });
                    const confirmData = JSON.parse(confirmResponse.choices[0].message.content);
                    chatContext.push({ role: "assistant", content: JSON.stringify(confirmData) });
                    return confirmData.human_response;
                } else {
                    return "I'm sorry, I couldn't find your lead record to schedule the visit. Could you please tell me your name again?";
                }
            }

            return parsed.human_response || "I am still learning how to help you.";

        } catch (e) {
            console.error('[Error processing JSON AI output]:', e.message);
            console.error('[Raw AI Response]:', responseText);
            return "I apologize, my system encountered an error processing that request. Please try briefly stating your preferred date and time again.";
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
        content: msg.content.split('\n[SYSTEM NOTE:')[0].trim()
    }));
}

function logMessage(phone, role, content) {
    if (!sessions[phone]) {
        sessions[phone] = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
    }
    sessions[phone].push({ role, content });
    console.log(`[LOG] Manually logged ${role} message for ${phone}`);
}

module.exports = { processMessage, getChats, logMessage };
