require('dotenv').config({ path: './.env' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testConnect() {
    const evoUrl = process.env.EVOLUTION_API_URL;
    const evoKey = process.env.EVOLUTION_API_KEY;
    
    console.log("Testing connection to Evolution API...");
    console.log("URL:", evoUrl);
    
    if (!evoUrl || !evoKey) {
        console.error("❌ Evolution API keys missing in .env.");
        return;
    }

    try {
        const instanceName = "Test_Connection";
        console.log(`Step 1: Creating instance ${instanceName}...`);
        
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
        
        if (createData?.qrcode?.base64) {
            console.log("✅ Success! QR code retrieved from createRes.");
            console.log("Base64 length:", createData.qrcode.base64.length);
            return;
        }

        console.log("Step 2: Fetching QR for existing instance...");
        const connectRes = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': evoKey }
        });

        const connectData = await connectRes.json();
        if (connectData?.base64) {
            console.log("✅ Success! QR code retrieved from connectRes.");
            console.log("Base64 length:", connectData.base64.length);
        } else if (connectData?.instance?.state === 'open') {
            console.log("✅ Instance already connected!");
        } else {
            console.log("❌ Failed to get QR code.");
            console.log("Response:", JSON.stringify(connectData, null, 2));
        }
    } catch (error) {
        console.error("❌ Test error:", error);
    }
}

testConnect();
