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
    try {
        const { phone } = req.params;
        const cleanPhone = phone.replace(/[^\d]/g, '');
        console.log(`\n💬 [Chat Engine] Fetching history for: ${cleanPhone}`);
        const chats = await db.getChatLogs(cleanPhone);
        res.json({ success: true, chats });
    } catch(err) {
        console.error("Fetch chats error:", err);
        res.status(500).json({ error: "Failed to fetch chat logs" });
    }
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

        // Evolution API sends 'messages.upsert' or 'MESSAGES_UPSERT' for new messages
        const normalizedEvent = event ? event.toLowerCase() : '';
        if (normalizedEvent !== 'messages.upsert') {
            return res.sendStatus(200);
        }

        const msg = Array.isArray(data) ? data[0] : data;

        // Anti-loop and timeout logic
        const rawTimestamp = msg?.messageTimestamp || (req.body.date_time ? Math.floor(new Date(req.body.date_time).getTime() / 1000) : null);
        if (rawTimestamp) {
            const age = Math.floor(Date.now() / 1000) - rawTimestamp;
            if (age > 60 && age < 3600) {
                return res.sendStatus(200);
            }
        }

        // Acknowledge receipt early
        res.sendStatus(200);

        const key = msg?.key;
        const msgId = key?.id;
        const remoteJid = key?.remoteJid;
        const fromMe = key?.fromMe;
        const message = msg?.message;

        if (msgId && isDuplicate(msgId)) return;

        if (message && remoteJid && !fromMe) {
            const text = message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption;

            const phoneClean = remoteJid.split('@')[0];

            if (text) {
                console.log(`\n📨 Received from ${phoneClean}: ${text}`);

                const instanceName = req.body.instance || req.body.data?.instance || 'Default';
                const agencyId = instanceName.startsWith('Agency_') ? instanceName.split('_')[1] : null;

                let isEnabled = await db.isAgentEnabled(agencyId);
                
                recentWebhooks.unshift({
                    time: new Date().toISOString(),
                    instanceName,
                    agencyId,
                    isEnabled,
                    sender: phoneClean
                });
                if (recentWebhooks.length > 10) recentWebhooks.pop();

                if (!isEnabled) return;

                // Process with AI
                const reply = await processMessage(text, phoneClean, agencyId);
                console.log(`💬 Replying to ${phoneClean}: ${reply}`);

                await sendMessage(phoneClean, reply, instanceName);
            }
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        if (!res.headersSent) res.sendStatus(500);
    }
});

// WhatsApp Instance Connection Management
app.post('/api/whatsapp/connect', async (req, res) => {
    try {
        const { agencyId, phoneNumber } = req.body;
        if (!agencyId || !phoneNumber) return res.status(400).json({ error: 'Missing fields' });

        const evoUrl = process.env.EVOLUTION_API_URL;
        const evoKey = process.env.EVOLUTION_API_KEY;
        const instanceName = `Agency_${agencyId}`;

        // 0. Cleanup existing
        try {
            await fetch(`${evoUrl}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': evoKey } });
        } catch (e) {}

        // 1. Create fresh
        const createRes = await fetch(`${evoUrl}/instance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
            body: JSON.stringify({ instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" })
        });
        const createData = await createRes.json();

        if (createData?.qrcode?.base64) {
            return res.json({ success: true, instanceName, qr: createData.qrcode.base64 });
        }
        res.status(500).json({ error: 'Failed to retrieve QR code' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/properties/match', async (req, res) => {
    try {
        const { propertyId } = req.body;
        const matchCount = await db.matchProperty(propertyId);
        res.json({ success: true, matchesFound: matchCount });
    } catch(err) { res.status(500).json({ error: "Match engine error" }); }
});

app.post('/api/visits/schedule', async (req, res) => {
    try {
        const { leadId, propertyId, visitDate, agencyId, notes } = req.body;
        const visit = await db.scheduleVisit(leadId, propertyId, visitDate, agencyId, notes);
        res.json({ success: true, visitId: visit.id });
    } catch(err) { res.status(500).json({ error: "Failed to schedule visit" }); }
});

app.get('/api/visits/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;
        const visits = await db.getVisits(agencyId);
        res.json({ success: true, visits });
    } catch(err) { res.status(500).json({ error: "Failed to fetch visits" }); }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 AI Agent Server running on port ${PORT}`);
});
