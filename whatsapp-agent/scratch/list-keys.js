const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/applications/pggwccook48s4ks48cc00cos/envs',
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
            const envs = JSON.parse(data);
            console.log("Keys found:", envs.map(e => e.key).join(', '));
        } catch(e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
