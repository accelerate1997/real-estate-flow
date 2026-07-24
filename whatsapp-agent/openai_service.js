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

const SYSTEM_PROMPT = `You are Aria, a premium real estate assistant. Handle inquiries, showcase listings, and schedule site visits.
Tone: Sophisticated, helpful, warm.

Flow:
1. Greet: If [LEAD_EXISTS: false], greet and ask for name first. Do not show property details/links without a name. Set "name" parameter.
2. Recognize: If [LEAD_EXISTS: true], greet by name (LEAD_NAME).
3. Qualify: Collect requirements step-by-step by asking targeted questions based on user's choices:
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
4. Search: Use "SEARCH_PROPERTIES" intent only after Location and either Budget or BHK/Size are known.
5. Schedule: Use "SCHEDULE_SITE_VISIT" intent once user specifies date and time.

Rules:
- Language: Check [LEAD_PREFERRED_LANGUAGE: ...] in SYSTEM NOTE. Reply in that language. Default: English.
- Privacy: NEVER ask for WhatsApp/phone number.
- Anti-Hallucination: Discuss ONLY properties in SYSTEM NOTE search results or details provided in INTERESTED_PROPERTY_DETAILS.
- Links: Always include the exact "🔗 Link" from search data when presenting properties. Tell user to click it.
- User Preference Overrides: If the user shows interest in a specific property (e.g. in INTERESTED_PROPERTY_DETAILS), prioritize providing details and booking a site visit. Do NOT warn, apologize, or lecture them about budget/BHK criteria mismatches; treat their current interest as a valid preference override.

Output format (JSON ONLY, no markdown/code blocks):
{
  "intent": "GENERAL_CHAT" | "SEARCH_PROPERTIES" | "SCHEDULE_SITE_VISIT",
  "human_response": "Reply message",
  "parameters": {
     "name": "User Name",
     "buy_or_rent": "Buy | Rent",
     "property_category": "Residential | Commercial | Plots & Lands",
     "construction_status": "New projects | Ready to move",
     "property_type": "Apartment | Bungalow | Villas | Shop | Office Space",
     "size": "e.g. 2BHK or 1500 sqft",
     "bhk": "e.g. 2BHK (if residential)",
     "location": "e.g. Bandra",
     "budget_in_rupees": numeric_value,
     "purpose": "Personal | Investment",
     "urgency": "e.g. Immediate, 1 month, 3 months",
     "visit_date": "YYYY-MM-DD",
     "visit_time": "HH:mm",
     "visit_property_id": "Record ID"
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
            const mappedHistory = history.map(log => ({
                role: log.role === 'user' ? 'user' : 'assistant',
                content: log.content
            }));
            
            // Limit history loaded from DB to last 10 messages to optimize token usage
            const recentHistory = mappedHistory.slice(-10);
            sessions[cleanPhone] = [
                { role: "system", content: SYSTEM_PROMPT },
                ...recentHistory
            ];
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
        let interestedPropertyId = null;

        // Scan for property Reference ID in the user's message (e.g. Ref: abc123xyz789def)
        const refMatch = userInput.match(/Ref:\s*([a-z0-9]{15})/i);
        if (refMatch) {
            const potentialId = refMatch[1];
            const propExists = await db.verifyPropertyExists(potentialId);
            if (propExists) {
                console.log(`🎯 [Property Interest] Detected interest in property ID: ${potentialId} from message.`);
                interestedPropertyId = potentialId;
            }
        }

        if (lead) {
            leadNote = `[LEAD_EXISTS: true] [LEAD_NAME: ${lead.name || 'Unknown'}] [LEAD_REQS: ${lead.requirement || 'None'}] [LEAD_PREFERRED_LANGUAGE: ${lead.preferredLanguage || 'English'}]`;
            leadIdFound = lead.id;
            if (lead.interestedPropertyId && !interestedPropertyId) {
                interestedPropertyId = lead.interestedPropertyId;
            }
        }

        let interestedPropertyNote = '';
        if (interestedPropertyId) {
            const property = await db.getPropertyById(interestedPropertyId);
            if (property) {
                const priceVal = property.price || 0;
                let priceText = priceVal >= 10000000 ? `₹${(priceVal / 10000000).toFixed(2)} Cr` : `₹${(priceVal / 100000).toFixed(2)} Lakh`;
                interestedPropertyNote = ` [INTERESTED_PROPERTY_DETAILS: ID: "${property.id}", Title: "${property.title}", Location: "${property.location}", Price: "${priceText}", BHK: "${property.bhkType || 'N/A'}", Description: "${property.description || ''}"]`;
            }
        }

        const finalInput = `SYSTEM NOTE: ${dateNote} ${leadNote}${interestedPropertyNote}\nUser: ${userInput}`;
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
        if (interestedPropertyId) {
            params.interestedPropertyId = interestedPropertyId;
        }
        const updatedLead = await db.upsertLead(cleanPhone, agencyId, { ...params, isChatUpdate: true });
        leadIdFound = updatedLead ? updatedLead.id : leadIdFound;

        let finalReplyText = parsed.human_response || "How else can I assist you?";
        let assistantContextText = responseText;

        // 5. Intent Handling
        if (intent === 'SEARCH_PROPERTIES') {
            const properties = await db.findProperties({
                budget: params.budget_in_rupees,
                bhk: params.bhk,
                location: params.location,
                buy_or_rent: params.buy_or_rent
            });

            if (properties.length === 0) {
                const tempContext = [...chatContext, { role: "assistant", content: responseText }];
                const failContext = [...tempContext, { role: "system", content: "SYSTEM NOTE: No properties found. Inform user gracefully." }];
                const retryResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: failContext,
                    response_format: { type: "json_object" }
                });
                const retryText = retryResponse.choices[0].message.content;
                const retryData = JSON.parse(retryText);
                finalReplyText = retryData.human_response || "I couldn't find any properties matching those criteria at the moment.";
                assistantContextText = retryText;
            } else {
                // Auto-link first property to lead record
                const topPropertyId = properties[0].id;
                if (!interestedPropertyId && topPropertyId && agencyId) {
                    interestedPropertyId = topPropertyId;
                    params.interestedPropertyId = topPropertyId;
                    const reUpdatedLead = await db.upsertLead(cleanPhone, agencyId, { ...params, isChatUpdate: true });
                    if (reUpdatedLead) leadIdFound = reUpdatedLead.id;
                }

                const propertyList = properties.map(p => {
                    const priceVal = p.price || 0;
                    let priceText = priceVal >= 10000000 ? `₹${(priceVal / 10000000).toFixed(2)} Cr` : `₹${(priceVal / 100000).toFixed(2)} Lakh`;
                    const baseUrl = process.env.BASE_URL || 'https://realestateflow.elevetoai.com';
                    const leadId = leadIdFound || '';
                    return `🏡 *${p.title}*\n📍 ${p.location}\n💰 ${priceText}\n🔗 Link: ${baseUrl}/api/track-click?leadId=${leadId}&propertyId=${p.id}`;
                }).join('\n\n');

                const successMsg = `SYSTEM NOTE: Found properties:\n${propertyList}\n\nPresent them and ask about a site visit.`;
                const tempContext = [...chatContext, { role: "assistant", content: responseText }];
                const finalContext = [...tempContext, { role: "system", content: successMsg }];
                const finalResponse = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: finalContext,
                    response_format: { type: "json_object" }
                });
                const finalResponseText = finalResponse.choices[0].message.content;
                const finalData = JSON.parse(finalResponseText);
                finalReplyText = finalData.human_response || "Here are the matching properties.";
                assistantContextText = finalResponseText;
            }
        } else if (intent === 'SCHEDULE_SITE_VISIT') {
            const propertyId = params.visit_property_id || interestedPropertyId || (lead ? lead.interestedPropertyId : null);
            let visitDate = params.visit_date;
            
            // Auto-fallback date if placeholder or invalid
            if (!visitDate || visitDate.includes('YYYY') || isNaN(new Date(visitDate).getTime())) {
                const tmr = new Date();
                tmr.setDate(tmr.getDate() + 1);
                visitDate = tmr.toISOString().split('T')[0];
            }
            
            if (propertyId && leadIdFound) {
                await db.scheduleVisit(
                    leadIdFound,
                    propertyId,
                    visitDate,
                    params.visit_time || '16:00',
                    agencyId,
                    `Scheduled via AI. User requested: ${visitDate} at ${params.visit_time || '16:00'}`
                );
                
                const confirmationMsg = "SYSTEM NOTE: Site visit recorded in database successfully. Confirm professionally to user.";
                const tempContext = [...chatContext, { role: "assistant", content: responseText }];
                const finalContext = [...tempContext, { role: "user", content: confirmationMsg }];
                const confirmRes = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...finalContext],
                    response_format: { type: "json_object" }
                });
                const confirmText = confirmRes.choices[0].message.content;
                const confirmData = JSON.parse(confirmText);
                finalReplyText = confirmData.human_response || "Your site visit has been scheduled.";
                assistantContextText = confirmText;
            }
        }

        // 6. Log both User input and Assistant response to database
        await db.logChat(cleanPhone, "user", userInput, agencyId, leadIdFound);
        await db.logChat(cleanPhone, "assistant", finalReplyText, agencyId, leadIdFound);
        
        // 7. Save Assistant Context in memory session
        chatContext.push({ role: "assistant", content: finalReplyText });

        // Limit the in-memory chat session to the last 10 messages + system prompt
        if (chatContext.length > 11) {
            const systemPrompt = chatContext[0];
            const recentHistory = chatContext.slice(-10);
            sessions[cleanPhone] = [systemPrompt, ...recentHistory];
        }

        return finalReplyText;

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
