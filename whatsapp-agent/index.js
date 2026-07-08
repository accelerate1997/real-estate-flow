require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./database');
const { pool, initDB, autoMigrateIfEmpty } = require('./database/db');
const { processMessage } = require('./openai_service');
const { sendMessage } = require('./evolution');
const followupEngine = require('./followup_engine');
const { uploadToR2 } = require('./database/r2');

// Start Follow-up Engine
followupEngine.startEngine();

const app = express();
app.use(cors());

// Configure JSON and urlencoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'rajesh_secret_key_123';

// 1. Setup Static File Serving for Uploaded Files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.get('/api/files/:collection/:id/:filename', (req, res) => {
    const { collection, id, filename } = req.params;
    const filePath = path.join(uploadsDir, collection, id, filename);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (r2PublicUrl) {
        const cleanUrl = r2PublicUrl.replace(/\/$/, '');
        return res.redirect(`${cleanUrl}/${collection}/${id}/${filename}`);
    }
    
    const pbUrl = (process.env.POCKETBASE_URL || 'http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/').replace(/\/$/, '');
    const fallbackUrl = `${pbUrl}/api/files/${collection}/${id}/${filename}`;
    res.redirect(fallbackUrl);
});

// Configure Multer Storage for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const collection = req.params.collection || 'general';
        const tempDir = path.join(uploadsDir, 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Helper to generate 15-char string IDs matching PocketBase's ID format
function generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper to parse PocketBase filters to SQL WHERE clauses
function translateFilter(filterStr) {
    if (!filterStr) return { sql: '', params: [] };
    
    let sql = filterStr;
    const params = [];
    let paramIndex = 1;
    
    // Replace double ampersand and pipe
    sql = sql.replace(/&&/g, ' AND ').replace(/\|\|/g, ' OR ');
    
    // Match operators: a = "b", a != "b", a ~ "b", a >= "b", a <= "b", a > "b", a < "b"
    const regex = /(\b[a-zA-Z_]+[a-zA-Z0-9_]*\b)\s*(=|!=|~|>=|<=|>|<)\s*("([^"]*)"|'([^']*)'|([0-9.-]+))/g;
    
    sql = sql.replace(regex, (match, field, op, valueExpr, valDq, valSq, valNum) => {
        const rawVal = valDq !== undefined ? valDq : (valSq !== undefined ? valSq : valNum);
        
        // Escape keywords that are double-quoted in SQL
        const sqlField = `"${field}"`;
        let sqlOp = op;
        let sqlVal = rawVal;
        
        if (op === '~') {
            sqlOp = 'LIKE';
            sqlVal = `%${rawVal}%`;
        }
        
        params.push(sqlVal);
        const placeholder = `$${paramIndex++}`;
        return `${sqlField} ${sqlOp} ${placeholder}`;
    });
    
    return { sql: 'WHERE ' + sql, params };
}

// Helper to expand relationships in fetched records
async function expandRecords(collectionName, records) {
    if (!records || records.length === 0) return records;
    
    const newRecords = [];
    for (const r of records) {
        const copy = { ...r };
        copy.expand = {};
        
        // Ensure steps / arrays are parsed if stored as strings
        if (copy.projectAmenities && typeof copy.projectAmenities === 'string') {
            try { copy.projectAmenities = JSON.parse(copy.projectAmenities); } catch (e) {}
        }
        if (copy.images && typeof copy.images === 'string') {
            try { copy.images = JSON.parse(copy.images); } catch (e) {}
        }
        if (copy.videos && typeof copy.videos === 'string') {
            try { copy.videos = JSON.parse(copy.videos); } catch (e) {}
        }
        if (copy.steps && typeof copy.steps === 'string') {
            try { copy.steps = JSON.parse(copy.steps); } catch (e) {}
        }

        if (collectionName === 'properties') {
            if (r.createdBy) {
                const userRes = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [r.createdBy]);
                if (userRes.rows.length > 0) copy.expand.createdBy = userRes.rows[0];
            }
        } else if (collectionName === 'matches') {
            if (r.lead_id) {
                const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [r.lead_id]);
                if (leadRes.rows.length > 0) copy.expand.lead_id = leadRes.rows[0];
            }
            if (r.property_id) {
                const propRes = await pool.query('SELECT * FROM properties WHERE id = $1', [r.property_id]);
                if (propRes.rows.length > 0) {
                    const p = propRes.rows[0];
                    if (p.images && typeof p.images === 'string') {
                        try { p.images = JSON.parse(p.images); } catch (e) {}
                    }
                    copy.expand.property_id = p;
                }
            }
        } else if (collectionName === 'site_visits') {
            if (r.lead) {
                const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [r.lead]);
                if (leadRes.rows.length > 0) copy.expand.lead = leadRes.rows[0];
            }
            if (r.property) {
                const propRes = await pool.query('SELECT * FROM properties WHERE id = $1', [r.property]);
                if (propRes.rows.length > 0) {
                    const p = propRes.rows[0];
                    if (p.images && typeof p.images === 'string') {
                        try { p.images = JSON.parse(p.images); } catch (e) {}
                    }
                    copy.expand.property = p;
                }
            }
        } else if (collectionName === 'lead_followups') {
            if (r.lead) {
                const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1', [r.lead]);
                if (leadRes.rows.length > 0) copy.expand.lead = leadRes.rows[0];
            }
            if (r.sequence) {
                const seqRes = await pool.query('SELECT * FROM sequences WHERE id = $1', [r.sequence]);
                if (seqRes.rows.length > 0) {
                    const seq = seqRes.rows[0];
                    if (typeof seq.steps === 'string') seq.steps = JSON.parse(seq.steps);
                    copy.expand.sequence = seq;
                }
            }
        }
        newRecords.push(copy);
    }
    return newRecords;
}

// Auth Middleware to decode Bearer Token
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (e) {}
    }
    next();
});

// DEBUG CACHE for Webhooks
const recentWebhooks = [];

// --- Authentication Endpoints ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }
        
        const exist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (exist.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const id = generateId();
        const hash = await bcrypt.hash(password, 10);
        
        await pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, "agentEnabled", "isActive", created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, NOW(), NOW())`,
            [id, email, hash, name || '', role || 'agent']
        );

        const record = { id, email, name, role: role || 'agent', agentEnabled: true, isActive: true };
        const token = jwt.sign(record, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, record });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userRes.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact your agency owner.' });
        }

        const record = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            agentEnabled: user.agentEnabled,
            isActive: user.isActive
        };
        const token = jwt.sign(record, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, record });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: err.message });
    }
});

// --- Generic Collections REST API Routes ---

// 1. GET List / Full List
app.get('/api/collections/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { filter, sort, page, perPage } = req.query;

        // Verify table exists
        const tableCheck = await pool.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = $1", 
            [collection]
        );
        if (tableCheck.rows.length === 0) {
            return res.status(404).json({ message: `Collection ${collection} not found` });
        }

        const { sql: whereSql, params } = translateFilter(filter);

        let orderSql = '';
        if (sort) {
            const isDesc = sort.startsWith('-');
            const field = isDesc ? sort.substring(1) : sort;
            orderSql = `ORDER BY "${field}" ${isDesc ? 'DESC' : 'ASC'}`;
        } else {
            orderSql = 'ORDER BY created_at DESC';
        }

        // Count total items
        const countQuery = `SELECT COUNT(*) FROM "${collection}" ${whereSql}`;
        const countRes = await pool.query(countQuery, params);
        const totalItems = parseInt(countRes.rows[0].count);

        let limitOffsetSql = '';
        let currentPage = 1;
        let currentPerPage = 100000; // Large number for full list
        
        if (page && perPage) {
            currentPage = parseInt(page);
            currentPerPage = parseInt(perPage);
            const offset = (currentPage - 1) * currentPerPage;
            limitOffsetSql = `LIMIT ${currentPerPage} OFFSET ${offset}`;
        }

        const selectQuery = `SELECT * FROM "${collection}" ${whereSql} ${orderSql} ${limitOffsetSql}`;
        const dataRes = await pool.query(selectQuery, params);
        
        const expandedRows = await expandRecords(collection, dataRes.rows);

        const totalPages = Math.ceil(totalItems / currentPerPage);

        // PocketBase format response
        res.json({
            page: currentPage,
            perPage: currentPerPage,
            totalPages,
            totalItems,
            items: expandedRows
        });
    } catch (err) {
        console.error(`Error fetching collection ${req.params.collection}:`, err);
        res.status(500).json({ message: err.message });
    }
});

// 2. GET One Record
app.get('/api/collections/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        
        const selectQuery = `SELECT * FROM "${collection}" WHERE id = $1 LIMIT 1`;
        const dataRes = await pool.query(selectQuery, [id]);
        if (dataRes.rows.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        
        const expanded = await expandRecords(collection, dataRes.rows);
        res.json(expanded[0]);
    } catch (err) {
        console.error(`Error fetching record from ${req.params.collection}:`, err);
        res.status(500).json({ message: err.message });
    }
});

// 3. CREATE Record (Supports Multer Form-Data File Uploads)
app.post('/api/collections/:collection', upload.fields([{ name: 'images' }, { name: 'videos' }]), async (req, res) => {
    try {
        const { collection } = req.params;
        const newId = generateId();

        // Check if table exists
        const tableCheck = await pool.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = $1", 
            [collection]
        );
        if (tableCheck.rows.length === 0) {
            return res.status(404).json({ message: `Collection ${collection} not found` });
        }

        const body = { ...req.body };

        // Handle uploaded files
        const imageFiles = req.files && req.files['images'] ? req.files['images'] : [];
        const videoFiles = req.files && req.files['videos'] ? req.files['videos'] : [];

        const imageNames = [];
        const videoNames = [];

        if (imageFiles.length > 0 || videoFiles.length > 0) {
            const recordUploadDir = path.join(uploadsDir, collection, newId);
            fs.mkdirSync(recordUploadDir, { recursive: true });

            for (const file of imageFiles) {
                const destPath = path.join(recordUploadDir, file.filename);
                fs.renameSync(file.path, destPath);
                imageNames.push(file.filename);
                
                // Upload to Cloudflare R2
                const r2Key = `${collection}/${newId}/${file.filename}`;
                await uploadToR2(destPath, r2Key);
            }
            for (const file of videoFiles) {
                const destPath = path.join(recordUploadDir, file.filename);
                fs.renameSync(file.path, destPath);
                videoNames.push(file.filename);
                
                // Upload to Cloudflare R2
                const r2Key = `${collection}/${newId}/${file.filename}`;
                await uploadToR2(destPath, r2Key);
            }
        }

        // Add special columns
        body.id = newId;

        // Parse custom field types
        if (collection === 'properties') {
            body.images = JSON.stringify(imageNames);
            body.videos = JSON.stringify(videoNames);
            if (body.projectAmenities && typeof body.projectAmenities === 'string') {
                try { JSON.parse(body.projectAmenities); } catch (e) { body.projectAmenities = JSON.stringify(body.projectAmenities.split(',')); }
            }
        } else if (collection === 'sequences') {
            if (body.steps && typeof body.steps === 'string') {
                // Keep it stringified for DB insert
            } else if (body.steps) {
                body.steps = JSON.stringify(body.steps);
            }
        }

        const fields = [];
        const placeholders = [];
        const values = [];
        let pIdx = 1;

        // Fetch valid columns from DB to only insert columns that exist
        const columnsRes = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
            [collection]
        );
        const validColumns = columnsRes.rows.map(c => c.column_name);

        for (let [key, val] of Object.entries(body)) {
            // Check camelCase and PascalCase column names
            let matchedCol = validColumns.find(c => c.toLowerCase() === key.toLowerCase());
            if (matchedCol) {
                fields.push(`"${matchedCol}"`);
                placeholders.push(`$${pIdx++}`);
                
                // Parse numbers/booleans appropriately
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                values.push(val);
            }
        }

        const insertQuery = `INSERT INTO "${collection}" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        const insertRes = await pool.query(insertQuery, values);
        
        const expanded = await expandRecords(collection, insertRes.rows);
        res.json(expanded[0]);
    } catch (err) {
        console.error(`Error creating record in ${req.params.collection}:`, err);
        res.status(500).json({ message: err.message });
    }
});

// 4. UPDATE Record
app.patch('/api/collections/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const body = { ...req.body };

        // Fetch valid columns
        const columnsRes = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
            [collection]
        );
        const validColumns = columnsRes.rows.map(c => c.column_name);

        const fields = [];
        const values = [];
        let pIdx = 1;

        for (let [key, val] of Object.entries(body)) {
            let matchedCol = validColumns.find(c => c.toLowerCase() === key.toLowerCase());
            if (matchedCol && matchedCol !== 'id') {
                fields.push(`"${matchedCol}" = $${pIdx++}`);
                
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                
                if (matchedCol === 'steps' || matchedCol === 'projectAmenities' || matchedCol === 'images' || matchedCol === 'videos') {
                    if (typeof val !== 'string') {
                        val = JSON.stringify(val);
                    }
                }
                values.push(val);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);
        const updateQuery = `UPDATE "${collection}" SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${pIdx} RETURNING *`;
        const updateRes = await pool.query(updateQuery, values);
        
        if (updateRes.rows.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        const expanded = await expandRecords(collection, updateRes.rows);
        res.json(expanded[0]);
    } catch (err) {
        console.error(`Error updating record in ${req.params.collection}:`, err);
        res.status(500).json({ message: err.message });
    }
});

// 5. DELETE Record
app.delete('/api/collections/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        
        const deleteQuery = `DELETE FROM "${collection}" WHERE id = $1 RETURNING *`;
        const deleteRes = await pool.query(deleteQuery, [id]);
        if (deleteRes.rows.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error(`Error deleting record from ${req.params.collection}:`, err);
        res.status(500).json({ message: err.message });
    }
});

// --- Existing REST & Webhook API Endpoints (Preserved Exactly) ---

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

// Health Check for Render/Docker/Coolify
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'AGENT_ALIVE_V2', recentWebhooks });
});

app.post('/webhook', async (req, res) => {
    try {
        console.log("🔥 INCOMING WEBHOOK:", JSON.stringify(req.body, null, 2));
        const { event, data } = req.body;

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

        // Process message de-duplication inside webhook handler
        const processedMessages = new Map();
        const CACHE_TTL = 5 * 60 * 1000;
        function isDuplicate(id) {
            const now = Date.now();
            if (processedMessages.has(id)) return true;
            processedMessages.set(id, now);
            return false;
        }

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

        try {
            await fetch(`${evoUrl}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': evoKey } });
        } catch (e) {}

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
        const { leadId, propertyId, visitDate, visitTime, agencyId, notes } = req.body;
        const visit = await db.scheduleVisit(leadId, propertyId, visitDate, visitTime, agencyId, notes);
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
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        await initDB();
        await autoMigrateIfEmpty();
        app.listen(PORT, () => {
            console.log(`🚀 Unified API & Agent Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Failed to start database & server:", err.message);
        process.exit(1);
    }
}
startServer();

