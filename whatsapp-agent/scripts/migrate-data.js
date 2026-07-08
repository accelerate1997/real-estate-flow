require('dotenv').config();
const PocketBase = require('pocketbase').default;
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('../database/db');

const pbUrl = process.env.POCKETBASE_URL || 'http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'jashavantgoswami@gmail.com';
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || '@Eleveto199704';

const pb = new PocketBase(pbUrl);

async function runMigration(shouldEndPool = true) {
    console.log('🏁 [Migration] Starting database migration script...');
    
    // 1. Init Postgres DB Tables
    await initDB();

    // 2. Authenticate with PocketBase as admin
    console.log(`🔑 [PocketBase] Authenticating as Admin on ${pbUrl}...`);
    try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('✅ [PocketBase] Authenticated successfully.');
    } catch (err) {
        console.error('❌ [PocketBase] Authentication failed:', err.message);
        process.exit(1);
    }

    const defaultTempPassword = 'Welcome@123';
    const defaultPasswordHash = await bcrypt.hash(defaultTempPassword, 10);
    console.log(`🔒 [Migration] Default password for migrated users will be: "${defaultTempPassword}"`);

    // Helper to query Postgres
    const pgQuery = (text, params) => pool.query(text, params);

    // --- 1. Migrate USERS ---
    console.log('👤 [Migration] Fetching users from PocketBase...');
    const pbUsers = await pb.collection('users').getFullList();
    console.log(`👤 [Migration] Found ${pbUsers.length} users. Migrating to PostgreSQL...`);
    for (const u of pbUsers) {
        try {
            await pgQuery(
                `INSERT INTO users (id, email, password_hash, name, role, "agentEnabled", "isActive", created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET 
                    email = EXCLUDED.email, 
                    name = EXCLUDED.name, 
                    role = EXCLUDED.role, 
                    "agentEnabled" = EXCLUDED."agentEnabled", 
                    "isActive" = EXCLUDED."isActive", 
                    updated_at = EXCLUDED.updated_at`,
                [u.id, u.email, defaultPasswordHash, u.name || null, u.role || 'agent', u.agentEnabled !== false, u.isActive !== false, u.created, u.updated]
            );
        } catch (e) {
            console.error(`Error migrating user ${u.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Users migrated.');

    // --- 2. Migrate INVITES ---
    try {
        console.log('✉️ [Migration] Fetching invites from PocketBase...');
        const pbInvites = await pb.collection('invites').getFullList();
        console.log(`✉️ [Migration] Found ${pbInvites.length} invites. Migrating...`);
        for (const i of pbInvites) {
            await pgQuery(
                `INSERT INTO invites (id, email, role, agency_id, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
                [i.id, i.email, i.role || 'agent', i.agency_id || null, i.status || 'Pending', i.created, i.updated]
            );
        }
        console.log('✅ [Migration] Invites migrated.');
    } catch (e) {
        console.log('⚠️ [Migration] No invites collection or migration skipped:', e.message);
    }

    // --- 3. Migrate PROPERTIES ---
    console.log('🏠 [Migration] Fetching properties from PocketBase...');
    const pbProperties = await pb.collection('properties').getFullList();
    console.log(`🏠 [Migration] Found ${pbProperties.length} properties. Migrating...`);
    for (const p of pbProperties) {
        try {
            await pgQuery(
                `INSERT INTO properties (
                    id, title, description, "propertyCategory", "transactionType", price, 
                    "builtUpArea", "carpetArea", "bhkType", furnishing, "floorDetails", 
                    "preferredTenant", "washroomType", "powerAmps", "businessTypeSuitability", 
                    "constructionStatus", "reraId", "expectedDeposit", "pricePerSqFt", location, 
                    "projectAmenities", images, videos, "agencyId", "createdBy", "isFeatured", created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
                ON CONFLICT (id) DO UPDATE SET 
                    title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price, 
                    location = EXCLUDED.location, images = EXCLUDED.images, "isFeatured" = EXCLUDED."isFeatured", 
                    updated_at = EXCLUDED.updated_at`,
                [
                    p.id, p.title, p.description || null, p.propertyCategory || null, p.transactionType || null,
                    p.price ? parseFloat(p.price) : null, p.builtUpArea ? parseFloat(p.builtUpArea) : null, p.carpetArea ? parseFloat(p.carpetArea) : null,
                    p.bhkType || null, p.furnishing || null, p.floorDetails || null, p.preferredTenant || null,
                    p.washroomType || null, p.powerAmps ? parseFloat(p.powerAmps) : null, p.businessTypeSuitability || null,
                    p.constructionStatus || null, p.reraId || null, p.expectedDeposit ? parseFloat(p.expectedDeposit) : null,
                    p.pricePerSqFt ? parseFloat(p.pricePerSqFt) : null, p.location || null,
                    JSON.stringify(p.projectAmenities || []), JSON.stringify(p.images || []), JSON.stringify(p.videos || []),
                    p.agencyId || null, p.createdBy || null, p.isFeatured === true, p.created, p.updated
                ]
            );
        } catch (e) {
            console.error(`Error migrating property ${p.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Properties migrated.');

    // --- 4. Migrate LEADS ---
    console.log('📊 [Migration] Fetching leads from PocketBase...');
    const pbLeads = await pb.collection('leads').getFullList();
    console.log(`📊 [Migration] Found ${pbLeads.length} leads. Migrating...`);
    for (const l of pbLeads) {
        try {
            await pgQuery(
                `INSERT INTO leads (id, "agencyId", name, phone, requirement, target_bhk, target_location, max_budget, status, date, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, phone = EXCLUDED.phone, requirement = EXCLUDED.requirement,
                    status = EXCLUDED.status, date = EXCLUDED.date, updated_at = EXCLUDED.updated_at`,
                [
                    l.id, l.agencyId || null, l.name || null, l.phone || null, l.requirement || null,
                    l.target_bhk || null, l.target_location || null, l.max_budget ? parseFloat(l.max_budget) : null,
                    l.status || 'New Lead', l.date ? new Date(l.date) : null, l.created, l.updated
                ]
            );
        } catch (e) {
            console.error(`Error migrating lead ${l.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Leads migrated.');

    // --- 5. Migrate MATCHES ---
    console.log('🔗 [Migration] Fetching matches from PocketBase...');
    const pbMatches = await pb.collection('matches').getFullList();
    console.log(`🔗 [Migration] Found ${pbMatches.length} matches. Migrating...`);
    for (const m of pbMatches) {
        try {
            await pgQuery(
                `INSERT INTO matches (id, lead_id, property_id, agency_id, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
                [m.id, m.lead_id || null, m.property_id || null, m.agency_id || null, m.status || 'Pending Review', m.created, m.updated]
            );
        } catch (e) {
            console.error(`Error migrating match ${m.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Matches migrated.');

    // --- 6. Migrate SITE VISITS ---
    console.log('🗓️ [Migration] Fetching site visits from PocketBase...');
    const pbVisits = await pb.collection('site_visits').getFullList();
    console.log(`🗓️ [Migration] Found ${pbVisits.length} site visits. Migrating...`);
    for (const v of pbVisits) {
        try {
            await pgQuery(
                `INSERT INTO site_visits (id, lead, property, visit_date, visit_time, status, notes, agency_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO UPDATE SET 
                    visit_date = EXCLUDED.visit_date, visit_time = EXCLUDED.visit_time, 
                    status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at`,
                [
                    v.id, v.lead || null, v.property || null, v.visit_date ? new Date(v.visit_date) : null,
                    v.visit_time || null, v.status || 'Scheduled', v.notes || null, v.agency_id || null, v.created, v.updated
                ]
            );
        } catch (e) {
            console.error(`Error migrating site visit ${v.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Site visits migrated.');

    // --- 7. Migrate CHAT LOGS ---
    console.log('💬 [Migration] Fetching chat logs from PocketBase...');
    const pbChats = await pb.collection('chat_logs').getFullList();
    console.log(`💬 [Migration] Found ${pbChats.length} chat logs. Migrating...`);
    for (const c of pbChats) {
        try {
            await pgQuery(
                `INSERT INTO chat_logs (id, phone, role, content, agency_id, lead_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO NOTHING`,
                [c.id, c.phone || null, c.role || null, c.content || null, c.agency_id || null, c.lead_id || null, c.created, c.updated]
            );
        } catch (e) {
            console.error(`Error migrating chat log ${c.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Chat logs migrated.');

    // --- 8. Migrate SEQUENCES ---
    console.log('⛓️ [Migration] Fetching sequences from PocketBase...');
    const pbSequences = await pb.collection('sequences').getFullList();
    console.log(`⛓️ [Migration] Found ${pbSequences.length} sequences. Migrating...`);
    for (const s of pbSequences) {
        try {
            await pgQuery(
                `INSERT INTO sequences (id, name, steps, agency_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, steps = EXCLUDED.steps, updated_at = EXCLUDED.updated_at`,
                [s.id, s.name || null, JSON.stringify(s.steps || []), s.agency_id || null, s.created, s.updated]
            );
        } catch (e) {
            console.error(`Error migrating sequence ${s.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Sequences migrated.');

    // --- 9. Migrate LEAD FOLLOWUPS ---
    console.log('⏳ [Migration] Fetching lead followups from PocketBase...');
    const pbFollowups = await pb.collection('lead_followups').getFullList();
    console.log(`⏳ [Migration] Found ${pbFollowups.length} lead followups. Migrating...`);
    for (const f of pbFollowups) {
        try {
            await pgQuery(
                `INSERT INTO lead_followups (id, lead, sequence, current_step, next_send_at, status, agency_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET 
                    current_step = EXCLUDED.current_step, next_send_at = EXCLUDED.next_send_at, 
                    status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
                [f.id, f.lead || null, f.sequence || null, f.current_step || 0, f.next_send_at ? new Date(f.next_send_at) : null, f.status || 'pending', f.agency_id || null, f.created, f.updated]
            );
        } catch (e) {
            console.error(`Error migrating lead followup ${f.id}:`, e.message);
        }
    }
    console.log('✅ [Migration] Lead followups migrated.');

    console.log('🎉 [Migration] Database migration completed successfully!');
    if (shouldEndPool) pool.end();
}

if (require.main === module) {
    runMigration(true).catch(err => {
        console.error('❌ [Migration] Critical error running migration script:', err);
        pool.end();
    });
}

module.exports = { runMigration };

