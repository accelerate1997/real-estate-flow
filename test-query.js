import fs from 'fs';
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');
async function run() {
    try {
        console.log("Testing as owner: jashavantgoswami@gmail.com");
        await pb.collection('users').authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        console.log('Owner Auth ID:', pb.authStore.model.id);
        const ownerAgents = await pb.collection('users').getFullList({
            filter: `role = "agent" && agencyId = "${pb.authStore.model.id}"`
        });
        console.log("Owner sees agents:", ownerAgents.map(a => a.email));

        console.log("\nTesting as agent: finalagent@test.com");
        pb.authStore.clear();
        await pb.collection('users').authWithPassword('finalagent@test.com', 'password123');
        console.log('Agent Auth ID:', pb.authStore.model.id);
        const agentDirectory = await pb.collection('users').getFullList({
            filter: `role = "agent" && agencyId = "${pb.authStore.model.agencyId}"`
        });
        console.log("Agent sees directory:", agentDirectory.map(a => a.email));

    } catch (e) {
        console.error('Error:', e.response || e);
    }
}
run();
