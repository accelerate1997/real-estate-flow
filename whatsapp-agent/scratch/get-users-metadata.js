const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function test() {
    try {
        const res = await pool.query('SELECT id, email, name, role, metadata FROM users');
        console.log("=== Users in Database ===");
        res.rows.forEach(u => {
            console.log(`User: ${u.name || 'No Name'} (${u.email}) - Role: ${u.role}`);
            console.log(`  ID: ${u.id}`);
            console.log(`  Metadata:`, JSON.stringify(u.metadata, null, 2));
        });
    } catch (e) {
        console.error("Error fetching users:", e.message);
    } finally {
        await pool.end();
    }
}

test();
