import PocketBase from 'pocketbase';
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function run() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        const ruleViewList = "agencyId = @request.auth.agencyId || agencyId = @request.auth.id || agencyId = ''";
        const ruleUpdateDelete = "createdBy = @request.auth.id || agencyId = @request.auth.id";

        await pb.collections.update('properties', {
            listRule: ruleViewList,
            viewRule: ruleViewList,
            createRule: "@request.auth.id != ''",
            updateRule: ruleUpdateDelete,
            deleteRule: ruleUpdateDelete
        });

        console.log("✅ Successfully updated rules in properties collection.");
    } catch (e) {
        console.error("Rule Update Failed:", e.response?.data || e.message);
    }
}
run();
