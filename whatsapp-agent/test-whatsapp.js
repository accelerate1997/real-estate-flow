require('dotenv').config({ path: './.env' });
const { sendMessage } = require('./whatsapp');

async function runTest() {
    const toPhone = process.argv[2];
    const message = process.argv[3] || "Hello from Rajesh Real Estate official WhatsApp integration!";

    if (!toPhone) {
        console.log("Usage: node test-whatsapp.js <phone_number> [message]");
        console.log("Example: node test-whatsapp.js 919876543210 'Hello!'");
        return;
    }

    console.log(`🚀 Starting Official WhatsApp test send...`);
    console.log(`Recipient: ${toPhone}`);
    console.log(`Message: ${message}`);
    
    console.log(`Global credentials check:`);
    console.log(`- WHATSAPP_TOKEN: ${process.env.WHATSAPP_TOKEN ? 'Set (starts with ' + process.env.WHATSAPP_TOKEN.substring(0, 8) + '...)' : 'MISSING'}`);
    console.log(`- WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || 'MISSING'}`);

    const result = await sendMessage(toPhone, message, 'Global_Test');
    
    if (result) {
        console.log("✅ Test message sending triggered successfully!");
    } else {
        console.log("❌ Test message sending failed. Check errors above.");
    }
}

runTest();
