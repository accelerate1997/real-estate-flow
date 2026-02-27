import PocketBase from 'pocketbase';

const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        const propsCol = await pb.collections.getOne('properties');

        const hasVideoField = propsCol.schema?.some(f => f.name === 'videos') || propsCol.fields?.some(f => f.name === 'videos');

        if (hasVideoField) {
            console.log("ℹ️ The 'videos' field already exists in the 'properties' collection. Skipping update.");
            return;
        }

        const newField = {
            name: 'videos',
            type: 'file',
            required: false,
            options: {
                maxSelect: 3,
                maxSize: 52428800, // 50MB
                mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
            }
        };

        if (propsCol.fields) {
            console.log("Adding 'videos' to 'fields'");
            propsCol.fields.push(newField);
        } else if (propsCol.schema) {
            console.log("Adding 'videos' to 'schema'");
            propsCol.schema.push(newField);
        }

        console.log("Updating properties collection with 'videos' field...");
        await pb.collections.update('properties', propsCol);

        console.log("✅ Successfully injected 'videos' field (Max 3, 50MB each) into the 'properties' collection!");
    } catch (error) {
        console.error("❌ Failed to update schema:");
        if (error.response?.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

run();
