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

CONVERSATION FLOW & LEAD QUALIFICATION:
1. Greeting & Identity:
   - If SYSTEM NOTE says [LEAD_EXISTS: false], your VERY FIRST priority is to greet the user and ask for their name.
   - Example: "Hello! I am Aria, your dedicated real estate assistant. Before we explore properties, may I know your name so I can personalize your search?"
   - DO NOT show property details or links until you have captured a name.
   - Once they provide a name, set the "name" parameter in your JSON.
2. Lead Recognition:
   - If [LEAD_EXISTS: true], use their name (LEAD_NAME) in your greeting (e.g., "Welcome back, [Name]!").
3. Requirement Gathering & Lead Qualification (CRITICAL):
   - Before searching or recommending properties, you MUST qualify the lead. Do NOT show listings immediately when they simply say "Buy" or "Rent".
   - Ask polite, professional questions to gather:
     * Preferred Location (e.g. Bandra, Thane, BKC)
     * Target Budget Range (e.g. Under ₹1.5 Cr, ₹2-4 Cr)
     * Property Size / BHK (e.g. 2BHK, 3BHK)
   - Keep the intent as "GENERAL_CHAT" while you are conversing to qualify their requirements.
4. Property Presentation (SEARCH_PROPERTIES):
   - Use "SEARCH_PROPERTIES" intent ONLY after you have gathered a preferred Location and either their Budget or BHK size.
   - Once you have these criteria, perform the search and display the matching listings.
5. Site Visit Scheduling:
   - You MUST ask for a preferred DATE and TIME.
   - Use "SCHEDULE_SITE_VISIT" intent ONLY after you have a specific Date and Time from the user.

CRITICAL RULES:
- LANGUAGE ADAPTATION: Under SYSTEM NOTE, check for [LEAD_PREFERRED_LANGUAGE: ...]. You MUST conduct the entire conversation (all human responses) in that specified language (e.g. Hindi, Marathi, Gujarati, Spanish, Arabic). If not specified, default to English.
- DATA PRIVACY: NEVER ask for their WhatsApp or phone number.
- ANTI-HALLUCINATION: Only discuss properties mentioned in the SYSTEM NOTE search results.
- PROPERTY LINKS: Whenever you present properties, YOU MUST ALWAYS include the direct "🔗 Link" provided in the search data. Inform the user they can click the link to see more photos and details.

OUTPUT FORMAT (JSON ONLY):
{
  "intent": "GENERAL_CHAT" | "SEARCH_PROPERTIES" | "SCHEDULE_SITE_VISIT",
  "human_response": "What you actually say back to the user",
  "parameters": {
     "name": "User Name",
     "bhk": "e.g. 2BHK, 3BHK",
     "location": "e.g. South Mumbai",
     "budget_in_rupees": "numeric value only",
     "purpose": "Personal or Investment",
     "visit_date": "YYYY-MM-DD",
     "visit_time": "HH:mm",
     "visit_property_id": "Record ID of the property"
  }
}`;

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
                content: log.content
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
            leadNote = `[LEAD_EXISTS: true] [LEAD_NAME: ${lead.name || 'Unknown'}] [LEAD_REQS: ${lead.requirement || 'None'}] [LEAD_PREFERRED_LANGUAGE: ${lead.preferredLanguage || 'English'}]`;
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
        const updatedLead = await db.upsertLead(cleanPhone, agencyId, { ...params, isChatUpdate: true });
        leadIdFound = updatedLead ? updatedLead.id : leadIdFound;

        // Log messages
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
                const failContext = [...chatContext, { role: "system", content: "SYSTEM NOTE: No properties found. Inform user gracefully." }];
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

            const successMsg = `SYSTEM NOTE: Found properties:\n${propertyList}\n\nPresent them and ask about a site visit.`;
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
        return "I'm having a little trouble connecting to my database. Could you try again in a moment?";
    }
}

async function getChats(phone) {
    return await db.getChatLogs(phone);
}

async function polishTemplateWithAI(rawPrompt) {
    try {
        const systemPrompt = `You are an expert AI WhatsApp Business Template Architect. Your task is to take a raw real estate message description and convert it into a polished, professional WABA (WhatsApp Business API) template.

RULES:
1. Polish the text to sound highly professional, polite, and engaging for real estate prospects.
2. Identify all dynamic placeholders (like name, property title, budget, date, time) and replace them with sequential variables starting at {{1}} (e.g., {{1}}, {{2}}, {{3}}).
3. IMPORTANT META RULE: A template cannot start or end with a variable. Ensure there is static text before the first variable (e.g., "Hello {{1}}") and static text (or punctuation like a dot/signature) after the last variable (e.g., "{{2}} group." or "Best regards, {{3}}.").
4. Recommend a category: "MARKETING" (for promos, follow-ups) or "UTILITY" (for appointments, OTPs, verification).
5. Generate a valid WABA name: lowercase letters, numbers, and underscores only. Max 50 characters.

Return a JSON object matching this schema:
{
  "name": "string (lowercase and underscores only)",
  "category": "MARKETING | UTILITY",
  "bodyText": "string (the polished template body)",
  "variables": ["string explaining variable 1", "string explaining variable 2", ...]
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Raw draft: "${rawPrompt}"` }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error("AI Template Polish Error:", error.message);
        throw error;
    }
}

module.exports = { processMessage, getChats, polishTemplateWithAI };
