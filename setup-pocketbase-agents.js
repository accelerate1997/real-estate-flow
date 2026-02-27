import fs from 'fs';
import PocketBase from 'pocketbase';

const envFile = fs.readFileSync('.env', 'utf-8');
const envConfig = envFile.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) {
        acc[key.trim()] = val.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
    return acc;
}, {});

const pbUrl = envConfig.POCKETBASE_URL || envConfig.VITE_POCKETBASE_URL;
const email = envConfig.POCKETBASE_ADMIN_EMAIL;
const password = envConfig.POCKETBASE_ADMIN_PASSWORD;

console.log(`Using PocketBase URL: ${pbUrl}`);

const pb = new PocketBase(pbUrl);

async function setupAgents() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('Authenticated successfully!');

        // 1. Update users collection
        console.log('Fetching users collection...');
        const usersCollection = await pb.collections.getOne('users');

        const userFieldsToAdd = [
            { name: 'role', type: 'select', options: { maxSelect: 1, values: ['owner', 'agent'] } },
            { name: 'agencyId', type: 'relation', options: { collectionId: usersCollection.id, cascadeDelete: false, maxSelect: 1 } }
        ];

        let usersUpdated = false;
        const userSchemaArray = usersCollection.fields || usersCollection.schema;
        const currentUserSchemaNames = userSchemaArray.map(f => f.name);

        for (const field of userFieldsToAdd) {
            if (!currentUserSchemaNames.includes(field.name)) {
                userSchemaArray.push(field);
                usersUpdated = true;
                console.log(`Added field to users: ${field.name}`);
            }
        }

        if (usersUpdated) {
            if (usersCollection.fields) {
                usersCollection.fields = userSchemaArray;
            } else {
                usersCollection.schema = userSchemaArray;
            }
            console.log('Updating users collection schema...');
            await pb.collections.update('users', usersCollection);
            console.log('Users collection updated successfully!');
        } else {
            console.log('Users collection already has the agent fields.');
        }

        // 2. Create invites collection
        console.log('Checking for invites collection...');
        try {
            await pb.collections.getOne('invites');
            console.log('invites collection already exists.');
        } catch (e) {
            console.log('Creating invites collection...');
            const newCollection = {
                name: 'invites',
                type: 'base',
                createRule: 'agencyId = @request.auth.id',
                viewRule: '', // anyone with the link can view it to validate
                updateRule: 'agencyId = @request.auth.id || @request.auth.id != ""', // allow anyone logged in or owner to mark used
                deleteRule: 'agencyId = @request.auth.id',
                fields: [
                    { name: 'token', type: 'text', required: true, max: 100, min: null, pattern: '' },
                    { name: 'agencyId', type: 'relation', required: true, maxSelect: 1, collectionId: usersCollection.id, cascadeDelete: true },
                    { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['pending', 'used'] },
                    { name: 'expiresAt', type: 'date', required: true }
                ]
            };
            await pb.collections.create(newCollection);
            console.log('invites collection created successfully!');
        }

        console.log('\n--- Agent Setup complete! ---');
    } catch (err) {
        console.error('Error setting up Agent schema:', err.response?.data || err.message);
    }
}

setupAgents();
