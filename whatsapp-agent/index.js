require('dotenv').config();
const express = require('express');
const cors = require('cors');

// DEBUG CACHE for Webhooks
const recentWebhooks = [];
const { processMessage, getChats } = require('./openai_service');
const { sendMessage } = require('./evolution');
const db = require('./database');
const followupEngine = require('./followup_engine');

// Start Follow-up Engine
followupEngine.startEngine();

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoint for Dashboard to fetch live AI Chat History
app.get('/api/chats/:phone', async (req, res) => {
    const phone = req.params.phone;
    if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
    }
    const history = await getChats(phone);
    res.json({ chats: history });
});

// API Endpoint for Voice Agent to log transcripts
const { logMessage } = require('./openai_service');
app.post('/api/chats/log', (req, res) => {
    const { phone, role, content } = req.body;
    if (!phone || !role || !content) {
        return res.status(400).json({ error: "phone, role, and content required" });
    }
    logMessage(phone, role, content);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

// Simple in-memory cache for de-duplication
const processedMessages = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isDuplicate(id) {
    const now = Date.now();
    if (processedMessages.has(id)) {
        return true;
    }
    processedMessages.set(id, now);

    // Periodically clean up old entries
    if (processedMessages.size > 1000) {
        for (const [key, timestamp] of processedMessages.entries()) {
            if (now - timestamp > CACHE_TTL) {
                processedMessages.delete(key);
            }
        }
    }
    return false;
}

// Health Check for Render/Docker/Coolify
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'AGENT_ALIVE_V2', recentWebhooks });
});

app.post('/webhook', async (req, res) => {
    try {
        console.log("🔥 INCOMING WEBHOOK:", JSON.stringify(req.body, null, 2));
        const { event, data } = req.body;
        console.log(`[DEBUG] Event: ${event}, Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);


        // Evolution API sends 'messages.upsert' for new messages
        if (event !== 'messages.upsert') {
            console.log(`[IGNORE] Event type: ${event}`);
            return res.sendStatus(200);
        }

        console.log("✅ Valid message event received.");

        const msg = Array.isArray(data) ? data[0] : data;

        // Anti-loop and timeout logic
        const rawTimestamp = msg?.messageTimestamp || (req.body.date_time ? Math.floor(new Date(req.body.date_time).getTime() / 1000) : null);
        if (rawTimestamp) {
            const age = Math.floor(Date.now() / 1000) - rawTimestamp;
            if (age > 60 && age < 3600) {
                console.log(`[IGNORE] Message too old (${age}s). Ignoring to prevent loops/duplicate replies.`);
                return res.sendStatus(200);
            }
        }

        // Acknowledge receipt early to prevent WhatsApp from aggressively retrying
        res.sendStatus(200);

        const key = msg?.key;
        const msgId = key?.id;
        const remoteJid = key?.remoteJid;
        const fromMe = key?.fromMe;
        const message = msg?.message;

        // Skip if already processed
        if (msgId && isDuplicate(msgId)) {
            console.log(`[IGNORE] Duplicate message ID: ${msgId}`);
            return;
        }

        // Skip our own messages
        if (message && remoteJid && !fromMe) {
            const text = message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption;

            const phoneClean = remoteJid.split('@')[0];

            if (text) {
                console.log(`\n📨 Received from ${phoneClean}: ${text}`);

                // Extract instance name from webhook body (Format usually: "Agency_1234")
                const instanceName = req.body.instance || req.body.data?.instance || 'Default';
                const agencyId = instanceName.startsWith('Agency_') ? instanceName.split('_')[1] : null;

                // Check if AI Agent is enabled for this agency before replying
                let isEnabled = await db.isAgentEnabled(agencyId);
                if (!isEnabled) {
                    console.log(`[IGNORE] AI Agent is disabled for agency ${agencyId || 'default'}.`);
                }

                // Add to debug cache
                recentWebhooks.unshift({
                    time: new Date().toISOString(),
                    instanceName,
                    agencyId,
                    isEnabled,
                    sender: phoneClean
                });
                if (recentWebhooks.length > 10) recentWebhooks.pop();

                if (!isEnabled) return; // Skip actual processing

                // Get AI Response
                const reply = await processMessage(text, phoneClean, agencyId);
                console.log(`💬 Replying to ${phoneClean}: ${reply}`);

                // Send reply back to Evolution API
                await sendMessage(phoneClean, reply, instanceName);
            }
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        if (!res.headersSent) res.sendStatus(500);
    }
});

// API Endpoint for frontend to request WhatsApp connection
app.post('/api/whatsapp/connect', async (req, res) => {
    try {
        const { agencyId, phoneNumber } = req.body;
        if (!agencyId || !phoneNumber) {
            return res.status(400).json({ error: 'Agency ID and Phone Number are required' });
        }

        const evoUrl = process.env.EVOLUTION_API_URL;
        const evoKey = process.env.EVOLUTION_API_KEY;

        if (!evoUrl || !evoKey) {
            // Mock response if Evolution API is not configured yet
            console.log("⚠️ Evolution API not fully configured in .env. Returning Mock QR.");
            return res.json({
                success: true,
                mock: true,
                message: "Mock connection mode.",
                qr: null // In frontend, we'll handle this by showing a placeholder or skipping
            });
        }

        const instanceName = `Agency_${agencyId}`;

        // 0. Force delete any existing instance to ensure a fresh session
        try {
            await fetch(`${evoUrl}/instance/logout/${instanceName}`, { 
                method: 'DELETE', 
                headers: { 'apikey': evoKey }
            });
            await fetch(`${evoUrl}/instance/delete/${instanceName}`, { 
                method: 'DELETE', 
                headers: { 'apikey': evoKey }
            });
            console.log(`[WA] Cleaned up existing instance: ${instanceName}`);
        } catch (e) {
            // Ignore if it didn't exist
        }

        // 1. Create fresh instance from Evolution API
        const createRes = await fetch(`${evoUrl}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evoKey
            },
            body: JSON.stringify({
                instanceName: instanceName,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            })
        });

        const createData = await createRes.json();
        console.log("[WA] Create Response:", JSON.stringify(createData));

        // Return the QR base64 right away if possible:
        if (createData?.qrcode?.base64) {
            return res.json({
                success: true,
                instanceName: instanceName,
                qr: createData.qrcode.base64
            });
        }

        // If it was already created, we just need to get the connect base64:
        const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': evoKey
            }
        });

        const connectData = await connectRes.json();

        if (connectData?.base64) {
            return res.json({
                success: true,
                instanceName: instanceName,
                qr: connectData.base64
            });
        } else if (connectData?.instance?.state === 'open') {
            return res.json({
                success: true,
                instanceName: instanceName,
                connected: true,
                message: "Already connected"
            });
        }

        res.status(500).json({ error: 'Failed to retrieve QR code', details: connectData });

    } catch (error) {
        console.error('API Error /whatsapp/connect:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Endpoint to trigger property match engine
app.post('/api/properties/match', async (req, res) => {
    try {
        const { propertyId } = req.body;
        if (!propertyId) return res.status(400).json({ error: "Property ID required" });
        
        console.log(`\n🔍 [Match Engine] Triggered for Property: ${propertyId}`);
        const matchCount = await db.matchProperty(propertyId);
        res.json({ success: true, matchesFound: matchCount });
    } catch(err) {
        res.status(500).json({ error: "Match engine error" });
    }
});

// API Endpoint to schedule a site visit
app.post('/api/visits/schedule', async (req, res) => {
    try {
        const { leadId, propertyId, visitDate, agencyId, notes } = req.body;
        if (!leadId || !propertyId || !visitDate || !agencyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        console.log(`\n📅 [Visit Engine] Scheduling visit for Lead: ${leadId}`);
        const visit = await db.scheduleVisit(leadId, propertyId, visitDate, agencyId, notes);
        res.json({ success: true, visitId: visit.id });
    } catch(err) {
        console.error("Visit scheduling error:", err);
        res.status(500).json({ error: "Failed to schedule visit" });
    }
});

// API Endpoint to fetch visits for an agency
app.get('/api/visits/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;
        const visits = await db.getVisits(agencyId);
        res.json({ success: true, visits });
    } catch(err) {
        console.error("Fetch visits error:", err);
        res.status(500).json({ error: "Failed to fetch visits" });
    }
});

// API Endpoint to send WhatsApp alert for a match
app.post('/api/properties/alert', async (req, res) => {
    try {
        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ error: "Match ID required" });
        
        console.log(`\n📲 [Alert Engine] Preparing WhatsApp alert for match: ${matchId}`);
        const alertData = await db.getMatchAlertData(matchId);
        
        // Send message via Evolution API
        await sendMessage(alertData.leadPhone, alertData.messageText, alertData.instanceName);
        
        // Update DB status
        await db.updateMatchStatus(matchId, 'Alert Sent');
        
        console.log(`✅ [Alert Engine] Alert sent to ${alertData.leadPhone}`);
        res.json({ success: true });
    } catch(err) {
        console.error("Alert engine error:", err);
        res.status(500).json({ error: "Failed to send alert" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n💎💎💎 AGENT STARTUP 💎💎💎`);
    console.log(`🚀 Rajesh Real Estate WhatsApp Webhook running on port ${PORT}`);
    console.log(`Waiting for Evolution API connections...`);
});
