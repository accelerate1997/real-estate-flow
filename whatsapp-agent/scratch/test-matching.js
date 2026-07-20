require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../database');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=') || connectionString.includes('render.com') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

async function test() {
    try {
        console.log("Connecting to PostgreSQL...");
        // 1. Fetch some existing leads
        const leadsRes = await pool.query('SELECT id, name, requirement, target_bhk, target_location, max_budget FROM leads LIMIT 5');
        console.log(`Found ${leadsRes.rows.length} leads in database.`);
        
        for (const lead of leadsRes.rows) {
            console.log(`\n----------------------------------------`);
            console.log(`Lead Name: ${lead.name}`);
            console.log(`Requirement: "${lead.requirement}"`);
            console.log(`Target BHK: ${lead.target_bhk}, Location: ${lead.target_location}, Budget: ${lead.max_budget}`);
            
            // Trigger matchLead
            console.log(`Running matching engine for this lead...`);
            const matchCount = await db.matchLead(lead.id);
            console.log(`Matches generated/found: ${matchCount}`);
            
            // Query generated matches
            const matchesQuery = `
                SELECT m.id as match_id, m.status, p.title, p.price, p.location, p."bhkType", p."transactionType"
                FROM matches m
                JOIN properties p ON m.property_id = p.id
                WHERE m.lead_id = $1
            `;
            const matchesRes = await pool.query(matchesQuery, [lead.id]);
            console.log(`Total active matches in DB: ${matchesRes.rows.length}`);
            matchesRes.rows.forEach(m => {
                console.log(`  - Property: "${m.title}" | Price: ${m.price} | Location: ${m.location} | Type: ${m.bhkType} | Tx: ${m.transactionType} | Status: ${m.status}`);
            });
        }
    } catch (err) {
        console.error("Test matching error:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

test();
