import fs from 'fs';
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        const users = await pb.collections.getOne('users');
        let changed = false;

        // In newer PocketBase, it's .fields instead of .schema for the collection fields
        const schemaFields = users.fields || users.schema;

        const hasIsActive = schemaFields.find(f => f.name === 'isActive');
        if (!hasIsActive) {
            schemaFields.push({
                system: false,
                id: 'pb_is_active',
                name: 'isActive',
                type: 'bool',
                required: false,
                presentable: false,
                unique: false,
                options: {}
            });
            changed = true;
        }

        const newRule = "id = @request.auth.id || (role = 'agent' && agencyId = @request.auth.id)";
        if (users.updateRule !== newRule) {
            users.updateRule = newRule;
            changed = true;
        }

        if (changed) {
            if (users.fields) users.fields = schemaFields;
            if (users.schema) users.schema = schemaFields;
            await pb.collections.update('users', users);
            console.log('Users schema updated.');
        } else {
            console.log('Users schema already up to date.');
        }

        const allUsers = await pb.collection('users').getFullList();
        let countCount = 0;
        for (let u of allUsers) {
            if (u.isActive !== true && u.isActive !== false) {
                await pb.collection('users').update(u.id, { isActive: true });
                countCount++;
            }
        }
        console.log(`Backfilled isActive=true for ${countCount} users.`);

    } catch (e) {
        console.error("Error setting up DB:", e.response || e);
    }
}

run();
