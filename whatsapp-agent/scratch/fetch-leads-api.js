const https = require('https');

const options = {
    hostname: 'realestateflow.elevetoai.com',
    port: 443,
    path: '/api/collections/leads?filter=agencyId=%22EiNHBsvo6GSrI7oIXR6CNaaVZxp1%22&sort=-created',
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("=== API LEADS RESPONSE ===");
            console.log("Total Items:", json.totalItems);
            if (json.items && json.items.length > 0) {
                console.log("First Lead Keys:", Object.keys(json.items[0]));
                console.log("First Lead Name:", json.items[0].name);
                console.log("First Lead Full:", JSON.stringify(json.items[0], null, 2));
            } else {
                console.log("No items found or response format different:", json);
            }
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw response:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
