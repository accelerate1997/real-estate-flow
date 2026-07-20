require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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
        const res = await pool.query('SELECT * FROM leads');
        console.log(`Found ${res.rows.length} leads:`);
        res.rows.forEach(l => {
            console.log(`\n- ID: ${l.id}`);
            console.log(`  Name: "${l.name}"`);
            console.log(`  Phone: "${l.phone}"`);
            console.log(`  AgencyId: "${l.agencyId}"`);
            console.log(`  Requirement: "${l.requirement}"`);
            console.log(`  Target BHK: "${l.target_bhk}"`);
            console.log(`  Location: "${l.target_location}"`);
            console.log(`  Budget: ${l.max_budget}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}
main();
