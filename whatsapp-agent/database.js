require('dotenv').config();
const { pool } = require('./database/db');
const EventEmitter = require('events');
const dbEvents = new EventEmitter();

// Helper to generate 15-char string IDs matching PocketBase's ID format
function generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    dbEvents,
    pool,
    
    // No-op authenticate to keep interface signature compatible
    async authenticate() {},

    /**
     * Normalizes a date string.
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
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const query = 'SELECT * FROM leads WHERE phone LIKE $1 LIMIT 1';
        const res = await pool.query(query, [`%${cleanPhone}%`]);
        return res.rows.length > 0 ? res.rows[0] : null;
    },

    /**
     * Finds properties matching the specified requirements.
     */
    async findProperties(requirements) {
        try {
            const filters = [];
            const params = [];
            let paramIndex = 1;

            if (requirements.bhk && requirements.bhk.toLowerCase() !== 'any') {
                const match = requirements.bhk.match(/\d+/);
                if (match) {
                    filters.push(`"bhkType" LIKE $${paramIndex}`);
                    params.push(`%${match[0]}%`);
                    paramIndex++;
                } else {
                    const cleanBhk = requirements.bhk.replace(/\s+/g, '').toUpperCase();
                    filters.push(`"bhkType" LIKE $${paramIndex}`);
                    params.push(`%${cleanBhk}%`);
                    paramIndex++;
                }
            }

            if (requirements.location && requirements.location.trim().toLowerCase() !== 'any' && requirements.location.trim() !== '') {
                filters.push(`location LIKE $${paramIndex}`);
                params.push(`%${requirements.location.trim()}%`);
                paramIndex++;
            }

            if (requirements.budget && parseFloat(requirements.budget) > 0) {
                filters.push(`price <= $${paramIndex}`);
                params.push(parseFloat(requirements.budget));
                paramIndex++;
            }

            const filterString = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
            const query = `SELECT * FROM properties ${filterString} ORDER BY price ASC LIMIT 5`;
            console.log(`[DB] Searching properties with query: ${query} params: ${JSON.stringify(params)}`);

            const res = await pool.query(query, params);
            return res.rows.map(prop => ({
                id: prop.id,
                title: prop.title,
                price: prop.price,
                location: prop.location,
                bhk: prop.bhkType
            }));

        } catch (err) {
            console.error('Error fetching properties from PostgreSQL:', err);
            return [];
        }
    },

    /**
     * Upserts a lead.
     */
    async upsertLead(phone, agencyId, params = {}) {
        if (!agencyId) {
            console.log("[DB] No agencyId provided, skipping lead upsert.");
            return;
        }

        try {
            const cleanPhone = phone.replace(/[^\d]/g, '');
            console.log(`[DB] Upserting Lead with Phone: ${cleanPhone}, Agency: ${agencyId}`);
            
            // Check if lead already exists for this phone and agency
            const checkQuery = 'SELECT * FROM leads WHERE phone LIKE $1 AND "agencyId" = $2 LIMIT 1';
            const checkRes = await pool.query(checkQuery, [`%${cleanPhone}%`, agencyId]);

            // Combine details into a requirement overview
            const reqParts = [];
            if (params.buy_or_rent) reqParts.push(`Looking to ${params.buy_or_rent}`);
            if (params.property_category) reqParts.push(`a ${params.property_category} property`);
            if (params.property_type) reqParts.push(`(${params.property_type})`);
            if (params.construction_status) reqParts.push(`[${params.construction_status}]`);
            if (params.size) reqParts.push(`of size ${params.size}`);
            if (params.bhk && !params.size) reqParts.push(`(${params.bhk})`);
            if (params.location) reqParts.push(`in ${params.location}`);
            if (params.budget_in_rupees) {
                const budgetNum = parseFloat(params.budget_in_rupees);
                if (budgetNum >= 10000000) {
                    reqParts.push(`with a budget of ₹${(budgetNum / 10000000).toFixed(2)}Cr`);
                } else if (budgetNum >= 100000) {
                    reqParts.push(`with a budget of ₹${(budgetNum / 100000).toFixed(2)} Lakh`);
                } else {
                    reqParts.push(`with a budget of ₹${budgetNum.toLocaleString('en-IN')}`);
                }
            }
            if (params.purpose) reqParts.push(`for ${params.purpose} purpose`);
            if (params.urgency) reqParts.push(`[Urgency: ${params.urgency}]`);
            if (params.timeframe) reqParts.push(`[Timeframe: ${params.timeframe}]`);

            const requirementText = reqParts.length > 0 ? reqParts.join(' ') + '.' : (params.requirement || '');

            const targetBhk = params.bhk || "";
            const targetLocation = params.location || "";
            const maxBudget = params.budget_in_rupees ? parseFloat(params.budget_in_rupees) : 0;
            const name = params.name && params.name !== 'WhatsApp Contact' ? params.name : null;

            let followUpDate = null;
            if (params.follow_up_date) {
                const dateObj = new Date(params.follow_up_date);
                if (!isNaN(dateObj.getTime())) followUpDate = dateObj;
            }

            if (checkRes.rows.length > 0) {
                const existingLead = checkRes.rows[0];
                const leadId = existingLead.id;

                let finalRequirement = existingLead.requirement;
                if (requirementText && (requirementText.length > (existingLead.requirement || '').length)) {
                    finalRequirement = requirementText;
                }

                let finalName = existingLead.name;
                if (name) {
                    finalName = name;
                }                // Update existing lead
                const updateQuery = `
                    UPDATE leads 
                    SET name = COALESCE($1, name), 
                        requirement = $2, 
                        target_bhk = COALESCE($3, target_bhk), 
                        target_location = COALESCE($4, target_location), 
                        max_budget = COALESCE($5, max_budget),
                        date = COALESCE($6, date),
                        verified = COALESCE($7, verified),
                        "preferredLanguage" = COALESCE($8, "preferredLanguage"),
                        marketing_opt_in = COALESCE($9, marketing_opt_in),
                        updated_at = NOW()
                    WHERE id = $10
                    RETURNING *
                `;
                const updateRes = await pool.query(updateQuery, [
                    finalName, finalRequirement, targetBhk || null, targetLocation || null, 
                    maxBudget || null, followUpDate,
                    params.verified !== undefined ? params.verified : null,
                    params.preferredLanguage || null,
                    params.marketing_opt_in !== undefined ? params.marketing_opt_in : null,
                    leadId
                ]);
                console.log(`[DB] Updated Lead ${leadId}`);
                const updatedLead = updateRes.rows[0];
                
                // Log consent update if consent status changed
                if (params.marketing_opt_in !== undefined && existingLead.marketing_opt_in !== params.marketing_opt_in) {
                    const consentId = generateId();
                    await pool.query(
                        'INSERT INTO lead_consents (id, lead_id, consent_status, source, consent_clause) VALUES ($1, $2, $3, $4, $5)',
                        [consentId, leadId, params.marketing_opt_in ? 'active' : 'withdrawn', 'web_form', 'Consent updated via lead form/system']
                    );
                }

                if (!params.isChatUpdate) {
                    dbEvents.emit('lead_created', updatedLead);
                }

                // Run matching engine for updated lead
                try {
                    await this.matchLead(updatedLead.id);
                } catch (matchErr) {
                    console.error("Auto-matching failed on lead update:", matchErr.message);
                }

                return updatedLead;
            } else {
                // Insert new lead
                const newId = generateId();
                const optIn = params.marketing_opt_in !== undefined ? params.marketing_opt_in : true;
                const insertQuery = `
                    INSERT INTO leads (id, "agencyId", name, phone, requirement, target_bhk, target_location, max_budget, status, date, verified, "preferredLanguage", marketing_opt_in, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
                    RETURNING *
                `;
                const insertRes = await pool.query(insertQuery, [
                    newId, agencyId, name || 'WhatsApp Contact', cleanPhone, requirementText,
                    targetBhk, targetLocation, maxBudget, 'New Lead', followUpDate,
                    params.verified === true, params.preferredLanguage || 'English',
                    optIn
                ]);
                const newLead = insertRes.rows[0];
                console.log(`[DB] Created new Lead: ${newLead.id}`);

                // Log consent for new lead
                const consentId = generateId();
                await pool.query(
                    'INSERT INTO lead_consents (id, lead_id, consent_status, source, consent_clause) VALUES ($1, $2, $3, $4, $5)',
                    [consentId, newLead.id, optIn ? 'active' : 'withdrawn', 'web_form', 'Consent given via website property enquiry form']
                );

                dbEvents.emit('lead_created', newLead);

                // Enroll in sequence
                try {
                    const seqRes = await pool.query(
                        'SELECT * FROM sequences WHERE name LIKE $1 AND agency_id = $2 LIMIT 1',
                        ['%Welcome%', agencyId]
                    );
                    if (seqRes.rows.length > 0) {
                        await this.enrollLeadInSequence(newLead.id, seqRes.rows[0].id, agencyId);
                    }
                } catch (e) {
                    console.error("Sequence enrollment error:", e.message);
                }

                // Run matching engine for new lead
                try {
                    await this.matchLead(newLead.id);
                } catch (matchErr) {
                    console.error("Auto-matching failed on lead create:", matchErr.message);
                }

                return newLead;
            }

        } catch (err) {
            console.error('[DB Error] Failed to upsert Lead:', err.message);
        }
    },

    /**
     * Checks if the AI Agent is enabled for a given agency.
     */
    async isAgentEnabled(agencyId) {
        try {
            let user;
            if (!agencyId) {
                const res = await pool.query('SELECT * FROM users LIMIT 1');
                if (res.rows.length === 0) return true;
                user = res.rows[0];
            } else {
                const res = await pool.query('SELECT * FROM users WHERE id = $1', [agencyId]);
                if (res.rows.length === 0) return true;
                user = res.rows[0];
            }
            
            if (user.agentEnabled === false) {
                return false;
            }
            return true;
        } catch (err) {
            console.error(`[DB] Error fetching agentEnabled status for agency ${agencyId}:`, err.message);
            return true;
        }
    },

    /**
     * Finds and creates matches for a new property against existing leads.
     */
    async matchProperty(propertyId) {
        try {
            const propRes = await pool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
            if (propRes.rows.length === 0) return 0;
            const property = propRes.rows[0];
            
            const filters = ['"agencyId" = $1'];
            const params = [property.agencyId];
            let paramIndex = 2;

            if (property.bhkType) {
                 const match = property.bhkType.match(/\d+/);
                 const cleanBhk = match ? match[0] : property.bhkType;
                 filters.push(`(target_bhk IS NULL OR target_bhk = '' OR target_bhk ILIKE 'any' OR target_bhk LIKE $${paramIndex})`);
                 params.push(`%${cleanBhk}%`);
                 paramIndex++;
            }
            if (property.location) {
                const locKeywords = property.location.split(/[\s,]+/).filter(k => k.length > 3);
                if (locKeywords.length > 0) {
                    const locFilters = [];
                    for (const kw of locKeywords) {
                        locFilters.push(`target_location LIKE $${paramIndex}`);
                        params.push(`%${kw}%`);
                        paramIndex++;
                    }
                    filters.push(`(${locFilters.join(' OR ')})`);
                }
            }
            if (property.price && property.price > 0) {
                filters.push(`(max_budget IS NULL OR max_budget = 0 OR max_budget >= $${paramIndex})`);
                params.push(property.price);
                paramIndex++;
            }
            
            const filterString = filters.join(' AND ');
            const leadsQuery = `SELECT * FROM leads WHERE ${filterString}`;
            console.log(`[DB] Matching Leads for Property ${propertyId}. Filter: ${filterString}`);
            
            const leadsRes = await pool.query(leadsQuery, params);
            
            let matchCount = 0;
            for (const lead of leadsRes.rows) {
                try {
                    // Check de-duplication
                    const existQuery = 'SELECT * FROM matches WHERE lead_id = $1 AND property_id = $2 LIMIT 1';
                    const existRes = await pool.query(existQuery, [lead.id, property.id]);
                    
                    if (existRes.rows.length === 0) {
                        const newMatchId = generateId();
                        await pool.query(
                            `INSERT INTO matches (id, lead_id, property_id, agency_id, status, created_at, updated_at)
                             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                            [newMatchId, lead.id, property.id, property.agencyId, 'Pending Review']
                        );
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
     * Finds and creates matches for a new/updated lead against existing properties.
     */
    async matchLead(leadId) {
        try {
            const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
            if (leadRes.rows.length === 0) return 0;
            const lead = leadRes.rows[0];
            const agencyId = lead.agencyId;
            if (!agencyId) return 0;

            // If the lead has no parameters specified yet, don't generate matches to avoid spam
            if (!lead.target_bhk && !lead.target_location && (!lead.max_budget || lead.max_budget === 0)) {
                console.log(`[DB] Lead ${leadId} has no requirements set yet. Skipping match generation.`);
                return 0;
            }

            const filters = ['"agencyId" = $1'];
            const params = [agencyId];
            let paramIndex = 2;

            if (lead.target_bhk) {
                 const match = lead.target_bhk.match(/\d+/);
                 const cleanBhk = match ? match[0] : lead.target_bhk;
                 if (cleanBhk && cleanBhk.toLowerCase() !== 'any') {
                     filters.push(`("bhkType" LIKE $${paramIndex})`);
                     params.push(`%${cleanBhk}%`);
                     paramIndex++;
                 }
            }
            if (lead.target_location && lead.target_location.toLowerCase() !== 'any') {
                const locKeywords = lead.target_location.split(/[\s,]+/).filter(k => k.length > 3);
                if (locKeywords.length > 0) {
                    const locFilters = [];
                    for (const kw of locKeywords) {
                        locFilters.push(`location LIKE $${paramIndex}`);
                        params.push(`%${kw}%`);
                        paramIndex++;
                    }
                    filters.push(`(${locFilters.join(' OR ')})`);
                } else if (lead.target_location.trim().length > 0) {
                    filters.push(`location LIKE $${paramIndex}`);
                    params.push(`%${lead.target_location.trim()}%`);
                    paramIndex++;
                }
            }
            if (lead.max_budget && parseFloat(lead.max_budget) > 0) {
                filters.push(`(price IS NULL OR price = 0 OR price <= $${paramIndex})`);
                params.push(parseFloat(lead.max_budget));
                paramIndex++;
            }

            const filterString = filters.join(' AND ');
            const propsQuery = `SELECT * FROM properties WHERE ${filterString}`;
            console.log(`[DB] Matching Properties for Lead ${leadId}. Filter: ${filterString}`);
            
            const propsRes = await pool.query(propsQuery, params);
            
            let matchCount = 0;
            for (const prop of propsRes.rows) {
                try {
                    // Check de-duplication
                    const existQuery = 'SELECT * FROM matches WHERE lead_id = $1 AND property_id = $2 LIMIT 1';
                    const existRes = await pool.query(existQuery, [lead.id, prop.id]);
                    
                    if (existRes.rows.length === 0) {
                        const newMatchId = generateId();
                        await pool.query(
                            `INSERT INTO matches (id, lead_id, property_id, agency_id, status, created_at, updated_at)
                             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                            [newMatchId, lead.id, prop.id, agencyId, 'Pending Review']
                        );
                        matchCount++;
                        console.log(`[DB] Created Match: Lead ${lead.name} <-> Property ${prop.title}`);
                    }
                } catch(e) {
                    console.error("Error creating match:", e.message);
                }
            }
            return matchCount;
        } catch(e) {
             console.error("Match Lead Engine Error:", e.message);
             return 0;
        }
    },

    /**
     * Prepares data to send a WhatsApp alert for a specific match
     */
    async getMatchAlertData(matchId) {
        const query = `
            SELECT m.*, l.name as lead_name, l.phone as lead_phone,
                   p.title as prop_title, p.location as prop_location, p.price as prop_price, p."bhkType" as prop_bhk
            FROM matches m
            JOIN leads l ON m.lead_id = l.id
            JOIN properties p ON m.property_id = p.id
            WHERE m.id = $1
            LIMIT 1
        `;
        const res = await pool.query(query, [matchId]);
        if (res.rows.length === 0) throw new Error("Match not found");
        const row = res.rows[0];
        
        const instanceName = `Agency_${row.agency_id}`;
        const priceCrores = row.prop_price ? (row.prop_price / 10000000).toFixed(2) + ' Cr' : 'On Request';
        const messageText = `Hi ${row.lead_name || 'there'},\n\nYou recently asked us to find a property for you. We just listed an exclusive new property that perfectly matches your requirements:\n\n🏡 *${row.prop_title}*\n📍 *Location*: ${row.prop_location}\n🛏️ *Config*: ${row.prop_bhk}\n💰 *Price*: ₹${priceCrores}\n\nWould you like to see photos or schedule a site visit? Reply to this message and our AI assistant will arrange everything!`;

        return { leadPhone: row.lead_phone, messageText, instanceName };
    },

    async updateMatchStatus(matchId, status) {
        await pool.query('UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2', [status, matchId]);
    },

    /**
     * Schedules a site visit for a lead.
     */
    async scheduleVisit(leadId, propertyId, visitDate, visitTime, agencyId, notes = '') {
        try {
            const cleanAgencyId = (agencyId && typeof agencyId === 'string') ? agencyId.replace("Agency_", "") : agencyId;
            const normalizedDate = this.normalizeDate(visitDate);
            const newId = generateId();

            const query = `
                INSERT INTO site_visits (id, lead, property, visit_date, visit_time, status, notes, agency_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING *
            `;
            const res = await pool.query(query, [
                newId, leadId, propertyId, normalizedDate || visitDate, visitTime, 'Scheduled', notes, cleanAgencyId
            ]);
            console.log(`[DB] Scheduled Site Visit ${newId} for Lead ${leadId}`);
            return res.rows[0];
        } catch (err) {
            console.error('[DB Error] Failed to schedule site visit:', err.message);
            throw err;
        }
    },

    /**
     * Fetches all site visits for an agency.
     */
    async getVisits(agencyId) {
        try {
            const aid = agencyId.replace("Agency_", "");
            const query = `
                SELECT sv.*, 
                       l.id as lead_id, l.name as lead_name, l.phone as lead_phone, l.requirement as lead_requirement,
                       p.id as prop_id, p.title as prop_title, p.price as prop_price, p.location as prop_location
                FROM site_visits sv
                LEFT JOIN leads l ON sv.lead = l.id
                LEFT JOIN properties p ON sv.property = p.id
                WHERE sv.agency_id = $1
                ORDER BY sv.visit_date DESC
            `;
            const res = await pool.query(query, [aid]);
            
            // Format expand object for code compatibility
            return res.rows.map(row => ({
                id: row.id,
                lead: row.lead,
                property: row.property,
                visit_date: row.visit_date,
                visit_time: row.visit_time,
                status: row.status,
                notes: row.notes,
                agency_id: row.agency_id,
                expand: {
                    lead: {
                        id: row.lead_id,
                        name: row.lead_name,
                        phone: row.lead_phone,
                        requirement: row.lead_requirement
                    },
                    property: {
                        id: row.prop_id,
                        title: row.prop_title,
                        price: row.prop_price,
                        location: row.prop_location
                    }
                }
            }));
        } catch (err) {
            console.error('[DB Error] Failed to fetch visits:', err.message);
            return [];
        }
    },

    /**
     * Logs a chat message.
     */
    async logChat(phone, role, content, agencyId, leadId = null) {
        try {
            const newId = generateId();
            const query = `
                INSERT INTO chat_logs (id, phone, role, content, agency_id, lead_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `;
            await pool.query(query, [newId, phone, role, content, agencyId, leadId]);
        } catch (err) {
            console.error('[DB Error] Failed to log chat:', err.message);
        }
    },

    /**
     * Retrieves chat logs for a phone number.
     */
    async getChatLogs(phone) {
        try {
            const cleanPhone = phone.replace(/[^\d]/g, '');
            const query = 'SELECT * FROM chat_logs WHERE phone LIKE $1 ORDER BY created_at ASC';
            const res = await pool.query(query, [`%${cleanPhone}%`]);
            return res.rows.map(r => ({
                role: r.role,
                content: r.content
            }));
        } catch (err) {
            console.error('[DB Error] Failed to fetch chat logs:', err.message);
            return [];
        }
    },

    /**
     * Enrolls a lead into a follow-up sequence.
     */
    async enrollLeadInSequence(leadId, sequenceId, agencyId) {
        try {
            const seqRes = await pool.query('SELECT * FROM sequences WHERE id = $1', [sequenceId]);
            if (seqRes.rows.length === 0) return null;
            const sequence = seqRes.rows[0];
            const steps = sequence.steps || [];
            if (steps.length === 0) return null;
            
            const firstStep = steps[0];
            const nextSendAt = new Date();
            nextSendAt.setHours(nextSendAt.getHours() + (firstStep.delay_hours || 0));

            const newId = generateId();
            const query = `
                INSERT INTO lead_followups (id, lead, sequence, current_step, next_send_at, status, agency_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING *
            `;
            const res = await pool.query(query, [
                newId, leadId, sequenceId, 0, nextSendAt, 'pending', agencyId
            ]);
            console.log(`[DB] Enrolled Lead ${leadId} in Sequence ${sequenceId}. Next send at: ${nextSendAt.toISOString()}`);
            return res.rows[0];
        } catch (err) {
            console.error('[DB Error] Failed to enroll lead in sequence:', err.message);
            return null;
        }
    },

    /**
     * Fetches follow-ups that are due to be sent.
     */
    async getDueFollowups() {
        try {
            const now = new Date();
            const query = `
                SELECT lf.*,
                       l.id as lead_id, l.name as lead_name, l.phone as lead_phone, l.requirement as lead_requirement,
                       s.id as seq_id, s.name as seq_name, s.steps as seq_steps
                FROM lead_followups lf
                LEFT JOIN leads l ON lf.lead = l.id
                LEFT JOIN sequences s ON lf.sequence = s.id
                WHERE lf.status = 'pending' AND lf.next_send_at <= $1
            `;
            const res = await pool.query(query, [now]);
            
            // Format expand object for compatibility
            return res.rows.map(row => ({
                id: row.id,
                lead: row.lead,
                sequence: row.sequence,
                current_step: row.current_step,
                next_send_at: row.next_send_at,
                status: row.status,
                agency_id: row.agency_id,
                expand: {
                    lead: {
                        id: row.lead_id,
                        name: row.lead_name,
                        phone: row.lead_phone,
                        requirement: row.lead_requirement
                    },
                    sequence: {
                        id: row.seq_id,
                        name: row.seq_name,
                        steps: typeof row.seq_steps === 'string' ? JSON.parse(row.seq_steps) : row.seq_steps
                    }
                }
            }));
        } catch (err) {
            console.error('[DB Error] Failed to fetch due follow-ups:', err.message);
            return [];
        }
    },

    /**
     * Updates the status or progress of a follow-up.
     */
    async updateFollowupProgress(followupId, data) {
        try {
            const fields = [];
            const values = [];
            let valIdx = 1;

            for (const [key, val] of Object.entries(data)) {
                fields.push(`"${key}" = $${valIdx}`);
                values.push(val);
                valIdx++;
            }
            
            values.push(followupId);
            const query = `UPDATE lead_followups SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${valIdx}`;
            await pool.query(query, values);
        } catch (err) {
            console.error('[DB Error] Failed to update follow-up progress:', err.message);
        }
    }
};
