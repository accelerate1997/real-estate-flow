require('dotenv').config();

/**
 * Sends a WhatsApp message via the Evolution API
 * @param {string} remoteJid - The recipient's phone number (with country code, no '+')
 * @param {string} text - The message text to send
 * @param {string} instanceName - The Evolution API instance name (default: "WA_Saathi" or dynamic)
 */
async function sendMessage(remoteJid, text, instanceName) {
    const evoUrl = process.env.EVOLUTION_API_URL;
    const evoKey = process.env.EVOLUTION_API_KEY;

    if (!evoUrl || !evoKey) {
        console.error("❌ Evolution API keys missing in .env. Cannot send message.");
        return false;
    }

    try {
        // Construct the correct phone number format for Evolution API
        // It usually expects the number without '+' and without '@s.whatsapp.net' for the simple send endpoint
        const cleanNumber = remoteJid.replace('+', '').replace('@s.whatsapp.net', '');

        console.log(`📡 Sending message to ${cleanNumber} via instance ${instanceName}...`);

        const response = await fetch(`${evoUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evoKey
            },
            body: JSON.stringify({
                number: cleanNumber,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                text: text
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Message sent successfully!");
            return true;
        } else {
            console.error("❌ Failed to send message. HTTP", response.status);
            console.error("❌ Evolution API Error Response:", JSON.stringify(data, null, 2));
            return false;
        }

    } catch (error) {
        console.error("❌ Error sending Evo API message:", error);
        return false;
    }
}

module.exports = {
    sendMessage
};
