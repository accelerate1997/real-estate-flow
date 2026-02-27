import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        const collection = await pb.collections.getOne('properties');

        const hasFeatured = collection.fields ? collection.fields.some(f => f.name === 'isFeatured') : (collection.schema && collection.schema.some(f => f.name === 'isFeatured'));

        if (!hasFeatured) {
            if (collection.fields) {
                collection.fields.push({
                    system: false,
                    id: "feat1234",
                    name: "isFeatured",
                    type: "bool",
                    required: false,
                    presentable: false,
                    unique: false,
                    options: {}
                });
            } else if (collection.schema) {
                collection.schema.push({
                    system: false,
                    id: "feat1234",
                    name: "isFeatured",
                    type: "bool",
                    required: false,
                    presentable: false,
                    unique: false,
                    options: {}
                });
            }
            await pb.collections.update('properties', collection);
            console.log("Added isFeatured boolean field to properties collection.");
        } else {
            console.log("isFeatured field already exists.");
        }
    } catch (err) {
        console.error("Error:", err.status, err.message, err.response);
    }
}
run();
