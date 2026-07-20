const http = require('http');
const https = require('https');

const token = "EAALsEDVF7joBR2kWMGTOBuq98a8So0yiDDDcfpmp7n2QgQ0vNEgnxLCnc22TCCmiYe1X9w9hZCh3DOTDu1Evs2x6NHBpTfmXUNcarCjWSa3pjM8w07hQyrolKTIOByxUAYrZCpUrYQmmg5kFSDvAhdZAT3W2q2nGGdIcRr644Xx593xeiGyM8uZCGazUkQZDZD";
const wabaId = "1608148864265490";

const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;

https.get(url, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch(e) {
            console.log(data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
