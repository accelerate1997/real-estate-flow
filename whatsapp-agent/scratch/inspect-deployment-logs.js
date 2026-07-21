const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/deployments/y40ccscsksow0kgog4wwc4ss/logs',
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
        console.log(`Status Code: ${res.statusCode}`);
        console.log("Response:", data.substring(0, 1000));
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
