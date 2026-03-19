require('dotenv').config();
const PocketBase = require('pocketbase').default; // Using commonjs export

const pbUrl = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase(pbUrl);

let isAuthenticated = false;

async function authenticate() {
    if (isAuthenticated && pb.authStore.isValid) return;
    try {
        await pb.admins.authWithPassword(email, password);
        isAuthenticated = true;
        console.log("Successfully authenticated with PocketBase as Admin.");
    } catch (err) {
        console.error("Failed to authenticate with PocketBase. Check your credentials.");
        console.error(err.message);
    }
}

module.exports = {
    pb,
    authenticate,
    /**
     * Normalizes a date string to PocketBase compatible format.
     */
    normalizeDate(dateStr) {
        if (!dateStr || dateStr.includes('YYYY')) return null;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString();
        }
        return dateStr;
    },
    /**
     * Finds a lead by phone number.

     * @param {string} phone 
     */
    async getLeadByPhone(phone) {
        await authenticate();
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const records = await pb.collection('leads').getList(1, 1, {
            filter: `phone ~ "${cleanPhone}"`
        });
        return records.totalItems > 0 ? records.items[0] : null;
    },

    /**
     * Finds properties matching the specified requirements.
     * @param {Object} requirements  
     * @param {number} requirements.budget
     * @param {string} requirements.bhk
     * @param {string} requirements.location
     */
    async findProperties(requirements) {
        await authenticate();

        try {
            // Build the filter strictly based on available fields from test_properties.csv
            // Fields: Title, Price, Description, Location, propertyCategory, transactionType, bhkType, carpetArea, builtUpArea, furnishing
            const filters = [];

            if (requirements.bhk && requirements.bhk.toLowerCase() !== 'any') {
                // Extract the first number found (e.g. "2 to 3 bhk" -> "2")
                const match = requirements.bhk.match(/\d+/);
                if (match) {
                    filters.push(`bhkType ~ "${match[0]}"`);
                } else {
                    const cleanBhk = requirements.bhk.replace(/\s+/g, '').toUpperCase();
                    filters.push(`bhkType ~ "${cleanBhk}"`);
                }
            }

            if (requirements.location && requirements.location.trim().toLowerCase() !== 'any' && requirements.location.trim() !== '') {
                filters.push(`location ~ "${requirements.location.trim()}"`);
            }

            if (requirements.budget && parseFloat(requirements.budget) > 0) {
                // Remove any 10% buffer and ensure it's a number
                filters.push(`price <= ${parseFloat(requirements.budget)}`);
            }

            const filterString = filters.length > 0 ? filters.join(' && ') : '';
            console.log(`[DB] Searching properties with filter: ${filterString}`);

            // We only need a few top properties to send to the user
            const result = await pb.collection('properties').getList(1, 5, {
                filter: filterString,
                sort: 'price', // Sort by cheapest matching first
            });

            return result.items.map(prop => ({
                id: prop.id,
                title: prop.title,
                price: prop.price,
                location: prop.location,
                bhk: prop.bhkType
            }));

        } catch (err) {
            console.error('Error fetching properties from PocketBase:', err);
            return [];
        }
    },

    /**
     * Upserts a lead into PocketBase based on phone number and agency.
     * @param {string} phone Original WhatsApp number or extracted number
     * @param {string} agencyId
     * @param {Object} params Extracted parameters from the AI
     */
    async upsertLead(phone, agencyId, params) {
        if (!agencyId) {
            console.log("[DB] No agencyId provided, skipping lead upsert.");
            return;
        }

        await authenticate();

        try {
            // Standardize phone number format (remove + and spaces)
            const cleanPhone = phone.replace(/[^\d]/g, '');
            
            // Check if lead already exists for this phone and agency
            const existingLeads = await pb.collection('leads').getList(1, 1, {
                filter: pb.filter('phone ~ {:phone} && agencyId = {:agencyId}', { 
                    phone: cleanPhone, 
                    agencyId 
                })
            });

            // Combine details into a requirement overview
            const reqParts = [];
            if (params.bhk) reqParts.push(`Looking for ${params.bhk}`);
            if (params.location) reqParts.push(`in ${params.location}`);
            if (params.budget_in_rupees) reqParts.push(`with a budget of ₹${(params.budget_in_rupees / 10000000).toFixed(2)}Cr`);
            if (params.timeframe) reqParts.push(`Target timeframe: ${params.timeframe}`);
            if (params.purpose) reqParts.push(`Purpose: ${params.purpose}`);

            const requirementText = reqParts.length > 0 ? reqParts.join('. ') + '.' : '';

            const leadData = {
                agencyId: agencyId,
                name: params.name || 'WhatsApp Contact',
                phone: phone,
                requirement: requirementText,
                // Synchronize structured fields for automated matching engine
                target_bhk: params.bhk || "",
                target_location: params.location || "",
                max_budget: params.budget_in_rupees ? parseFloat(params.budget_in_rupees) : 0
            };

            // Only update follow-up date if the AI extracted a valid one
            if (params.follow_up_date) {
                // Attempt to parse AI date strings into YYYY-MM-DD or standard Date
                const dateObj = new Date(params.follow_up_date);
                if (!isNaN(dateObj)) {
                    leadData.date = dateObj.toISOString();
                }
            }

            if (existingLeads.totalItems > 0) {
                // Update existing lead safely (merge new data where available)
                const leadId = existingLeads.items[0].id;
                const currentLead = existingLeads.items[0];

                // Merge requirement text
                if (requirementText && (requirementText.length > (currentLead.requirement || '').length || !currentLead.requirement)) {
                    leadData.requirement = requirementText;
                } else {
                    delete leadData.requirement;
                }

                // Preserve name if not provided now
                if (currentLead.name && !params.name) {
                    delete leadData.name;
                }

                await pb.collection('leads').update(leadId, leadData);
                console.log(`[DB] Updated Lead ${leadId} with data:`, JSON.stringify(leadData));
            } else {
                // Create new lead
                leadData.status = 'New Lead';
                await pb.collection('leads').create(leadData);
                console.log(`[DB] Created new Lead for ${phone}`);
            }

        } catch (err) {
            console.error('[DB Error] Failed to upsert Lead:', err.message);
        }
    },

    /**
     * Checks if the AI Agent is enabled for a given agency.
     * @param {string} agencyId
     * @returns {boolean}
     */
    async isAgentEnabled(agencyId) {
        if (!agencyId) return true; // Default to true if no agency ID is provided
        await authenticate();
        try {
            const agency = await pb.collection('users').getOne(agencyId);
            // Default to true if the field doesn't exist yet, to not break existing instances
            if (agency.agentEnabled === false) {
                return false;
            }
            return true;
        } catch (err) {
            console.error(`[DB] Error fetching agentEnabled status for agency ${agencyId}:`, err.message);
            // Default to true on error to ensure we don't accidentally turn off the AI
            return true;
        }
    },

    /**
     * Finds and creates matches for a new property against existing leads.
     */
    async matchProperty(propertyId) {
        await authenticate();
        try {
            const property = await pb.collection('properties').getOne(propertyId);
            
            const filters = [];
            
            // Only match leads within the same agency
            filters.push(`agencyId = "${property.agencyId}"`);

            if (property.bhkType) {
                 const match = property.bhkType.match(/\d+/);
                 if (match) {
                     filters.push(`target_bhk ~ "${match[0]}"`);
                 } else {
                     filters.push(`target_bhk ~ "${property.bhkType}"`);
                 }
            }
            if (property.location) {
                const locKeywords = property.location.split(/[\s,]+/).filter(k => k.length > 3);
                if (locKeywords.length > 0) {
                    const locFilter = locKeywords.map(k => `target_location ~ "${k}"`).join(' || ');
                    filters.push(`(${locFilter})`);
                }
            }
            if (property.price && property.price > 0) {
                filters.push(`max_budget >= ${property.price}`);
            }
            
            const filterString = filters.length > 0 ? filters.join(' && ') : '';
            console.log(`[DB] Matching Leads for Property ${propertyId}. Filter: ${filterString}`);
            
            if (!filterString) return 0;
            
            const leads = await pb.collection('leads').getList(1, 100, {
                 filter: filterString
            });
            
            let matchCount = 0;
            for (const lead of leads.items) {
                try {
                    // CRITICAL: Double check de-duplication by lead record ID and property record ID
                    const existing = await pb.collection('matches').getList(1, 1, {
                        filter: pb.filter('lead_id = {:leadId} && property_id = {:propId}', { 
                            leadId: lead.id, 
                            propId: property.id 
                        })
                    });
                    
                    if (existing.totalItems === 0) {
                        await pb.collection('matches').create({
                            lead_id: lead.id,
                            property_id: property.id,
                            agency_id: property.agencyId,
                            status: "Pending Review"
                        });
                        matchCount++;
                        console.log(`[DB] Created Match: Lead ${lead.name} <-> Property ${property.title}`);
                    }
                } catch(e) {
                    console.error("Error creating match:", e.message);
                }
            }
            return matchCount;
        } catch(e) {
             console.error("Match Engine Error:", e.message);
             return 0;
        }
    },

    /**
     * Prepares data to send a WhatsApp alert for a specific match
     */
    async getMatchAlertData(matchId) {
        await authenticate();
        const match = await pb.collection('matches').getOne(matchId, { expand: 'lead_id,property_id' });
        
        const lead = match.expand.lead_id;
        const property = match.expand.property_id;
        const instanceName = `Agency_${match.agency_id}`;
        
        const priceCrores = property.price ? (property.price / 10000000).toFixed(2) + ' Cr' : 'On Request';
        const messageText = `Hi ${lead.name || 'there'},\n\nYou recently asked us to find a property for you. We just listed an exclusive new property that perfectly matches your requirements:\n\n🏡 *${property.title}*\n📍 *Location*: ${property.location}\n🛏️ *Config*: ${property.bhkType}\n💰 *Price*: ₹${priceCrores}\n\nWould you like to see photos or schedule a site visit? Reply to this message and our AI assistant will arrange everything!`;

        return { leadPhone: lead.phone, messageText, instanceName };
    },

    async updateMatchStatus(matchId, status) {
        await authenticate();
        await pb.collection('matches').update(matchId, { status });
    },

    /**
     * Schedules a site visit for a lead.
     */
    async scheduleVisit(leadId, propertyId, visitDate, visitTime, agencyId, notes = '') {
        await authenticate();
        try {
            const cleanAgencyId = (agencyId && typeof agencyId === 'string') ? agencyId.replace("Agency_", "") : agencyId;
            const normalizedDate = this.normalizeDate(visitDate);

            const data = {
                lead: leadId,
                property: propertyId,
                visit_date: normalizedDate || visitDate,
                visit_time: visitTime,
                status: 'Scheduled',
                notes: notes,
                agency_id: cleanAgencyId
            };
            const record = await pb.collection('site_visits').create(data);
            console.log(`[DB] Scheduled Site Visit ${record.id} for Lead ${leadId}`);
            return record;

        } catch (err) {
            console.error('[DB Error] Failed to schedule site visit:', err.message);
            throw err;
        }
    },

    /**
     * Fetches all site visits for an agency.
     */
    async getVisits(agencyId) {
        await authenticate();
        try {
            const aid = agencyId.replace("Agency_", "");
            const result = await pb.collection('site_visits').getFullList({
                filter: `agency_id = "${aid}"`,
                expand: 'lead,property',
                sort: '-visit_date'
            });
            return result;
        } catch (err) {
            console.error('[DB Error] Failed to fetch visits:', err.message);
            return [];
        }
    }
};
