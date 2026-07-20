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
            const project = JSON.parse(data);
            console.log("=== Project Details ===");
            console.log("ID:", project.id);
            console.log("Name:", project.name);
            
            console.log("\n=== Applications ===");
            if (project.applications) {
                project.applications.forEach(app => {
                    console.log(`- Name: ${app.name}`);
                    console.log(`  Status: ${app.status}`);
                    console.log(`  FQDN: ${app.fqdn}`);
                    console.log(`  Limits Memory: ${app.limits_memory}`);
                    console.log(`  Limits CPUs: ${app.limits_cpus}`);
                    console.log(`  Limits CPU Shares: ${app.limits_cpu_shares}`);
                    console.log(`  Build Pack: ${app.build_pack}`);
                });
            }
            
            console.log("\n=== PostgreSQLs ===");
            if (project.postgresqls) {
                project.postgresqls.forEach(db => {
                    console.log(`- Name: ${db.name}`);
                    console.log(`  Status: ${db.status}`);
                    console.log(`  Image: ${db.image}`);
                    console.log(`  Limits Memory: ${db.limits_memory}`);
                    console.log(`  Limits CPUs: ${db.limits_cpus}`);
                });
            }
        } catch(e) {
            console.log("Error parsing:", e);
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
