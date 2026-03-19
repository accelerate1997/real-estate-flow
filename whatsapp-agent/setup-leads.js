const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function setupLeads() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('Authenticated.');

        // Delete existing leads collection
        try {
            await pb.collections.delete('leads');
            console.log('Deleted old leads collection.');
        } catch (e) {
            console.log('Old leads collection not found or already deleted.');
        }

        console.log('Creating new leads collection with fully correct "fields" payload...');
        await pb.collections.create({
            name: 'leads',
            type: 'base',
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
            fields: [
                // Pocketbase always automatically inserts the id, created, updated fields.
                // We define ONLY our custom fields in Pocketbase 0.23+ format.
                { name: 'name', type: 'text', required: true },
                { name: 'phone', type: 'text', required: true },
                { name: 'email', type: 'text', required: false },
                { name: 'requirement', type: 'text', required: false },
                { name: 'date', type: 'text', required: false },
                { name: 'status', type: 'text', required: true },
                { name: 'agencyId', type: 'text', required: true }
            ]
        });

        console.log('Successfully created leads collection!');

    } catch (e) {
        console.error('Error:', JSON.stringify(e?.response || e, null, 2));
    }
}

setupLeads();
