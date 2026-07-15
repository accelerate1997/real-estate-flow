const admin = require('firebase-admin');
require('dotenv').config();

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log("✅ Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    }
} else {
    console.warn("⚠️ Firebase configuration environment variables missing. Firebase verification will fail.");
}

module.exports = admin;
