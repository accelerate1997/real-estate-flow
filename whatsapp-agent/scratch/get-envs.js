const http = require('http');
const { Client } = require('pg');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/applications/pggwccook48s4ks48cc00cos/envs',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer TSYU03K2BFZPC7TOuJYwQrrZvHfp2s9ugEqYrrUo887bca87'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', async () => {
        try {
            const envs = JSON.parse(data);
            const dbUrlEnv = envs.find(e => e.key === 'DATABASE_URL');
            if (!dbUrlEnv || !dbUrlEnv.value) {
                console.error("DATABASE_URL not found in Coolify environment variables!");
                return;
            }
            
            const dbUrl = dbUrlEnv.value;
            console.log("🔌 Connecting to production PostgreSQL using fetched DATABASE_URL...");
            
            const client = new Client({
                connectionString: dbUrl,
                ssl: dbUrl.includes('sslmode=') || dbUrl.includes('render.com') || dbUrl.includes('neon.tech')
                    ? { rejectUnauthorized: false }
                    : false
            });
            
            await client.connect();
            console.log("🚀 Executing DPDP Act migrations...");
            
            const migrationSql = `
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
            
            await client.query(migrationSql);
            console.log("✅ PostgreSQL migrations completed successfully on production database!");
            await client.end();
        } catch (e) {
            console.error("Error during migration execution:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
