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

const SYSTEM_PROMPT = `Your name is Aria. You are the official, professional AI Assistant for the Real Estate Agency. Your job is to handle customer inquiries, showcase exclusive property listings, and schedule SITE VISITS for interested buyers.

TONE & PERSONALITY:
- Be sophisticated, helpful, and highly professional. You are a premium real estate concierge.
- Always use a warm, welcoming tone.

CONVERSATION FLOW:
1. Greeting & Identity:
   - If [LEAD_EXISTS: false], your VERY FIRST priority is to greet the user and ask for their name.
   - Example: "Hello! I am Aria, your dedicated real estate assistant. Before we explore properties, may I know your name so I can personalize your search?"
   - DO NOT show property details or links until you have captured a name.
   - Once they provide a name, set the "name" parameter in your JSON.
2. Lead Recognition:
   - If [LEAD_EXISTS: true], use their name (LEAD_NAME) in your greeting.
3. Requirement Gathering:
   - After getting the name, ask for: Location, BHK, and Budget.
4. Site Visit Scheduling:
   - You MUST ask for a preferred DATE and TIME.
   - Use "SCHEDULE_SITE_VISIT" intent once confirmed.

CRITICAL RULES:
- DATA PRIVACY: NEVER ask for their WhatsApp or phone number.
- ANTI-HALLUCINATION: Only discuss properties mentioned in the search results.

INTENTS:
- GENERAL_CHAT, SEARCH_PROPERTIES, SCHEDULE_SITE_VISIT
...
`;

const sessions = {};

async function processMessage(userInput, phone, agencyId) {
    try {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const now = new Date();
        const dateNote = `[CURRENT_DATE: ${now.toDateString()}, CURRENT_TIME: ${now.toLocaleTimeString()}]`;
        
        console.log(`\n[AI] Processing message for ${cleanPhone} (Agency: ${agencyId}) - Date: ${now.toDateString()}`);

        // 1. Manage Session History (Persistent from DB)
        if (!sessions[cleanPhone]) {
            const history = await db.getChatLogs(cleanPhone);
            sessions[cleanPhone] = history.map(log => ({
                role: log.role === 'user' ? 'user' : 'assistant',
                content: log.message
            }));
            
            if (sessions[cleanPhone].length === 0) {
                sessions[cleanPhone].push({ role: "system", content: SYSTEM_PROMPT });
            }
        }
        
        // Ensure the system prompt is up-to-date
        if (sessions[cleanPhone][0]?.role !== 'system') {
            sessions[cleanPhone].unshift({ role: "system", content: SYSTEM_PROMPT });
        } else {
            sessions[cleanPhone][0].content = SYSTEM_PROMPT;
        }

        const chatContext = sessions[cleanPhone];

        // 2. Lead Context Enrichment
        const lead = await db.getLeadByPhone(cleanPhone);
        let leadNote = "[LEAD_EXISTS: false]";
        let leadIdFound = null;
        if (lead) {
            leadNote = `[LEAD_EXISTS: true] [LEAD_NAME: ${lead.name || 'Unknown'}] [LEAD_REQS: ${lead.requirement || 'None'}]`;
            leadIdFound = lead.id;
        }

        const finalInput = `SYSTEM NOTE: ${dateNote} ${leadNote}\nUser: ${userInput}`;
        chatContext.push({ role: "user", content: finalInput });

        // 3. GPT Completion
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatContext,
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const responseText = response.choices[0].message.content;
        const parsed = JSON.parse(responseText);
        const intent = parsed.intent;
        const params = parsed.parameters || {};

        // 4. Capture DATA (Upsert Lead)
        // If AI identified a name, use it. Otherwise keep existing or "WhatsApp Contact"
        const updatedLead = await db.upsertLead(cleanPhone, agencyId, params);
        leadIdFound = updatedLead ? updatedLead.id : leadIdFound;

        // Log messages (to ensure they show up in dashboard now that endpoint is fixed)
        await db.logChat(cleanPhone, "user", userInput, agencyId, leadIdFound);
        await db.logChat(cleanPhone, "assistant", parsed.human_response || responseText, agencyId, leadIdFound);
        
        chatContext.push({ role: "assistant", content: responseText });

        // 5. Intent Handling
        if (intent === 'SEARCH_PROPERTIES') {
            const properties = await db.findProperties({
                budget: params.budget_in_rupees,
                bhk: params.bhk,
                location: params.location
            });

            if (properties.length === 0) {
                const failContext = [...chatContext, { role: "system", content: "SYSTEM NOTE: No properties found matching these criteria. Inform the user gracefully." }];
                const retryResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: failContext,
                    response_format: { type: "json_object" }
                });
                return JSON.parse(retryResponse.choices[0].message.content).human_response;
            }

            const propertyList = properties.map(p => {
                const priceVal = p.price || 0;
                let priceText = priceVal >= 10000000 ? `₹${(priceVal / 10000000).toFixed(2)} Cr` : `₹${(priceVal / 100000).toFixed(2)} Lakh`;
                const baseUrl = process.env.BASE_URL || 'https://realestateflow.elevetoai.com';
                return `🏡 *${p.title}*\n📍 ${p.location}\n💰 ${priceText}\n🔗 Link: ${baseUrl}/properties/${p.id}`;
            }).join('\n\n');

            const successMsg = `SYSTEM NOTE: Found these properties:\n${propertyList}\n\nPresent them and ask about a site visit.`;
            const finalContext = [...chatContext, { role: "system", content: successMsg }];
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: finalContext,
                response_format: { type: "json_object" }
            });

            const finalData = JSON.parse(finalResponse.choices[0].message.content);
            chatContext.push({ role: "assistant", content: JSON.stringify(finalData) });
            return finalData.human_response;
        }

        if (intent === 'SCHEDULE_SITE_VISIT') {
            const propertyId = params.visit_property_id;
            const visitDate = params.visit_date;
            
            if (!propertyId || !visitDate || visitDate.includes('YYYY')) {
                return parsed.human_response;
            }

            if (leadIdFound) {
                await db.scheduleVisit(
                    leadIdFound,
                    propertyId,
                    visitDate,
                    params.visit_time || '',
                    agencyId,
                    `Scheduled via AI. User requested: ${visitDate} at ${params.visit_time}`
                );
                
                const confirmationMsg = "SYSTEM NOTE: Site visit recorded. Confirm professionally.";
                const confirmRes = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatContext, { role: "user", content: confirmationMsg }],
                    response_format: { type: "json_object" }
                });
                return JSON.parse(confirmRes.choices[0].message.content).human_response;
            }
        }

        return parsed.human_response || "How else can I assist you?";

    } catch (error) {
        console.error('Process Message Error:', error.message);
        
        // Handle explicit OpenAI rate limit error 429
        if (error.status === 429) {
            return "Sorry, my OpenAI key has hit its API rate limit or run out of credits! Please check your billing dashboard.";
        }
        return "I'm having a little trouble connecting to my database. Could you try again in a moment?";
    }
}

// Retrieve live chat history from database
async function getChats(phone) {
    return await db.getChatLogs(phone);
}

async function logMessage(phone, role, content, agencyId = null) {
    if (!sessions[phone]) {
        sessions[phone] = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
    }
    sessions[phone].push({ role, content });
    await db.logChat(phone, role, content, agencyId);
    console.log(`[LOG] Manually logged ${role} message for ${phone}`);
}

module.exports = { processMessage, getChats, logMessage };
