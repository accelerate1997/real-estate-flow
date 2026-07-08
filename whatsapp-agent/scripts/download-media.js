require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../database/db');

const pbUrl = (process.env.POCKETBASE_URL || 'http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/').replace(/\/$/, '');
const uploadsDir = path.join(__dirname, '..', 'uploads');

async function downloadFile(url, destPath) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`⬇️ Downloading: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`❌ Failed to download ${url}: ${response.statusText}`);
            return false;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(destPath, buffer);
        console.log(`✅ Saved to: ${destPath}`);
        return true;
    } catch (err) {
        console.error(`❌ Error downloading ${url}:`, err.message);
        return false;
    }
}

async function run() {
    console.log('🏁 [Media Download] Starting asset download from PocketBase...');
    console.log(`🔗 PocketBase URL: ${pbUrl}`);
    console.log(`📁 Local Uploads Directory: ${uploadsDir}`);
    
    try {
        const res = await pool.query('SELECT id, images, videos FROM properties');
        const properties = res.rows;
        console.log(`🏠 Found ${properties.length} properties in database.`);
        
        let totalFiles = 0;
        let successfulDownloads = 0;
        
        for (const p of properties) {
            const propertyId = p.id;
            let images = [];
            let videos = [];
            
            try {
                images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
            } catch (e) {
                images = p.images || [];
            }
            
            try {
                videos = typeof p.videos === 'string' ? JSON.parse(p.videos) : (p.videos || []);
            } catch (e) {
                videos = p.videos || [];
            }
            
            // Download Images
            if (Array.isArray(images)) {
                for (const img of images) {
                    if (img) {
                        totalFiles++;
                        const fileUrl = `${pbUrl}/api/files/properties/${propertyId}/${img}`;
                        const destPath = path.join(uploadsDir, 'properties', propertyId, img);
                        const success = await downloadFile(fileUrl, destPath);
                        if (success) successfulDownloads++;
                    }
                }
            }
            
            // Download Videos
            if (Array.isArray(videos)) {
                for (const vid of videos) {
                    if (vid) {
                        totalFiles++;
                        const fileUrl = `${pbUrl}/api/files/properties/${propertyId}/${vid}`;
                        const destPath = path.join(uploadsDir, 'properties', propertyId, vid);
                        const success = await downloadFile(fileUrl, destPath);
                        if (success) successfulDownloads++;
                    }
                }
            }
        }
        
        console.log(`\n🎉 Done! Downloaded ${successfulDownloads}/${totalFiles} files successfully.`);
        pool.end();
    } catch (err) {
        console.error('❌ Database error:', err.message);
        pool.end();
    }
}

run();
