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
console.log(`Using Admin Email: ${email}`);

if (!pbUrl || !email || !password) {
    console.error('Missing PocketBase credentials in .env');
    process.exit(1);
}

const pb = new PocketBase(pbUrl);

async function setup() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('Authenticated successfully!');

        console.log('Fetching users collection...');
        const usersCollection = await pb.collections.getOne('users');

        // Add new fields if they don't exist
        const fieldsToAdd = [
            { name: 'agencyName', type: 'text', required: false, max: null, min: null, pattern: '' },
            { name: 'phone', type: 'text', required: false, max: null, min: null, pattern: '' },
            { name: 'metadata', type: 'json', required: false, maxSize: 2000000 }
        ];

        let updated = false;

        // PocketBase v0.23+ uses fields instead of schema
        const schemaArray = usersCollection.fields || usersCollection.schema;

        const currentSchemaNames = schemaArray.map(f => f.name);

        for (const field of fieldsToAdd) {
            if (!currentSchemaNames.includes(field.name)) {
                schemaArray.push(field);
                updated = true;
                console.log(`Added field: ${field.name}`);
            }
        }

        if (usersCollection.fields) {
            usersCollection.fields = schemaArray;
        } else {
            usersCollection.schema = schemaArray;
        }

        // Make sure Create rule is public so users can register
        if (usersCollection.createRule !== "") {
            usersCollection.createRule = ""; // empty string means public in PocketBase v0.22+
            updated = true;
            console.log('Updated users collection createRule to public (allow registration)');
        }

        if (updated) {
            console.log('Updating users collection schema...');
            await pb.collections.update('users', usersCollection);
            console.log('Users collection updated successfully!');
        } else {
            console.log('Users collection already has the required fields and permissions.');
        }

        console.log('\n--- Setup complete! ---');
        console.log('You can now use Login and Registration on the frontend!');
    } catch (err) {
        console.error('Error setting up PocketBase:', err.response?.data || err.message);
    }
}

setup();
