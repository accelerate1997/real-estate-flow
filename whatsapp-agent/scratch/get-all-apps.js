const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/applications',
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
            const json = JSON.parse(data);
            console.log("=== All Coolify Applications ===");
            json.forEach(app => {
                console.log(`- Name: ${app.name}`);
                console.log(`  UUID: ${app.uuid}`);
                console.log(`  FQDN: ${app.fqdn}`);
                console.log(`  Status: ${app.status}`);
                console.log(`  Repository: ${app.git_repository}:${app.git_branch}`);
            });
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
