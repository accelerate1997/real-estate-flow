const https = require('https');

https.get('https://realestateflow.elevetoai.com/assets/index-CkuQRTfj.js', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 5000000) { // Limit to 5MB
            res.destroy();
        }
    });
    res.on('close', () => {
        console.log("Downloaded:", data.length, "bytes");
        const containsWhatsAppContact = data.includes("WhatsApp Contact");
        console.log("Contains 'WhatsApp Contact':", containsWhatsAppContact);
        
        // Find any references to lead.name rendering
        const index = data.indexOf("lead.name");
        if (index !== -1) {
            console.log("Found 'lead.name' at index:", index);
            console.log("Snippet:", data.substring(index - 50, index + 100));
        } else {
            console.log("'lead.name' not found in JS file!");
        }
    });
}).on('error', (e) => {
    console.error(e);
});
