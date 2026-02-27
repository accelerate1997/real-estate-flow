import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        console.log("Fetching category with double quotes...");
        const resList = await pb.collection('properties').getFullList({
            filter: 'propertyCategory = "Residential"',
        });
        console.log("Residential double quotes:", resList.length);
    } catch (err) {
        console.error("Double quotes error:", err.status, err.response);
    }

    try {
        console.log("Fetching category with single quotes...");
        const resList2 = await pb.collection('properties').getFullList({
            filter: "propertyCategory = 'Residential'",
        });
        console.log("Residential single quotes:", resList2.length);
    } catch (err) {
        console.error("Single quotes error:", err.status, err.response);
    }
}

run();
