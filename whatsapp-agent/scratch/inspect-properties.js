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
        const res = await pool.query("SELECT * FROM properties WHERE location ILIKE '%Malad%' OR title ILIKE '%Minimalist%'");
        console.log(`Found ${res.rows.length} matching properties:`);
        res.rows.forEach(p => {
            console.log(`\n- ID: ${p.id}`);
            console.log(`  Title: "${p.title}"`);
            console.log(`  Category: "${p.propertyCategory}"`);
            console.log(`  Type: "${p.bhkType}"`);
            console.log(`  Location: "${p.location}"`);
            console.log(`  Price: ${p.price}`);
            console.log(`  TxType: "${p.transactionType}"`);
            console.log(`  AgencyId: "${p.agencyId}"`);
            console.log(`  Description: "${p.description}"`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}
main();
