const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/deployments/gko0ck4ks008wc4o04s000og',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer TSYU03K2BFZPC7TOuJYwQrrZvHfp2s9ugEqYrrUo887bca87'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log("=== FULL DEPLOYMENT RESULT ===");
            console.log("Status:", result.status);
            console.log("Keys:", Object.keys(result));
            if (result.logs) {
                console.log("Logs length:", result.logs.length);
                // Print the last 1500 characters of logs
                console.log(result.logs.substring(Math.max(0, result.logs.length - 1500)));
            } else {
                console.log("No logs field found.");
            }
        } catch(e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
