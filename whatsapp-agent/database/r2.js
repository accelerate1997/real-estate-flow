const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const mime = require('mime-types');

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucketName = process.env.R2_BUCKET_NAME;

let r2Client = null;

if (accessKeyId && secretAccessKey && endpoint) {
    console.log(`☁️ [R2] Initializing Cloudflare R2 client for bucket "${bucketName}"`);
    r2Client = new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        }
    });
} else {
    console.warn('⚠️ [R2] Cloudflare R2 credentials missing. R2 uploads will be disabled!');
}

async function uploadToR2(filePath, r2Key) {
    if (!r2Client) {
        console.error('❌ [R2] S3 Client not initialized. Cannot upload.');
        return false;
    }
    
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ [R2] Local file not found: ${filePath}`);
            return false;
        }
        
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        
        console.log(`☁️ [R2] Uploading ${r2Key} (${fileBuffer.length} bytes, type ${mimeType}) to R2...`);
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: mimeType
        });
        
        await r2Client.send(command);
        console.log(`✅ [R2] Uploaded successfully: ${r2Key}`);
        
        // Delete local temporary file
        try {
            fs.unlinkSync(filePath);
        } catch (e) {}
        
        return true;
    } catch (err) {
        console.error(`❌ [R2] Upload failed for ${r2Key}:`, err.message);
        return false;
    }
}

module.exports = {
    r2Client,
    uploadToR2
};
