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

async function main() {
    try {
        console.log("Deleting existing matches to re-run matches with new logic...");
        const delRes = await pool.query('DELETE FROM matches');
        console.log(`Deleted ${delRes.rowCount} matches.`);

        const leadsRes = await pool.query('SELECT id, name FROM leads');
        console.log(`\nRe-running matching engine for all ${leadsRes.rows.length} leads...`);
        for (const lead of leadsRes.rows) {
            const matchCount = await db.matchLead(lead.id);
            console.log(`- Lead: ${lead.name} -> Generated ${matchCount} matches`);
        }

        console.log("\n--- New Generated Matches in Database ---");
        const matchesQuery = `
            SELECT m.status, l.name as lead_name, l.requirement, p.title, p.price, p.location, p."transactionType"
            FROM matches m
            JOIN leads l ON m.lead_id = l.id
            JOIN properties p ON m.property_id = p.id
        `;
        const matchesRes = await pool.query(matchesQuery);
        console.log(`Total matches in database: ${matchesRes.rows.length}`);
        matchesRes.rows.forEach((row, i) => {
            console.log(`[${i+1}] Lead: "${row.lead_name}" (${row.requirement})`);
            console.log(`    Matched Property: "${row.title}" | Price: ${row.price} | Location: ${row.location} | Tx: ${row.transactionType}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
