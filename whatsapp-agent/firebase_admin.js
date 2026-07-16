const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
admin.auth = getAuth;

require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log("✅ Firebase Admin SDK initialized with Service Account.");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin with Service Account:", error.message);
    }
} else if (projectId) {
    try {
        // Initialize with just the Project ID (sufficient for verifying client ID Tokens)
        admin.initializeApp({
            projectId: projectId
        });
        console.log(`✅ Firebase Admin SDK initialized for token verification (Project: ${projectId}).`);
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin with Project ID:", error.message);
    }
} else {
    console.warn("⚠️ Firebase configuration environment variables missing. Firebase verification will fail.");
}

module.exports = admin;
