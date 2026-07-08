const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://pocketbase-eos80oss0css04wow848wssg.31.97.231.139.sslip.io/');

async function fix() {
    try {
        await pb.admins.authWithPassword('jashavantgoswami@gmail.com', '@Eleveto199704');
        const records = await pb.collection('lead_followups').getFullList();
        console.log('Found ' + records.length + ' total follow-up records.');
        
        const welcomeSeq = await pb.collection('sequences').getFirstListItem('name ~ "Welcome Sequence"');
        console.log('Target Welcome Sequence:', welcomeSeq.id);

        for (const r of records) {
            if (!r.sequence) {
                console.log('Restoring sequence link for record ' + r.id);
                await pb.collection('lead_followups').update(r.id, { sequence: welcomeSeq.id });
            } else {
                console.log('Record ' + r.id + ' already has sequence: ' + r.sequence);
            }
        }
        console.log('Wait, let me double check the expand works now.');
        const check = await pb.collection('lead_followups').getFullList({ expand: 'lead,sequence' });
        check.forEach(c => {
            console.log('ID:', c.id, '| Sequence expanded:', !!c.expand?.sequence);
        });

    } catch (err) { console.error('Error:', err.message); }
}
fix();
