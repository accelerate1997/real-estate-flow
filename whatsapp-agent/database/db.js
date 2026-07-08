const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/rajesh_realestate';

console.log(`🔌 [Database] Connecting to PostgreSQL at ${connectionString.split('@')[1] || connectionString}`);

const pool = new Pool({
    connectionString,
    // Add SSL support for production databases like Neon/AWS RDS
    ssl: connectionString.includes('sslmode=') || connectionString.includes('render.com') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

async function initDB() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🔄 [Database] Initializing schema from schema.sql...');
        await pool.query(schemaSql);
        console.log('✅ [Database] Schema successfully initialized!');
    } catch (err) {
        console.error('❌ [Database] Failed to initialize schema:', err.message);
        throw err;
    }
}

async function autoMigrateIfEmpty() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM users');
        const count = parseInt(res.rows[0].count);
        if (count === 0) {
            console.log('🔄 [Database] PostgreSQL "users" table is empty. Running auto-migration from PocketBase...');
            const { runMigration } = require('../scripts/migrate-data');
            await runMigration(false);
            console.log('✅ [Database] Auto-migration complete!');
        } else {
            console.log(`ℹ️ [Database] PostgreSQL has ${count} users. Skipping auto-migration.`);
        }
    } catch (err) {
        console.error('❌ [Database] Auto-migration error:', err.message);
    }
}

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initDB,
    autoMigrateIfEmpty
};

