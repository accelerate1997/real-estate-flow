const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/deployments/rog04s4c0c4c4w88skkwo88w',
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
        console.log(`Status: ${res.statusCode}`);
        try {
            const result = JSON.parse(data);
            console.log("Status:", result.status);
            console.log("Logs excerpt:");
            if (result.logs) {
                console.log(result.logs.substring(result.logs.length - 1000));
            } else {
                console.log(JSON.stringify(result, null, 2));
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
