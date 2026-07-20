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
        console.log("Connecting to Postgres...");
        const usersCountRes = await pool.query('SELECT COUNT(*), role FROM users GROUP BY role');
        console.log("\nUsers by role:");
        usersCountRes.rows.forEach(row => {
            console.log(`- Role: ${row.role}, Count: ${row.count}`);
        });

        const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`Total Users: ${totalUsers.rows[0].count}`);

        const totalLeads = await pool.query('SELECT COUNT(*) FROM leads');
        console.log(`Total Leads: ${totalLeads.rows[0].count}`);

        const totalProperties = await pool.query('SELECT COUNT(*) FROM properties');
        console.log(`Total Properties: ${totalProperties.rows[0].count}`);

        const totalChatLogs = await pool.query('SELECT COUNT(*) FROM chat_logs');
        console.log(`Total Chat Logs: ${totalChatLogs.rows[0].count}`);

    } catch (err) {
        console.error("Database error:", err);
    } finally {
        await pool.end();
    }
}

main();
