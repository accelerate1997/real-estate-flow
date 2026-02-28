require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processMessage, getChats } = require('./openai_service');
const { sendMessage } = require('./evolution');

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoint for Dashboard to fetch live AI Chat History
app.get('/api/chats/:phone', (req, res) => {
    const phone = req.params.phone;
    if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
    }
    const history = getChats(phone);
    res.json({ chats: history });
});

const PORT = process.env.PORT || 80;

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
        const remoteJid = key?.remoteJid;
        const fromMe = key?.fromMe;
        const message = msg?.message;

        // Skip our own messages
        if (message && remoteJid && !fromMe) {
            const text = message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption;

            const phoneClean = remoteJid.split('@')[0];

            if (text) {
                console.log(`\n📨 Received from ${phoneClean}: ${text}`);

                // Extract instance name from webhook body (Format usually: "Agency_1234")
                const instanceName = req.body.instance || 'Default';
                const agencyId = instanceName.startsWith('Agency_') ? instanceName.split('_')[1] : null;

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

        // 1. Create or fetch instance from Evolution API
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

        // Sometimes instance might already exist. 
        // If the creation returns the QR base64 right away, send it:
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

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Rajesh Real Estate WhatsApp Webhook running on port ${PORT}`);
    console.log(`Waiting for Evolution API connections...`);
});
