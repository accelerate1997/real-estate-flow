const http = require('http');
const https = require('https');

const postData = JSON.stringify({
    agencyId: 'r1fh7lhgwte6p30',
    name: 'welcome_outreach',
    category: 'MARKETING',
    language: 'en_US',
    components: [
        {
            type: 'BODY',
            text: 'Hello{{1}}\nThanks for showing interest in our Property {{2}}\nBest regards {{3}}'
        }
    ]
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/whatsapp/templates',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("📡 Sending test WABA template submission request to localhost:3000...");

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Body:`, data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
