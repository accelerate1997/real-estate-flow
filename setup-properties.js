import fs from 'fs';
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');

        try {
            await pb.collections.delete('properties');
        } catch (e) {
            // Does not exist
        }

        console.log("Creating 'properties' collection...");

        const usersCol = await pb.collections.getOne('users');
        const usersColId = usersCol.id;

        const newCollection = await pb.collections.create({
            name: "properties",
            type: "base",
            system: false,
            // the new syntax requires `schema` property in some versions and `fields` in others
            // Let's use `schema` but ensure options are correctly mapped
            schema: [
                { id: "title_field___", name: 'title', type: 'text', required: true, options: {} },
                { id: "desc_field____", name: 'description', type: 'editor', required: false, options: {} },
                { id: "type_field____", name: 'propertyType', type: 'select', required: false, options: { maxSelect: 1, values: ['Apartment', 'House', 'Commercial', 'Land'] } },
                { id: "status_field__", name: 'status', type: 'select', required: false, options: { maxSelect: 1, values: ['Available', 'Sold', 'Rented'] } },
                { id: "price_field___", name: 'price', type: 'number', required: true, options: {} },
                { id: "loc_field_____", name: 'location', type: 'text', required: false, options: {} },
                { id: "bed_field_____", name: 'bedrooms', type: 'number', required: false, options: {} },
                { id: "bath_field____", name: 'bathrooms', type: 'number', required: false, options: {} },
                { id: "area_field____", name: 'area', type: 'number', required: false, options: {} },
                { id: "agency_field__", name: 'agencyId', type: 'relation', required: true, options: { maxSelect: 1, collectionId: usersColId, cascadeDelete: false } },
                { id: "created_field_", name: 'createdBy', type: 'relation', required: true, options: { maxSelect: 1, collectionId: usersColId, cascadeDelete: false } }
            ]
        });

        console.log("Created successfully. Now updating rules...");

        const ruleViewList = "agencyId = @request.auth.agencyId || agencyId = @request.auth.id";
        const ruleUpdateDelete = "createdBy = @request.auth.id || agencyId = @request.auth.id";

        await pb.collections.update(newCollection.id, {
            listRule: ruleViewList,
            viewRule: ruleViewList,
            createRule: "@request.auth.id != ''",
            updateRule: ruleUpdateDelete,
            deleteRule: ruleUpdateDelete
        });

        console.log("Rules applied successfully.");

    } catch (e) {
        console.error("Error setting up DB:", JSON.stringify(e.response, null, 2) || e);
    }
}

run();
