import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
    let finalAgent;
    try {
        finalAgent = await pb.collection('users').getFirstListItem('email="finalagent@test.com"');
        console.log('Final Agent isActive Before Toggle:', finalAgent.isActive);
    } catch (e) {
        console.log('Final agent not found');
        return;
    }

    console.log("Toggling agent to false...");
    await pb.collection('users').update(finalAgent.id, { isActive: false });

    finalAgent = await pb.collection('users').getFirstListItem('email="finalagent@test.com"');
    console.log('Final Agent isActive After Toggle:', finalAgent.isActive);
}
run();
