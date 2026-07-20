require('dotenv').config({ path: '../.env' });
const { pool } = require('../database/db');

async function main() {
    try {
        console.log("🚀 Initializing deletion of all leads and cascading data...");
        
        // Execute the deletion
        const res = await pool.query('DELETE FROM leads RETURNING id');
        
        console.log(`✅ Successfully deleted ${res.rows.length} leads and all their cascading data (chat logs, site visits, campaign logs, and consents) from the production database!`);
    } catch (e) {
        console.error("❌ Deletion failed:", e.message);
    } finally {
        await pool.end();
    }
}

main();
