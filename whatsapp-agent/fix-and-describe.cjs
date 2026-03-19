require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

async function run() {
    try {
        console.log("Authenticating as Admin...");
        const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password: password })
        });
        const authData = await authRes.json();
        const token = authData.token;
        if (!token) throw new Error("Authentication failed");

        console.log("Fixing Property Collection Rules...");
        await fetch(`${pbUrl}/api/collections/pbc_2037580119`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({
                listRule: "",
                viewRule: ""
            })
        });

        console.log("Fetching Properties...");
        const propRes = await fetch(`${pbUrl}/api/collections/properties/records?perPage=50`, {
            headers: { 'Authorization': token }
        });
        const propData = await propRes.json();
        const properties = propData.items;

        console.log(`Processing ${properties.length} properties...`);

        for (const prop of properties) {
            if (prop.description && prop.description.length > 50) {
                console.log(`Skipping ${prop.title} (already has description)`);
                continue;
            }

            console.log(`Generating description for: ${prop.title}...`);
            const prompt = `Generate a highly professional, luxurious real estate description for a property with these details:
            Title: ${prop.title}
            Location: ${prop.location}
            Price: ${prop.price}
            Category: ${prop.propertyCategory}
            BHK: ${prop.bhkType}
            
            The description should be 2-3 paragraphs, highlight premium features, use sophisticated language, and sound extremely professional for an elite real estate agency. Do not use placeholders.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
            });

            const description = completion.choices[0].message.content;

            await fetch(`${pbUrl}/api/collections/properties/records/${prop.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ description })
            });
            console.log(`Updated ${prop.title}`);
        }

        console.log("All properties updated successfully!");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
