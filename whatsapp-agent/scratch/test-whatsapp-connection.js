const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testConnection() {
    try {
        const res = await pool.query("SELECT metadata FROM users WHERE email = 'jashavantgoswami@gmail.com'");
        if (res.rows.length === 0) {
            console.error("❌ User jashavantgoswami@gmail.com not found in database.");
            return;
        }

        const metadata = res.rows[0].metadata || {};
        const token = metadata.whatsappToken;
        const phoneId = metadata.whatsappPhoneNumberId;
        const wabaId = metadata.whatsappBusinessAccountId;

        if (!token || !phoneId) {
            console.error("❌ WhatsApp configuration is missing in user metadata.", metadata);
            return;
        }

        console.log(`📡 Testing connection to Meta Graph API for Phone ID: ${phoneId}...`);
        
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (metaRes.ok) {
            const data = await metaRes.json();
            console.log("✅ Meta Config is WORKING!");
            console.log(`   Verified Display Name: ${data.verified_name}`);
            console.log(`   Display Phone Number: ${data.display_phone_number}`);
            console.log(`   Platform: ${data.platform_type}`);
            console.log(`   Quality Rating: ${data.code_verification_status}`);
        } else {
            const errData = await metaRes.json().catch(() => ({}));
            console.error("❌ Meta Config is INVALID or FAILED!");
            console.error(`   Error Status: ${metaRes.status}`);
            console.error(`   Error Details:`, JSON.stringify(errData, null, 2));
        }
    } catch (e) {
        console.error("❌ Test script error:", e.message);
    } finally {
        await pool.end();
    }
}

testConnection();
