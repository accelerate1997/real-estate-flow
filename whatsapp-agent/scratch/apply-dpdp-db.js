require('dotenv').config({ path: '../.env' });
const { pool } = require('../database/db');

const sql = `
-- Run DPDP Act migrations
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS lead_consents (
    id VARCHAR(15) PRIMARY KEY,
    lead_id VARCHAR(15) REFERENCES leads(id) ON DELETE CASCADE,
    consent_status VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    consent_clause TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_audit_logs (
    id VARCHAR(15) PRIMARY KEY,
    user_id VARCHAR(15) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(15),
    ip_address VARCHAR(45),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fix chat_logs foreign key constraint for cascading delete
ALTER TABLE chat_logs DROP CONSTRAINT IF EXISTS chat_logs_lead_id_fkey;
ALTER TABLE chat_logs ADD CONSTRAINT chat_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
`;

async function main() {
    try {
        console.log("🚀 Executing DPDP database migrations on remote PostgreSQL...");
        await pool.query(sql);
        console.log("✅ PostgreSQL migrations completed successfully!");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await pool.end();
    }
}

main();
