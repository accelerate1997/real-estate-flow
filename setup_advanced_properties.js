import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');

        const propsCol = await pb.collections.getOne('properties');

        const newFields = [
            { name: 'title', type: 'text', required: true, options: {} },
            { name: 'description', type: 'text', required: false, options: {} },
            // Fallback to text to bypass strict enum schema configuration issues in PB 0.22/0.23 payloads
            { name: 'propertyCategory', type: 'text', required: true, options: {} },
            { name: 'transactionType', type: 'text', required: true, options: {} },
            { name: 'price', type: 'number', required: true, options: {} },
            { name: 'builtUpArea', type: 'number', required: true, options: {} },
            { name: 'carpetArea', type: 'number', required: true, options: {} },
            { name: 'bhkType', type: 'text', required: false, options: {} },
            { name: 'furnishing', type: 'text', required: false, options: {} },
            { name: 'floorDetails', type: 'text', required: false, options: {} },
            { name: 'businessTypeSuitability', type: 'text', required: false, options: {} },
            { name: 'washroomType', type: 'text', required: false, options: {} },
            { name: 'powerAmps', type: 'number', required: false, options: {} },
            { name: 'constructionStatus', type: 'text', required: false, options: {} },
            { name: 'reraId', type: 'text', required: false, options: {} },
            // Project Amenities in json
            { name: 'projectAmenities', type: 'json', required: false, options: {} },
            { name: 'expectedDeposit', type: 'number', required: false, options: {} },
            { name: 'pricePerSqFt', type: 'number', required: false, options: {} },
            { name: 'preferredTenant', type: 'text', required: false, options: {} },
            { name: 'location', type: 'text', required: false, options: {} },
            { name: 'amenities', type: 'json', required: false, options: {} },
            // Using ID string explicitly for Relation payload
            { name: 'agencyId', type: 'text', required: true, options: {} },
            { name: 'createdBy', type: 'text', required: true, options: {} },
            // Images payload
            { name: 'images', type: 'file', required: false, options: { maxSelect: 10, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] } }
        ];

        console.log("Updating properties collection with new schema...");
        await pb.collections.update('properties', {
            fields: [...propsCol.fields, ...newFields]
        });

        console.log("✅ Successfully injected schema fields into the 'properties' collection!");
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
