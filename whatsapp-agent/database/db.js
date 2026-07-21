const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/rajesh_realestate';

// Dynamically handle Docker internal networking for production database if running on Linux
if (process.platform === 'linux' && connectionString.includes('31.97.231.139:5436')) {
    console.log("🐳 [Database] Running in production Linux container. Rewriting DATABASE_URL to use internal Coolify network.");
    connectionString = connectionString.replace('31.97.231.139:5436', 'v0ws8kk8okogwsgw80o0go8s:5432');
}

console.log(`🔌 [Database] Connecting to PostgreSQL at ${connectionString.split('@')[1] || connectionString}`);

const pool = new Pool({
    connectionString,
    // Add SSL support for production databases like Neon/AWS RDS, or when NODE_ENV is set to production
    ssl: connectionString.includes('sslmode=') || 
         connectionString.includes('render.com') || 
         connectionString.includes('neon.tech') || 
         process.env.NODE_ENV === 'production'
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
        
        // Dynamic migration for white-label columns
        console.log('🔄 [Database] Checking and running schema migrations...');
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS "customDomain" VARCHAR(255) UNIQUE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS "templateId" VARCHAR(50) DEFAULT 'classic';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR(50) DEFAULT '#DC2626';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS "secondaryColor" VARCHAR(50) DEFAULT '#1E293B';
            ALTER TABLE leads ADD COLUMN IF NOT EXISTS whitelisted BOOLEAN DEFAULT FALSE;
        `);
        console.log('✅ [Database] Schema migrations completed successfully!');
    } catch (err) {
        console.error('❌ [Database] Failed to initialize schema or migrations:', err.message);
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

