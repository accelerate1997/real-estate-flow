const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/deploy?uuid=pggwccook48s4ks48cc00cos&force=true',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer TSYU03K2BFZPC7TOuJYwQrrZvHfp2s9ugEqYrrUo887bca87',
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log("Response:", data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({}));
req.end();
