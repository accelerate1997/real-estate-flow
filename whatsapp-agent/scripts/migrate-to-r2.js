require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    console.error('❌ Error: Cloudflare R2 credentials missing in env variables!');
    console.error('Please configure R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET_NAME.');
    process.exit(1);
}

const r2Client = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    }
});

const uploadsDir = path.join(__dirname, '..', 'uploads');

function getFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

async function uploadToR2(filePath, r2Key) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: mimeType
        });
        
        await r2Client.send(command);
        console.log(`✅ [R2] Uploaded: ${r2Key}`);
        return true;
    } catch (err) {
        console.error(`❌ [R2] Upload failed for ${r2Key}:`, err.message);
        return false;
    }
}

async function run() {
    console.log('🏁 [R2 Migration] Starting media upload to Cloudflare R2...');
    console.log(`📁 Scanning directory: ${uploadsDir}`);
    
    const allFiles = getFilesRecursively(uploadsDir);
    console.log(`🔍 Found ${allFiles.length} files to migrate.`);
    
    let successCount = 0;
    for (const filePath of allFiles) {
        // Construct R2 key based on relative path from uploadsDir
        // Example: properties/ingpc9b2ybo7a96/stock_4_zyan0ulzf5.jpg
        const relativePath = path.relative(uploadsDir, filePath).replace(/\\/g, '/');
        const success = await uploadToR2(filePath, relativePath);
        if (success) successCount++;
    }
    
    console.log(`\n🎉 R2 Migration Completed! Successfully uploaded ${successCount}/${allFiles.length} files.`);
}

run();
