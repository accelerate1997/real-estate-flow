const https = require('https');

https.get('https://realestateflow.elevetoai.com/agency-dashboard?cb=' + Date.now(), (res) => {
    let html = '';
    res.on('data', (chunk) => { html += chunk; });
    res.on('end', () => {
        console.log("=== HTML Response ===");
        console.log(html);
    });
}).on('error', (e) => {
    console.error(e);
});
