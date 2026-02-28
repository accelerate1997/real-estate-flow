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

            if (requirements.location && requirements.location.toLowerCase() !== 'any') {
                filters.push(`location ~ "${requirements.location}"`);
            }

            if (requirements.budget && requirements.budget > 0) {
                // Add a small buffer to budget (e.g. + 10%) so strict filtering isn't too rigid
                const maxBudget = requirements.budget * 1.1;
                filters.push(`price <= ${maxBudget}`);
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
            // Check if lead already exists for this phone and agency
            const existingLeads = await pb.collection('leads').getList(1, 1, {
                filter: pb.filter('phone = {:phone} && agencyId = {:agencyId}', { phone, agencyId })
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
                const existingReq = existingLeads.items[0].requirement || '';

                // Only overwrite requirement if we got more details
                if (requirementText.length > existingReq.length) {
                    leadData.requirement = requirementText;
                } else {
                    delete leadData.requirement;
                }

                // If name was already set and we only have the default now, keep the old one
                if (existingLeads.items[0].name && !params.name) {
                    delete leadData.name;
                }

                await pb.collection('leads').update(leadId, leadData);
                console.log(`[DB] Updated existing Lead ${leadId} for ${phone}`);
            } else {
                // Create new lead
                leadData.status = 'New Lead';
                await pb.collection('leads').create(leadData);
                console.log(`[DB] Created new Lead for ${phone}`);
            }

        } catch (err) {
            console.error('[DB Error] Failed to upsert Lead:', err.message);
        }
    }
};
