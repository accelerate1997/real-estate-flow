const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Array of premium real estate stock images from Unsplash
const stockImages = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628156113110-3889b7ac5523?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop'
];

async function seed() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('Authenticated.');

        const records = await pb.collection('properties').getFullList();
        console.log(`Found ${records.length} properties.`);

        for (let i = 0; i < records.length; i++) {
            const property = records[i];

            // Only update if no images
            if (!property.images || property.images.length === 0) {
                if (!property.title) {
                    console.log(`Skipping property ${property.id} because it is missing a title.`);
                    continue;
                }
                console.log(`Updating ${property.title} ...`);

                try {
                    // Pick a random image URL
                    const imageUrl = stockImages[i % stockImages.length];

                    console.log(`-- Downloading ${imageUrl}`);
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();

                    const formData = new FormData();
                    formData.append('images', blob, `stock_${i}.jpg`);

                    // To bypass missing required fields that might exist on old records, we ensure dummy values if needed, 
                    // but PocketBase validation is strict. Assuming valid records have title.
                    await pb.collection('properties').update(property.id, formData);
                    console.log(`-- Added image to ${property.id}.`);
                } catch (updateErr) {
                    console.error(`-- Failed to update ${property.id}:`, updateErr.response?.data || updateErr.message);
                }
            } else {
                console.log(`Property ${property.id} already has ${property.images.length} images.`);
            }
        }

        console.log('Finished updating properties!');
    } catch (e) {
        console.error('Error:', e?.response || e);
    }
}

seed();
