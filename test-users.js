import PocketBase from 'pocketbase';

const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function test() {
    try {
        console.log("Authenticating as admin to list users...");
        // Authenticate as admin
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        console.log("Admin authentication successful!");

        const records = await pb.collection('users').getFullList();
        console.log("Total users found:", records.length);
        records.forEach((user, index) => {
            console.log(`[${index}] id: ${user.id}, email: "${user.email}", name: "${user.name}", role: "${user.role}"`);
        });
    } catch (err) {
        console.error("Error occurred:", err);
    }
}

test();
