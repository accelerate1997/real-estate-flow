const http = require('http');

function getLogs(uuid, name) {
    const options = {
        hostname: '31.97.231.139',
        port: 8000,
        path: `/api/v1/applications/${uuid}/logs`,
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
            console.log(`\n=== Coolify Application Logs for: ${name} (${uuid}) ===`);
            console.log(`Status Code: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                console.log(json.logs || json.message || json);
            } catch (e) {
                // If it is raw text logs
                const lines = data.split('\n');
                console.log(lines.slice(-30).join('\n'));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request for ${name}: ${e.message}`);
    });

    req.end();
}

// Check logs for the two potential backend/frontend apps
getLogs('pggwccook48s4ks48cc00cos', 'Real Estate Flow');
getLogs('zkg4g0k4ww0s8cgckwk8k00o', 'Eleveto Ai 2.0');
