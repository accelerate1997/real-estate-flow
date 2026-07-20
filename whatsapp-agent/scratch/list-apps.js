const http = require('http');

const options = {
    hostname: '31.97.231.139',
    port: 8000,
    path: '/api/v1/projects/d480go4k4c8wgcwow480swgk/production',
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
            const env = JSON.parse(data);
            console.log("Keys in environment object:", Object.keys(env));
            if (env.applications) {
                console.log("\nApplications found:");
                env.applications.forEach(app => {
                    console.log(`- Name: ${app.name}, UUID: ${app.uuid}, Status: ${app.status}`);
                });
            }
        } catch(e) {
            console.log("Parse error:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
