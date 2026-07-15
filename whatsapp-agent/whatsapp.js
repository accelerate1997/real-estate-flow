const { pool } = require('./database/db');
require('dotenv').config();

/**
 * Normalizes a phone number for Meta WhatsApp Cloud API (digits only, e.g. 919876543210)
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace('@s.whatsapp.net', '').replace(/[^\d]/g, '');
}

/**
 * Sends a WhatsApp message via the Official WhatsApp Business Cloud API
 * @param {string} remoteJid - The recipient's phone number
 * @param {string} text - The message text to send
 * @param {string} instanceName - The instance name, e.g., "Agency_${agencyId}"
 */
async function sendMessage(remoteJid, text, instanceName) {
    let token = process.env.WHATSAPP_TOKEN;
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const agencyId = instanceName && instanceName.startsWith('Agency_') ? instanceName.split('_')[1] : null;

    if (agencyId) {
        try {
            const res = await pool.query('SELECT metadata FROM users WHERE id = $1', [agencyId]);
            if (res.rows.length > 0) {
                const metadata = res.rows[0].metadata || {};
                if (metadata.whatsappToken && metadata.whatsappPhoneNumberId) {
                    token = metadata.whatsappToken;
                    phoneNumberId = metadata.whatsappPhoneNumberId;
                }
            }
        } catch (dbErr) {
            console.error("❌ Error fetching agency credentials from DB:", dbErr.message);
        }
    }

    if (!token || !phoneNumberId) {
        console.error("❌ WhatsApp API credentials missing. Cannot send message.");
        return false;
    }

    const cleanNumber = cleanPhoneNumber(remoteJid);
    if (!cleanNumber) {
        console.error("❌ Invalid recipient phone number.");
        return false;
    }

    try {
        console.log(`📡 Sending Meta WhatsApp message to ${cleanNumber} via Phone Number ID ${phoneNumberId}...`);
        
        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanNumber,
                type: "text",
                text: {
                    preview_url: false,
                    body: text
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ WhatsApp message sent successfully to ${cleanNumber}. Message ID: ${data.messages?.[0]?.id}`);
            return true;
        } else {
            console.error("❌ Meta WhatsApp API Error. HTTP", response.status);
            console.error("❌ Meta Error Response:", JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error("❌ Error sending Meta WhatsApp message:", error);
        return false;
    }
}

/**
 * Sends a WhatsApp Template message via the Official WhatsApp Business Cloud API
 * @param {string} remoteJid - The recipient's phone number
 * @param {string} templateName - The pre-approved template name
 * @param {string} languageCode - Language code, e.g. "en_US"
 * @param {Array} components - The template parameters components
 * @param {string} instanceName - The instance name, e.g., "Agency_${agencyId}"
 * @returns {Promise<string|null>} - Returns the Meta Message ID if successful, null otherwise
 */
async function sendTemplateMessage(remoteJid, templateName, languageCode, components, instanceName) {
    let token = process.env.WHATSAPP_TOKEN;
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const agencyId = instanceName && instanceName.startsWith('Agency_') ? instanceName.split('_')[1] : null;

    if (agencyId) {
        try {
            const res = await pool.query('SELECT metadata FROM users WHERE id = $1', [agencyId]);
            if (res.rows.length > 0) {
                const metadata = res.rows[0].metadata || {};
                if (metadata.whatsappToken && metadata.whatsappPhoneNumberId) {
                    token = metadata.whatsappToken;
                    phoneNumberId = metadata.whatsappPhoneNumberId;
                }
            }
        } catch (dbErr) {
            console.error("❌ Error fetching agency credentials from DB for template:", dbErr.message);
        }
    }

    if (!token || !phoneNumberId) {
        console.error("❌ WhatsApp API credentials missing. Cannot send template message.");
        return null;
    }

    const cleanNumber = cleanPhoneNumber(remoteJid);
    if (!cleanNumber) {
        console.error("❌ Invalid recipient phone number.");
        return null;
    }

    try {
        console.log(`📡 Sending Meta WhatsApp Template (${templateName}) to ${cleanNumber} via Phone Number ID ${phoneNumberId}...`);
        
        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: cleanNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: languageCode || 'en_US'
                    },
                    components: components || []
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            const messageId = data.messages?.[0]?.id || 'WAMI_UNKNOWN';
            console.log(`✅ WhatsApp template message sent successfully to ${cleanNumber}. Message ID: ${messageId}`);
            return messageId;
        } else {
            console.error("❌ Meta WhatsApp API Template Error. HTTP", response.status);
            console.error("❌ Meta Error Response:", JSON.stringify(data, null, 2));
            return null;
        }
    } catch (error) {
        console.error("❌ Error sending Meta WhatsApp template message:", error);
        return null;
    }
}

module.exports = {
    sendMessage,
    sendTemplateMessage,
    cleanPhoneNumber
};
