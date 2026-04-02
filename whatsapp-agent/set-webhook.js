const EVO_URL = "http://evo-rck0sscs4sswok0g8gksoo0w.31.97.231.139.sslip.io";
const EVO_KEY = "Nl0045KG92A81As29nCwV1zuSjJDGGgC";
const INSTANCE = "Agency_r1fh7lhgwte6p30";
const WEBHOOK_URL = "https://realestateflow.elevetoai.com/webhook/";

async function setWebhook() {
    try {
        console.log(`Setting webhook for ${INSTANCE} to ${WEBHOOK_URL}...`);
        const res = await fetch(`${EVO_URL}/webhook/set/${INSTANCE}`, {
            method: 'POST',
            headers: {
                'apikey': EVO_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                webhook: {
                    enabled: true,
                    url: WEBHOOK_URL,
                    byEvents: false,
                    base64: false,
                    events: [
                        "MESSAGES_UPSERT",
                        "QRCODE_UPDATED",
                        "CONNECTION_UPDATE"
                    ]
                }
            })
        });

        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error setting webhook:", e);
    }
}

setWebhook();
