require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const admin = require('./firebase_admin');

const db = require('./database');
const { pool, initDB, autoMigrateIfEmpty } = require('./database/db');
const { processMessage, polishTemplateWithAI } = require('./openai_service');
const { sendMessage, sendTemplateMessage } = require('./whatsapp');
const followupEngine = require('./followup_engine');
const { uploadToR2 } = require('./database/r2');

// Start Follow-up Engine
followupEngine.startEngine();

// Listen for brand-new lead creations to trigger Instant WhatsApp Outreach
const { dbEvents } = db;
dbEvents.on('lead_created', async (lead) => {
    try {
        console.log(`📡 [Instant Outreach] Triggered for lead ID: ${lead.id} (${lead.phone})`);
        
        // 1. Check if AI Agent is enabled for the agency
        const isEnabled = await db.isAgentEnabled(lead.agencyId);
        if (!isEnabled) {
            console.log(`ℹ️ [Instant Outreach] AI agent is disabled for agency ${lead.agencyId}, skipping outreach.`);
            return;
        }

        // 2. Fetch agency info (to see if they have connected WhatsApp session instance)
        const instanceName = `Agency_${lead.agencyId}`;

        // 3. Draft localized greeting message based on preferred language
        const cleanPhone = lead.phone.replace(/[^\d]/g, '');
        const lang = (lead.preferredLanguage || 'English').toLowerCase();
        let greeting = '';
        if (lang === 'hindi') {
            greeting = `नमस्ते ${lead.name && lead.name !== 'WhatsApp Contact' ? lead.name : ''}! मैं आर्या हूँ, राजेश रियल्टी में आपकी समर्पित रियल एस्टेट एआई असिस्टेंट।\n\nमैंने देखा कि आपने अभी प्रॉपर्टीज के बारे में जानकारी का अनुरोध किया है। क्या आप खरीदना चाहते हैं या किराए पर लेना चाहते हैं? मैं तुरंत आपको बेहतरीन विकल्प दिखा सकती हूँ!`;
        } else if (lang === 'marathi') {
            greeting = `नमस्कार ${lead.name && lead.name !== 'WhatsApp Contact' ? lead.name : ''}! मी आर्या, राजेश रियल्टी येथे तुमची समर्पित रिअल इस्टेट एआय असिस्टंट.\n\nमला दिसले की तुम्ही नुकतीच मालमत्तेबद्दल चौकशी केली आहे. तुम्ही खरेदी करू इच्छिता की भाड्याने घेऊ इच्छिता? मी तुम्हाला लगेच आमच्या सर्वोत्तम मॅचेस दाखवू शकते!`;
        } else if (lang === 'gujarati') {
            greeting = `નમસ્તે ${lead.name && lead.name !== 'WhatsApp Contact' ? lead.name : ''}! હું આર્યા, રાજેશ રિયાલ્ટીમાં તમારી સમર્પિત રિયલ એસ્ટેટ એઆઈ આસિસ્ટન્ટ.\n\nમેં જોયું કે તમે હમણાં જ પ્રોપર્ટી વિશે પૂછપરછ કરી છે. શું તમે ખરીદવા માંગો છો કે ભાડે રાખવા માંગો છો? હું તમને તરત જ અમારી શ્રેષ્ઠ મેળ ખાતી પ્રોપર્ટીઝ બતાવી શકું છું!`;
        } else if (lang === 'spanish') {
            greeting = `¡Hola ${lead.name && lead.name !== 'WhatsApp Contact' ? lead.name : ''}! Soy Aria, tu asistente de inteligencia artificial de bienes raíces en Rajesh Realty.\n\n¡Vi que solicitaste información sobre propiedades! ¿Estás buscando comprar o alquilar? ¡Puedo mostrarte nuestras mejores opciones de inmediato!`;
        } else {
            greeting = `Hi ${lead.name && lead.name !== 'WhatsApp Contact' ? lead.name : 'there'}! I'm Aria, your dedicated real estate AI assistant at Rajesh Realty. \n\nI saw you just requested info about properties. Are you looking to buy or rent? I can show you our top matches immediately!`;
        }

        // 5. Send message via Evolution API
        console.log(`📡 Sending instant WhatsApp outreach to ${cleanPhone} via instance ${instanceName}...`);
        await sendMessage(cleanPhone, greeting, instanceName);

        // 6. Log outreach message in Chat History
        await db.logChat(cleanPhone, 'assistant', greeting, lead.agencyId, lead.id);

    } catch (e) {
        console.error('❌ [Instant Outreach] Error:', e.message);
    }
});

const app = express();
app.use(cors());

// Configure JSON and urlencoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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
        if (copy.neighborhoodHighlights && typeof copy.neighborhoodHighlights === 'string') {
            try { copy.neighborhoodHighlights = JSON.parse(copy.neighborhoodHighlights); } catch (e) {}
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

// Auth Middleware to decode Firebase ID Token
app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            // Verify ID Token with Firebase Admin SDK
            const decodedToken = await admin.auth().verifyIdToken(token);
            
            // Query local user matching the Firebase uid (id column in pg users)
            const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [decodedToken.uid]);
            if (userRes.rows.length > 0) {
                const user = userRes.rows[0];
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    agentEnabled: user.agentEnabled,
                    isActive: user.isActive
                };
            } else {
                // User authenticated in Firebase, but profile not created yet in PostgreSQL
                req.user = {
                    id: decodedToken.uid,
                    email: decodedToken.email || '',
                    name: decodedToken.name || '',
                    role: 'agent',
                    agentEnabled: true,
                    isActive: true,
                    isNewUser: true
                };
            }
        } catch (e) {
            console.error("Firebase Auth token verification failed:", e.message);
        }
    }
    next();
});

// DEBUG CACHE for Webhooks
const recentWebhooks = [];

// --- Authentication Endpoints ---

// Register endpoint to sync a Firebase user profile to PostgreSQL
app.post('/api/auth/register', async (req, res) => {
    try {
        const { uid, email, name, role, agencyId, agencyName } = req.body;
        if (!uid || !email) {
            return res.status(400).json({ message: 'Firebase uid and email are required' });
        }

        const exist = await pool.query('SELECT * FROM users WHERE id = $1', [uid]);
        if (exist.rows.length > 0) {
            return res.status(400).json({ message: 'User profile already exists in PostgreSQL' });
        }

        await pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, "agencyId", "agencyName", "agentEnabled", "isActive", created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, NOW(), NOW())`,
            [uid, email, 'firebase_auth', name || '', role || 'agent', agencyId || null, agencyName || null]
        );

        const record = { id: uid, email, name: name || '', role: role || 'agent', agentEnabled: true, isActive: true };
        res.json({ success: true, record });
    } catch (err) {
        console.error("PostgreSQL user sync/registration error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Sync endpoint: verifies Firebase token and retrieves PostgreSQL user model
app.post('/api/auth/sync', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No authorization token provided' });
        }

        const token = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        let userRes = await pool.query('SELECT * FROM users WHERE id = $1', [uid]);
        
        // Auto-provision user record in PostgreSQL if they exist in Firebase but not in Postgres
        if (userRes.rows.length === 0) {
            console.log(`👤 Auto-syncing Firebase user ${uid} to Postgres...`);
            await pool.query(
                `INSERT INTO users (id, email, password_hash, name, role, "agentEnabled", "isActive", created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, NOW(), NOW())`,
                [uid, decodedToken.email, 'firebase_auth', decodedToken.name || '', 'agent']
            );
            userRes = await pool.query('SELECT * FROM users WHERE id = $1', [uid]);
        }

        const user = userRes.rows[0];

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact your agency owner.' });
        }

        const record = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            agentEnabled: user.agentEnabled,
            isActive: user.isActive,
            agencyId: user.agencyId,
            agencyName: user.agencyName,
            phone: user.phone,
            geminiKey: user.geminiKey,
            metadata: user.metadata
        };

        res.json({ token, record });
    } catch (err) {
        console.error("Firebase sync error:", err);
        res.status(401).json({ message: 'Authentication sync failed: ' + err.message });
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
            let field = isDesc ? sort.substring(1) : sort;
            if (field === 'created') field = 'created_at';
            if (field === 'updated') field = 'updated_at';
            orderSql = `ORDER BY "${field}" ${isDesc ? 'DESC NULLS LAST' : 'ASC NULLS FIRST'}`;
        } else {
            orderSql = 'ORDER BY created_at DESC NULLS LAST';
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
        const newId = req.body.id || generateId();

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
            if (body.neighborhoodHighlights) {
                if (typeof body.neighborhoodHighlights !== 'string') {
                    body.neighborhoodHighlights = JSON.stringify(body.neighborhoodHighlights);
                }
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
        
        if (collection === 'leads' && insertRes.rows.length > 0) {
            dbEvents.emit('lead_created', insertRes.rows[0]);
        }

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
                
                if (matchedCol === 'steps' || matchedCol === 'projectAmenities' || matchedCol === 'neighborhoodHighlights' || matchedCol === 'images' || matchedCol === 'videos') {
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

// 1. Send OTP via WhatsApp
app.post('/api/leads/send-otp', async (req, res) => {
    try {
        const { phone, agencyId } = req.body;
        if (!phone || !agencyId) {
            return res.status(400).json({ success: false, message: 'Phone number and Agency ID are required' });
        }

        const cleanPhone = phone.replace(/[^\d]/g, '');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
        
        // Save OTP verification record
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let verifyId = '';
        for (let i = 0; i < 15; i++) {
            verifyId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        await pool.query(
            'INSERT INTO otp_verifications (id, phone, otp, expires_at) VALUES ($1, $2, $3, $4)',
            [verifyId, cleanPhone, otp, expiresAt]
        );

        // Send OTP via WhatsApp (supports template if configured in environment)
        const instanceName = `Agency_${agencyId}`;
        const otpTemplate = process.env.WHATSAPP_OTP_TEMPLATE_NAME || '';
        
        if (otpTemplate) {
            console.log(`📡 Sending WhatsApp OTP to ${cleanPhone} via template "${otpTemplate}"...`);
            const components = [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: otp
                        }
                    ]
                }
            ];
            await sendTemplateMessage(cleanPhone, otpTemplate, 'en_US', components, instanceName);
        } else {
            console.log(`📡 Sending WhatsApp OTP to ${cleanPhone} via plain text fallback...`);
            const messageText = `Your verification OTP for Rajesh Realty is: *${otp}*.\n\nThis code is valid for 5 minutes. Please do not share this OTP with anyone.`;
            await sendMessage(cleanPhone, messageText, instanceName);
        }

        res.json({ success: true, message: 'Verification OTP sent successfully via WhatsApp!' });
    } catch (err) {
        console.error('❌ Error sending OTP:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Verify OTP & Submit Enquiry
app.post('/api/leads/verify-otp', async (req, res) => {
    try {
        const {
            phone,
            otp,
            agencyId,
            name,
            email,
            requirement,
            targetBhk,
            targetLocation,
            maxBudget,
            preferredLanguage
        } = req.body;

        if (!phone || !otp || !agencyId) {
            return res.status(400).json({ success: false, message: 'Phone number, OTP, and Agency ID are required' });
        }

        const cleanPhone = phone.replace(/[^\d]/g, '');

        // Check if OTP matches and is not expired
        const otpRes = await pool.query(
            'SELECT * FROM otp_verifications WHERE phone = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [cleanPhone, otp]
        );

        if (otpRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
        }

        // Delete the verified OTP record
        await pool.query('DELETE FROM otp_verifications WHERE phone = $1', [cleanPhone]);

        // Upsert Lead as verified
        const leadParams = {
            name,
            email,
            requirement,
            bhk: targetBhk,
            location: targetLocation,
            budget_in_rupees: maxBudget,
            verified: true,
            preferredLanguage: preferredLanguage || 'English'
        };

        const newLead = await db.upsertLead(cleanPhone, agencyId, leadParams);

        res.json({ success: true, message: 'OTP verified successfully!', lead: newLead });
    } catch (err) {
        console.error('❌ Error verifying OTP:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Health Check for Render/Docker/Coolify
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'AGENT_ALIVE_V2', recentWebhooks });
});

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'rajesh_real_estate';
    
    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Meta Webhook verified successfully!');
            return res.status(200).send(challenge);
        } else {
            console.error('❌ Meta Webhook verification failed. Tokens do not match.');
            return res.sendStatus(403);
        }
    }
    return res.sendStatus(400);
});

// De-duplication cache
const processedMessages = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function isDuplicate(id) {
    const now = Date.now();
    if (processedMessages.has(id)) return true;
    processedMessages.set(id, now);
    // Clean old items from map occasionally
    if (processedMessages.size > 1000) {
        for (const [k, v] of processedMessages.entries()) {
            if (now - v > CACHE_TTL) processedMessages.delete(k);
        }
    }
    return false;
}

app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        console.log("🔥 INCOMING META WEBHOOK:", JSON.stringify(body, null, 2));

        if (body.object !== 'whatsapp_business_account') {
            return res.sendStatus(200);
        }

        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;

        if (!value) {
            return res.sendStatus(200);
        }

        // Handle status receipts (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
            const statusObj = value.statuses[0];
            const messageId = statusObj.id;
            const metaStatus = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            
            let status = 'sent';
            if (metaStatus === 'delivered') status = 'delivered';
            else if (metaStatus === 'read') status = 'read';
            else if (metaStatus === 'failed') status = 'failed';
            
            const errMsg = statusObj.errors?.[0]?.message || null;

            if (errMsg) {
                console.log(`📡 [Webhook Status] Message ${messageId} failed: ${errMsg}`);
                await pool.query(
                    'UPDATE campaign_logs SET status = $1, error_message = $2, updated_at = NOW() WHERE meta_message_id = $3',
                    [status, errMsg, messageId]
                );
            } else {
                console.log(`📡 [Webhook Status] Message ${messageId} status updated to: ${status}`);
                await pool.query(
                    'UPDATE campaign_logs SET status = $1, updated_at = NOW() WHERE meta_message_id = $2',
                    [status, messageId]
                );
            }
            return res.sendStatus(200);
        }

        if (!value.messages || value.messages.length === 0) {
            return res.sendStatus(200);
        }

        const msg = value.messages[0];
        const msgId = msg.id;
        const fromPhone = msg.from;

        if (msgId && isDuplicate(msgId)) {
            return res.sendStatus(200);
        }

        let text = '';
        if (msg.type === 'text') {
            text = msg.text?.body;
        } else if (msg.type === 'button') {
            text = msg.button?.text;
        } else if (msg.type === 'interactive') {
            const interactive = msg.interactive;
            if (interactive.type === 'button_reply') {
                text = interactive.button_reply?.title;
            } else if (interactive.type === 'list_reply') {
                text = interactive.list_reply?.title;
            }
        }

        if (text) {
            console.log(`\n📨 Received from ${fromPhone}: ${text}`);

            const metadata = value.metadata;
            const displayPhoneNumber = metadata?.display_phone_number;
            const phoneNumberId = metadata?.phone_number_id;

            let agency = null;
            const cleanDisplayPhone = displayPhoneNumber ? displayPhoneNumber.replace(/[^\d]/g, '') : null;

            if (phoneNumberId) {
                const resDb = await pool.query(
                    'SELECT * FROM users WHERE metadata->>\'whatsappPhoneNumberId\' = $1 LIMIT 1',
                    [phoneNumberId]
                );
                if (resDb.rows.length > 0) {
                    agency = resDb.rows[0];
                }
            }

            if (!agency && cleanDisplayPhone) {
                const resDb = await pool.query(
                    'SELECT * FROM users WHERE REPLACE(phone, \' \', \'\') LIKE $1 LIMIT 1',
                    [`%${cleanDisplayPhone}%`]
                );
                if (resDb.rows.length > 0) {
                    agency = resDb.rows[0];
                }
            }

            const agencyId = agency?.id || null;
            const instanceName = `Agency_${agencyId}`;

            let isEnabled = false;
            if (agencyId) {
                isEnabled = await db.isAgentEnabled(agencyId);
            }

            recentWebhooks.unshift({
                time: new Date().toISOString(),
                instanceName: agencyId ? instanceName : 'Unknown',
                agencyId,
                isEnabled,
                sender: fromPhone
            });
            if (recentWebhooks.length > 10) recentWebhooks.pop();

            if (!isEnabled || !agencyId) {
                console.log(`ℹ️ Agent disabled or agency not found for ${fromPhone}. Skipping response.`);
                return res.sendStatus(200);
            }

            res.sendStatus(200);

            const reply = await processMessage(text, fromPhone, agencyId);
            console.log(`💬 Replying to ${fromPhone}: ${reply}`);

            await sendMessage(fromPhone, reply, instanceName);
        } else {
            res.sendStatus(200);
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        if (!res.headersSent) res.sendStatus(500);
    }
});

// WhatsApp Instance Connection Management
app.post('/api/whatsapp/connect', async (req, res) => {
    try {
        const { agencyId, phoneNumber, whatsappToken, whatsappPhoneNumberId, whatsappBusinessAccountId } = req.body;
        if (!agencyId || !phoneNumber || !whatsappToken || !whatsappPhoneNumberId) {
            return res.status(400).json({ error: 'Missing required configuration fields' });
        }

        console.log(`🔌 [WhatsApp Connect] Storing and verifying credentials for agency ${agencyId}...`);

        // Update database with Meta credentials in metadata JSONB
        await pool.query(
            `UPDATE users 
             SET phone = $1,
                 metadata = COALESCE(metadata, '{}'::jsonb) || JSONB_BUILD_OBJECT(
                     'whatsappToken', $2::text,
                     'whatsappPhoneNumberId', $3::text,
                     'whatsappBusinessAccountId', $4::text
                 )
             WHERE id = $5`,
            [phoneNumber, whatsappToken, whatsappPhoneNumberId, whatsappBusinessAccountId || '', agencyId]
        );

        // Verify the connection by calling Meta Graph API
        try {
            const metaRes = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${whatsappToken}`
                }
            });

            if (metaRes.ok) {
                const data = await metaRes.json();
                console.log(`✅ [WhatsApp Connect] Verified with Meta. Display Name: ${data.verified_name || 'N/A'}`);
                return res.json({ 
                    success: true, 
                    connected: true, 
                    displayPhoneNumber: data.display_phone_number,
                    verifiedName: data.verified_name
                });
            } else {
                const errData = await metaRes.json().catch(() => ({}));
                const errMsg = errData.error?.message || `Meta HTTP Error ${metaRes.status}`;
                console.error(`❌ [WhatsApp Connect] Meta verification failed: ${errMsg}`);
                return res.json({ success: false, error: errMsg });
            }
        } catch (fetchErr) {
            console.error(`❌ [WhatsApp Connect] Meta API unreachable: ${fetchErr.message}`);
            return res.json({ success: false, error: `Meta API unreachable: ${fetchErr.message}` });
        }
    } catch (error) {
        console.error('Error in /api/whatsapp/connect:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get current WhatsApp connection status
app.get('/api/whatsapp/status', async (req, res) => {
    try {
        const { agencyId } = req.query;
        if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

        const resDb = await pool.query('SELECT phone, metadata FROM users WHERE id = $1', [agencyId]);
        if (resDb.rows.length === 0) {
            return res.json({ success: true, connected: false, error: 'Agency not found' });
        }

        const agency = resDb.rows[0];
        const metadata = agency.metadata || {};
        
        let token = metadata.whatsappToken || process.env.WHATSAPP_TOKEN;
        let phoneNumberId = metadata.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneNumberId) {
            return res.json({ success: true, connected: false, configMissing: true });
        }

        try {
            const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (metaRes.ok) {
                const data = await metaRes.json();
                return res.json({ 
                    success: true, 
                    connected: true, 
                    displayPhoneNumber: data.display_phone_number || agency.phone,
                    verifiedName: data.verified_name
                });
            } else {
                const errData = await metaRes.json().catch(() => ({}));
                return res.json({ 
                    success: true, 
                    connected: false, 
                    error: errData.error?.message || 'Meta API credentials invalid' 
                });
            }
        } catch (e) {
            return res.json({ success: true, connected: false, error: 'Meta API unreachable: ' + e.message });
        }
    } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch WABA message templates from Meta Graph API
app.get('/api/whatsapp/templates', async (req, res) => {
    try {
        const { agencyId } = req.query;
        if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

        const resDb = await pool.query('SELECT metadata FROM users WHERE id = $1', [agencyId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'Agency owner not found' });
        }

        const metadata = resDb.rows[0].metadata || {};
        const token = metadata.whatsappToken || process.env.WHATSAPP_TOKEN;
        const wabaId = metadata.whatsappBusinessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!token || !wabaId) {
            return res.status(400).json({ error: 'WhatsApp WABA configuration is missing for this agency.' });
        }

        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await metaRes.json();
        if (metaRes.ok) {
            res.json({ success: true, items: data.data || [] });
        } else {
            console.error("Meta templates fetch error:", data);
            res.status(metaRes.status).json({ success: false, error: data.error?.message || "Failed to fetch WABA templates" });
        }
    } catch (error) {
        console.error('Error fetching WABA templates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create and submit a new message template to Meta for approval
app.post('/api/whatsapp/templates', async (req, res) => {
    try {
        const { agencyId, name, category, language, components } = req.body;
        if (!agencyId || !name || !category || !language || !components) {
            return res.status(400).json({ error: 'Missing required fields: agencyId, name, category, language, components' });
        }

        const resDb = await pool.query('SELECT metadata FROM users WHERE id = $1', [agencyId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'Agency owner not found' });
        }

        const metadata = resDb.rows[0].metadata || {};
        const token = metadata.whatsappToken || process.env.WHATSAPP_TOKEN;
        const wabaId = metadata.whatsappBusinessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!token || !wabaId) {
            return res.status(400).json({ error: 'WhatsApp WABA configuration is missing for this agency.' });
        }

        console.log(`📡 Submitting template "${name}" to Meta for approval under WABA ID ${wabaId}...`);

        // Auto-generate examples for variables if present (Meta requires this for templates with parameters)
        const processedComponents = components.map(comp => {
            if (comp.type === 'BODY' && comp.text) {
                const matches = comp.text.match(/\{\{\d+\}\}/g);
                if (matches && matches.length > 0) {
                    const uniqueVars = [...new Set(matches)];
                    const samples = uniqueVars.map((v, index) => `placeholder_value_${index + 1}`);
                    return {
                        ...comp,
                        example: {
                            body_text: [samples]
                        }
                    };
                }
            }
            return comp;
        });

        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                category,
                language,
                components: processedComponents
            })
        });

        const data = await metaRes.json();
        if (metaRes.ok) {
            res.json({ success: true, data });
        } else {
            console.error("Meta template submission error:", data);
            res.status(metaRes.status).json({ success: false, error: data.error?.message || "Meta rejected template submission" });
        }
    } catch (error) {
        console.error('Error creating WABA template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a message template from Meta
app.delete('/api/whatsapp/templates/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { agencyId } = req.query;
        if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

        const resDb = await pool.query('SELECT metadata FROM users WHERE id = $1', [agencyId]);
        if (resDb.rows.length === 0) {
            return res.status(404).json({ error: 'Agency owner not found' });
        }

        const metadata = resDb.rows[0].metadata || {};
        const token = metadata.whatsappToken || process.env.WHATSAPP_TOKEN;
        const wabaId = metadata.whatsappBusinessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        if (!token || !wabaId) {
            return res.status(400).json({ error: 'WhatsApp WABA configuration is missing for this agency.' });
        }

        console.log(`📡 Deleting template "${name}" from Meta for WABA ID ${wabaId}...`);

        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await metaRes.json();
        if (metaRes.ok) {
            res.json({ success: true, data });
        } else {
            console.error("Meta template deletion error:", data);
            res.status(metaRes.status).json({ success: false, error: data.error?.message || "Meta rejected template deletion" });
        }
    } catch (error) {
        console.error('Error deleting WABA template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Polish a raw message draft using AI to fit WABA parameters
app.post('/api/whatsapp/templates/polish-with-ai', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt in request body' });
        }

        console.log(`🤖 Polishing WhatsApp template draft with AI...`);
        const result = await polishTemplateWithAI(prompt);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error polishing template with AI:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Campaigns Endpoints
// Helper to generate 15-char string IDs matching PocketBase's ID format
function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 1. Get campaigns history with stats
app.get('/api/campaigns', async (req, res) => {
    try {
        const { agencyId } = req.query;
        if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

        const query = `
            SELECT c.*,
                   COUNT(l.id) AS total_recipients,
                   SUM(CASE WHEN l.status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
                   SUM(CASE WHEN l.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
                   SUM(CASE WHEN l.status = 'read' THEN 1 ELSE 0 END) AS read_count,
                   SUM(CASE WHEN l.status = 'failed' THEN 1 ELSE 0 END) AS failed_count
            FROM campaigns c
            LEFT JOIN campaign_logs l ON c.id = l.campaign_id
            WHERE c.agency_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query, [agencyId]);
        res.json({ success: true, items: result.rows });
    } catch (err) {
        console.error('Error fetching campaigns:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Query target lead count based on filters
app.post('/api/campaigns/target-count', async (req, res) => {
    try {
        const { agencyId, filters } = req.body;
        if (!agencyId) return res.status(400).json({ error: 'Missing agencyId' });

        const queryParams = [agencyId];
        let queryText = 'SELECT COUNT(*) FROM leads WHERE "agencyId" = $1';
        let paramIdx = 2;

        if (filters) {
            if (filters.location && filters.location !== 'any' && filters.location.trim() !== '') {
                queryText += ` AND target_location ILIKE $${paramIdx}`;
                queryParams.push(`%${filters.location.trim()}%`);
                paramIdx++;
            }
            if (filters.bhk && filters.bhk !== 'any' && filters.bhk.trim() !== '') {
                queryText += ` AND target_bhk ILIKE $${paramIdx}`;
                queryParams.push(`%${filters.bhk.trim()}%`);
                paramIdx++;
            }
            if (filters.maxBudget && parseFloat(filters.maxBudget) > 0) {
                queryText += ` AND max_budget <= $${paramIdx}`;
                queryParams.push(parseFloat(filters.maxBudget));
                paramIdx++;
            }
        }

        const result = await pool.query(queryText, queryParams);
        res.json({ success: true, count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error fetching lead target count:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Create a campaign & populate recipients
app.post('/api/campaigns', async (req, res) => {
    try {
        const { agencyId, name, templateName, templateLanguage, variables, filters } = req.body;
        if (!agencyId || !name || !templateName) {
            return res.status(400).json({ error: 'Missing required fields: agencyId, name, or templateName' });
        }

        // Query matching leads
        const queryParams = [agencyId];
        let queryText = 'SELECT * FROM leads WHERE "agencyId" = $1';
        let paramIdx = 2;

        if (filters) {
            if (filters.location && filters.location !== 'any' && filters.location.trim() !== '') {
                queryText += ` AND target_location ILIKE $${paramIdx}`;
                queryParams.push(`%${filters.location.trim()}%`);
                paramIdx++;
            }
            if (filters.bhk && filters.bhk !== 'any' && filters.bhk.trim() !== '') {
                queryText += ` AND target_bhk ILIKE $${paramIdx}`;
                queryParams.push(`%${filters.bhk.trim()}%`);
                paramIdx++;
            }
            if (filters.maxBudget && parseFloat(filters.maxBudget) > 0) {
                queryText += ` AND max_budget <= $${paramIdx}`;
                queryParams.push(parseFloat(filters.maxBudget));
                paramIdx++;
            }
        }

        const leadsRes = await pool.query(queryText, queryParams);
        const leads = leadsRes.rows;

        if (leads.length === 0) {
            return res.status(400).json({ error: 'No matching leads found for the selected filters.' });
        }

        // Insert campaign
        const campaignId = generateShortId();
        const variablesJson = JSON.stringify(variables || []);
        const filtersJson = JSON.stringify(filters || {});

        await pool.query(
            `INSERT INTO campaigns (id, name, template_name, template_language, variables, filters, status, agency_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [campaignId, name, templateName, templateLanguage || 'en_US', variablesJson, filtersJson, 'draft', agencyId]
        );

        // Populate campaign logs
        for (const lead of leads) {
            const logId = generateShortId();
            await pool.query(
                `INSERT INTO campaign_logs (id, campaign_id, lead_id, phone, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [logId, campaignId, lead.id, lead.phone, 'pending']
            );
        }

        res.json({ success: true, campaignId, totalRecipients: leads.length });
    } catch (err) {
        console.error('Error creating campaign:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Trigger campaign sending
app.post('/api/campaigns/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch campaign details
        const campaignQuery = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
        if (campaignQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const campaign = campaignQuery.rows[0];
        if (campaign.status === 'sending') {
            return res.json({ success: true, message: 'Campaign is already sending' });
        }

        // Update campaign status
        await pool.query('UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['sending', id]);

        // Trigger asynchronous campaign processor
        runCampaignProcessor(id).catch(err => {
            console.error(`❌ Background runner error for campaign ${id}:`, err);
        });

        res.json({ success: true, message: 'Campaign sending started in background' });
    } catch (err) {
        console.error('Error initiating campaign send:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. Expand recipient details for monitoring
app.get('/api/campaigns/:id/recipients', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT l.*, ld.name AS lead_name
            FROM campaign_logs l
            JOIN leads ld ON l.lead_id = ld.id
            WHERE l.campaign_id = $1
            ORDER BY l.created_at ASC
        `;
        const result = await pool.query(query, [id]);
        res.json({ success: true, items: result.rows });
    } catch (err) {
        console.error('Error fetching campaign recipients:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Asynchronous background campaign sender
async function runCampaignProcessor(campaignId) {
    console.log(`🚀 [Campaign Runner] Starting processing for campaign ${campaignId}...`);
    try {
        // Fetch campaign details
        const campaignRes = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
        if (campaignRes.rows.length === 0) return;
        const campaign = campaignRes.rows[0];
        const { template_name, template_language, variables, agency_id } = campaign;
        const mappedVars = Array.isArray(variables) ? variables : JSON.parse(variables || '[]');

        // Fetch property details if a property was selected in campaign filters
        let property = null;
        let filtersObj = {};
        try {
            filtersObj = typeof campaign.filters === 'string' ? JSON.parse(campaign.filters) : (campaign.filters || {});
        } catch (e) {
            console.error("Error parsing campaign filters:", e.message);
        }
        if (filtersObj.propertyId) {
            try {
                const propRes = await pool.query('SELECT * FROM properties WHERE id = $1', [filtersObj.propertyId]);
                if (propRes.rows.length > 0) {
                    property = propRes.rows[0];
                }
            } catch (dbErr) {
                console.error("❌ Error fetching property details for campaign runner:", dbErr.message);
            }
        }

        // Fetch pending recipients
        const recipientsRes = await pool.query(
            'SELECT l.*, ld.name, ld.target_location, ld.target_bhk FROM campaign_logs l JOIN leads ld ON l.lead_id = ld.id WHERE l.campaign_id = $1 AND l.status = $2',
            [campaignId, 'pending']
        );
        const recipients = recipientsRes.rows;
        console.log(`[Campaign Runner] Found ${recipients.length} pending recipients for campaign ${campaignId}`);

        const instanceName = `Agency_${agency_id}`;

        for (const recipient of recipients) {
            try {
                // Pause to pace sends and respect Meta rate limits (approx 150ms)
                await new Promise(resolve => setTimeout(resolve, 150));

                // Re-verify campaign status was not cancelled or paused in DB
                const currentStatusCheck = await pool.query('SELECT status FROM campaigns WHERE id = $1', [campaignId]);
                if (currentStatusCheck.rows[0]?.status !== 'sending') {
                    console.log(`[Campaign Runner] Campaign status changed to ${currentStatusCheck.rows[0]?.status}. Aborting runner.`);
                    return;
                }

                // Construct component parameters
                const parameters = mappedVars.map(v => {
                    if (v === 'name') return { type: 'text', text: recipient.name || 'Customer' };
                    if (v === 'target_location') return { type: 'text', text: recipient.target_location || 'Any' };
                    if (v === 'target_bhk') return { type: 'text', text: recipient.target_bhk || 'Any' };
                    
                    // Property-specific dynamic variables
                    if (v === 'property_title') return { type: 'text', text: property ? property.title : 'Featured Property' };
                    if (v === 'property_location') return { type: 'text', text: property ? property.location : 'Prime Location' };
                    if (v === 'property_bhk') return { type: 'text', text: property ? property.bhk : '2BHK/3BHK' };
                    if (v === 'property_price') return { type: 'text', text: property ? `₹${Number(property.price).toLocaleString()}` : 'Ask for Price' };
                    if (v === 'property_type') return { type: 'text', text: property ? property.type : 'Apartment' };
                    if (v === 'property_listing_type') return { type: 'text', text: property ? property.listing_type : 'Sale' };
                    if (v === 'property_link') {
                        const appUrl = process.env.VITE_APP_URL || 'https://realestateflow.elevetoai.com';
                        const propId = property ? property.id : '';
                        return { type: 'text', text: propId ? `${appUrl}/properties/${propId}` : appUrl };
                    }
                    
                    return { type: 'text', text: v }; // Literal fallback
                });

                const components = parameters.length > 0 ? [{
                    type: 'body',
                    parameters: parameters
                }] : [];

                // Send message via Meta WhatsApp Cloud API
                const metaMessageId = await sendTemplateMessage(
                    recipient.phone,
                    template_name,
                    template_language,
                    components,
                    instanceName
                );

                if (metaMessageId) {
                    await pool.query(
                        'UPDATE campaign_logs SET status = $1, meta_message_id = $2, error_message = NULL, updated_at = NOW() WHERE id = $3',
                        ['sent', metaMessageId, recipient.id]
                    );
                } else {
                    await pool.query(
                        'UPDATE campaign_logs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
                        ['failed', 'Meta sending failed (missing keys or API error)', recipient.id]
                    );
                }
            } catch (errRecip) {
                console.error(`[Campaign Runner] Error sending to recipient ${recipient.phone}:`, errRecip.message);
                await pool.query(
                    'UPDATE campaign_logs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
                    ['failed', errRecip.message, recipient.id]
                );
            }
        }

        // Mark campaign as completed
        await pool.query('UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', campaignId]);
        console.log(`✅ [Campaign Runner] Campaign ${campaignId} processed successfully!`);

    } catch (errCampaign) {
        console.error(`❌ [Campaign Runner] Major campaign execution failure:`, errCampaign.message);
        await pool.query('UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', campaignId]);
    }
}

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


// --- Portal Integrations API & Webhooks ---

// Get active integrations for an agency
app.get('/api/integrations/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;
        const result = await pool.query(
            'SELECT id, portal, api_key, agent_id, username, is_active, created_at FROM portal_integrations WHERE agency_id = $1',
            [agencyId]
        );
        res.json({ success: true, items: result.rows });
    } catch (err) {
        console.error("Fetch integrations error:", err);
        res.status(500).json({ error: "Failed to fetch integrations" });
    }
});

// Save or update an integration
app.post('/api/integrations', async (req, res) => {
    try {
        const { agencyId, portal, apiKey, agentId, username, password } = req.body;
        if (!agencyId || !portal) {
            return res.status(400).json({ error: "agencyId and portal are required" });
        }

        const id = generateId();
        const result = await pool.query(
            `INSERT INTO portal_integrations (id, agency_id, portal, api_key, agent_id, username, password, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
             ON CONFLICT (agency_id, portal) DO UPDATE SET
                api_key = EXCLUDED.api_key,
                agent_id = EXCLUDED.agent_id,
                username = EXCLUDED.username,
                password = EXCLUDED.password,
                is_active = TRUE,
                updated_at = NOW()
             RETURNING *`,
            [id, agencyId, portal, apiKey || null, agentId || null, username || null, password || null]
        );

        // Auto-subscribe Meta webhook if portal is meta
        if (portal === 'meta' && agentId && apiKey) {
            console.log(`📡 [Meta Integration] Attempting to auto-subscribe app webhook to page ID: ${agentId}`);
            try {
                const subUrl = `https://graph.facebook.com/v18.0/${agentId}/subscribed_apps?subscribed_fields=leadgen&access_token=${apiKey}`;
                const subRes = await fetch(subUrl, { method: 'POST' });
                const subData = await subRes.json();
                if (subRes.ok && subData.success) {
                    console.log(`✅ [Meta Integration] Successfully subscribed CRM app to Page ${agentId} leadgen webhook topic.`);
                } else {
                    console.warn(`⚠️ [Meta Integration] Subscribed apps API returned non-success response:`, JSON.stringify(subData));
                }
            } catch (e) {
                console.error(`❌ [Meta Integration] Failed to call Meta subscribed_apps Graph API:`, e.message);
            }
        }

        res.json({ success: true, record: result.rows[0] });
    } catch (err) {
        console.error("Save integration error:", err);
        res.status(500).json({ error: "Failed to save integration" });
    }
});

// Disconnect/Delete an integration
app.delete('/api/integrations/:agencyId/:portal', async (req, res) => {
    try {
        const { agencyId, portal } = req.params;
        await pool.query(
            'DELETE FROM portal_integrations WHERE agency_id = $1 AND portal = $2',
            [agencyId, portal]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Delete integration error:", err);
        res.status(500).json({ error: "Failed to disconnect integration" });
    }
});

// Public Webhook Endpoint for Portal Ingestion
// URL: /api/integrations/webhook/:portal/:agencyId
app.post('/api/integrations/webhook/:portal/:agencyId', async (req, res) => {
    try {
        const { portal, agencyId } = req.params;
        const payload = req.body;

        console.log(`📡 [Webhook Ingestion] Received ${portal} lead for agency ${agencyId}:`, JSON.stringify(payload));

        // 1. Check if integration is configured and active
        const integrationCheck = await pool.query(
            'SELECT is_active FROM portal_integrations WHERE agency_id = $1 AND portal = $2 LIMIT 1',
            [agencyId, portal]
        );
        if (integrationCheck.rows.length === 0 || !integrationCheck.rows[0].is_active) {
            console.warn(`⚠️ [Webhook] Received lead for inactive or non-configured portal ${portal} (Agency: ${agencyId})`);
            return res.status(400).json({ error: "Integration is inactive or not configured" });
        }

        // 2. Map portal fields to our database format
        let name = 'Portal Lead';
        let phone = '';
        let requirement = '';
        let budget = 0;
        let location = '';
        let bhk = '';

        if (portal === 'magicbricks') {
            name = payload.Name || payload.name || 'Magicbricks Lead';
            phone = payload.Mobile || payload.phone || payload.mobile || '';
            requirement = payload.Query || payload.query || payload.Requirement || 'Inquiry from Magicbricks';
            location = payload.Location || payload.locality || '';
            budget = payload.Budget || payload.price || 0;
        } else if (portal === '99acres') {
            name = payload.leadName || payload.name || '99acres Lead';
            phone = payload.leadPhone || payload.phone || '';
            requirement = payload.requirement || payload.query || 'Inquiry from 99acres';
            location = payload.projectLocation || payload.locality || '';
            budget = payload.budget || payload.price || 0;
        } else if (portal === 'housing') {
            name = payload.name || 'Housing.com Lead';
            phone = payload.phone || '';
            requirement = payload.message || payload.requirement || 'Inquiry from Housing.com';
            location = payload.locality || payload.location || '';
            budget = payload.price || payload.budget || 0;
        } else if (portal === 'nobroker') {
            name = payload.name || 'NoBroker Lead';
            phone = payload.phone || '';
            requirement = payload.requirement || 'Inquiry from NoBroker';
            location = payload.location || '';
            budget = payload.budget || 0;
        } else if (portal === 'google') {
            // Check Google Key verification
            const configuredKey = integrationCheck.rows[0].api_key;
            if (configuredKey && payload.google_key !== configuredKey) {
                console.warn("⚠️ [Google Webhook] Invalid google_key received");
                return res.status(401).json({ error: "Unauthorized google_key" });
            }
            name = 'Google Ads Lead';
            let detailParts = [];
            if (Array.isArray(payload.user_column_data)) {
                payload.user_column_data.forEach(col => {
                    const colName = (col.column_name || '').toLowerCase();
                    const val = col.string_value;
                    if (colName.includes('name') || colName.includes('full')) name = val;
                    else if (colName.includes('phone') || colName.includes('mobile')) phone = val;
                    else detailParts.push(`${col.column_name}: ${val}`);
                });
            }
            requirement = detailParts.length > 0 ? `Google Form details: ${detailParts.join(' | ')}` : 'Inquiry from Google Ads Form';
        } else if (portal === 'generic') {
            name = payload.name || 'Generic / Zapier Lead';
            phone = payload.phone || payload.mobile || '';
            requirement = payload.requirement || payload.message || 'Inquiry from custom webhook';
            location = payload.location || payload.locality || '';
            budget = payload.budget || payload.price || 0;
        } else {
            return res.status(400).json({ error: "Unknown portal" });
        }

        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        const cleanPhone = phone.replace(/[^\d]/g, '');

        // 3. Upsert Lead
        const lead = await db.upsertLead(cleanPhone, agencyId, {
            name,
            requirement: `[${portal.toUpperCase()}] ${requirement}`,
            location,
            budget_in_rupees: parseFloat(budget) || 0,
            purpose: 'Buy'
        });

        // 4. Run matching engine
        if (lead) {
            console.log(`🎯 [Webhook] Lead upserted successfully: ${lead.id}. Running match engine...`);
            // Run matching engine for all properties against this lead
            const propRes = await pool.query('SELECT id FROM properties WHERE "agencyId" = $1', [agencyId]);
            let totalMatches = 0;
            for (const prop of propRes.rows) {
                const matchCheck = await pool.query(
                    'SELECT * FROM matches WHERE lead_id = $1 AND property_id = $2 LIMIT 1',
                    [lead.id, prop.id]
                );
                if (matchCheck.rows.length === 0) {
                    const newMatchId = generateId();
                    await pool.query(
                        `INSERT INTO matches (id, lead_id, property_id, agency_id, status, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                        [newMatchId, lead.id, prop.id, agencyId, 'Pending Review']
                    );
                    totalMatches++;
                }
            }
            console.log(`🎯 [Webhook] Generated ${totalMatches} property matches for new lead`);
        }

        res.json({ success: true, message: "Lead ingested successfully", leadId: lead?.id });
    } catch (err) {
        console.error("Webhook ingestion error:", err);
        res.status(500).json({ error: err.message });
    }
});


// --- Meta Ads Direct Webhooks ---

// Simulation cache for local testing without calling Meta Graph API
const metaSimulations = new Map();

// Meta Webhook Challenge verification (GET)
app.get('/api/integrations/webhook/meta', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN || 'meta_leads_verify_pass_123';

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ [Meta Webhook] Verification successful!');
            return res.status(200).send(challenge);
        } else {
            console.warn('❌ [Meta Webhook] Verification failed: Tokens mismatch');
            return res.sendStatus(403);
        }
    }
    res.sendStatus(400);
});

// Meta Webhook Lead Ingestion (POST)
app.post('/api/integrations/webhook/meta', async (req, res) => {
    try {
        const payload = req.body;
        console.log('📡 [Meta Webhook] Inbound Leadgen webhook received:', JSON.stringify(payload));

        if (payload.object !== 'page') {
            return res.status(400).json({ error: "Unsupported object type" });
        }

        const entries = payload.entry || [];
        for (const entry of entries) {
            const pageId = entry.id;
            const changes = entry.changes || [];
            
            for (const change of changes) {
                if (change.field === 'leadgen') {
                    const leadgenId = change.value?.leadgen_id;
                    if (!leadgenId) continue;

                    // 1. Lookup Meta integration using pageId (agent_id)
                    const integrationQuery = await pool.query(
                        "SELECT agency_id, api_key FROM portal_integrations WHERE portal = 'meta' AND agent_id = $1 LIMIT 1",
                        [pageId]
                    );

                    if (integrationQuery.rows.length === 0) {
                        console.warn(`⚠️ [Meta Webhook] No active CRM integration found for pageId: ${pageId}`);
                        continue;
                    }

                    const { agency_id: agencyId, api_key: pageAccessToken } = integrationQuery.rows[0];

                    let name = 'Meta Ads Lead';
                    let phone = '';
                    let requirement = 'Inquiry from Instagram/Facebook Ads';

                    // 2. Fetch Lead Details (use simulation cache or call Meta Graph API)
                    if (leadgenId.startsWith('LGEN_') && metaSimulations.has(leadgenId)) {
                        const sim = metaSimulations.get(leadgenId);
                        name = sim.name;
                        phone = sim.phone;
                        requirement = `${sim.requirement} | Locality: ${sim.location} | Budget: ${sim.budget}`;
                        console.log(`🧪 [Meta Webhook] Used simulation cache for simulated lead: ${leadgenId}`);
                    } else {
                        console.log(`📡 Fetching Meta lead details for ID: ${leadgenId}...`);
                        const fetchUrl = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${pageAccessToken}`;
                        try {
                            const fbRes = await fetch(fetchUrl);
                            if (!fbRes.ok) {
                                throw new Error(`Graph API returned HTTP ${fbRes.status}`);
                            }
                            const fbData = await fbRes.json();
                            const fields = fbData.field_data || [];
                            
                            let detailParts = [];
                            fields.forEach(f => {
                                const fName = (f.name || '').toLowerCase();
                                const val = f.values?.[0] || '';
                                if (fName.includes('full_name') || fName === 'name') {
                                    name = val;
                                } else if (fName.includes('phone') || fName.includes('mobile')) {
                                    phone = val;
                                } else {
                                    detailParts.push(`${f.name}: ${val}`);
                                }
                            });
                            if (detailParts.length > 0) {
                                requirement = `Meta Form Details: ${detailParts.join(' | ')}`;
                            }
                        } catch (e) {
                            console.error(`❌ Meta Graph API fetch failed for lead ${leadgenId}:`, e.message);
                            phone = '9999999999';
                            requirement += ` (Lead ID: ${leadgenId} - Failed to download details: ${e.message})`;
                        }
                    }

                    const cleanPhone = phone.replace(/[^\d]/g, '');
                    if (!cleanPhone) continue;

                    // 3. Upsert Lead into CRM
                    const lead = await db.upsertLead(cleanPhone, agencyId, {
                        name,
                        requirement: `[META] ${requirement}`,
                        purpose: 'Buy'
                    });

                    // 4. Run matching engine
                    if (lead) {
                        const propRes = await pool.query('SELECT id FROM properties WHERE "agencyId" = $1', [agencyId]);
                        for (const prop of propRes.rows) {
                            const matchCheck = await pool.query(
                                'SELECT * FROM matches WHERE lead_id = $1 AND property_id = $2 LIMIT 1',
                                [lead.id, prop.id]
                            );
                            if (matchCheck.rows.length === 0) {
                                const newMatchId = generateId();
                                await pool.query(
                                    `INSERT INTO matches (id, lead_id, property_id, agency_id, status, created_at, updated_at)
                                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                                    [newMatchId, lead.id, prop.id, agencyId, 'Pending Review']
                                );
                            }
                        }
                    }
                }
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Meta webhook error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Simulation API to mock portal webhooks
app.post('/api/integrations/simulate', async (req, res) => {
    try {
        const { portal, agencyId, name, phone, requirement, location, budget } = req.body;
        if (!portal || !agencyId || !phone) {
            return res.status(400).json({ error: "Missing portal, agencyId, or phone" });
        }

        console.log(`🧪 [Simulation] Simulating portal webhook for ${portal} (Agency: ${agencyId})`);

        // Structure payload based on portal format
        let payload = {};
        let targetUrl = `http://localhost:${process.env.PORT || 3000}/api/integrations/webhook/${portal}/${agencyId}`;

        if (portal === 'magicbricks') {
            payload = { Name: name, Mobile: phone, Query: requirement, Location: location, Budget: budget };
        } else if (portal === '99acres') {
            payload = { leadName: name, leadPhone: phone, requirement, projectLocation: location, budget };
        } else if (portal === 'housing') {
            payload = { name, phone, message: requirement, locality: location, price: budget };
        } else if (portal === 'nobroker') {
            payload = { name, phone, requirement, location, budget };
        } else if (portal === 'google') {
            const integrationCheck = await pool.query(
                'SELECT api_key FROM portal_integrations WHERE agency_id = $1 AND portal = $2 LIMIT 1',
                [agencyId, 'google']
            );
            const googleKey = integrationCheck.rows[0]?.api_key || 'test_sim_google_key';
            payload = {
                lead_id: 'G' + Math.random().toString(36).substring(2, 10),
                google_key: googleKey,
                user_column_data: [
                    { column_name: 'Full Name', string_value: name },
                    { column_name: 'Phone Number', string_value: phone },
                    { column_name: 'Requirement', string_value: requirement },
                    { column_name: 'Locality', string_value: location },
                    { column_name: 'Budget', string_value: budget }
                ]
            };
        } else if (portal === 'generic') {
            payload = { name, phone, requirement, location, budget };
        } else if (portal === 'meta') {
            const integrationCheck = await pool.query(
                "SELECT agent_id FROM portal_integrations WHERE agency_id = $1 AND portal = $2 LIMIT 1",
                [agencyId, 'meta']
            );
            const pageId = integrationCheck.rows[0]?.agent_id || 'sim_page_123';
            const leadgenId = 'LGEN_' + Math.random().toString(36).substring(2, 10);
            
            // Populate simulation cache
            metaSimulations.set(leadgenId, { name, phone, requirement, location, budget });
            setTimeout(() => metaSimulations.delete(leadgenId), 5 * 60 * 1000); // 5 min TTL
            
            payload = {
                object: 'page',
                entry: [
                    {
                        id: pageId,
                        time: Math.floor(Date.now() / 1000),
                        changes: [
                            {
                                field: 'leadgen',
                                value: {
                                    leadgen_id: leadgenId,
                                    page_id: pageId,
                                    form_id: 'FORM_123',
                                    created_time: Math.floor(Date.now() / 1000)
                                }
                            }
                        ]
                    }
                ]
            };
            targetUrl = `http://localhost:${process.env.PORT || 3000}/api/integrations/webhook/meta`;
        }

        // Call the webhook handler directly
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            res.json(data);
        } else {
            res.status(response.status).json(data);
        }
    } catch (err) {
        console.error("Simulation error:", err);
        res.status(500).json({ error: err.message });
    }
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

