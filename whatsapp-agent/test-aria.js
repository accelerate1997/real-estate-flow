require('dotenv').config();
const { processMessage } = require('./openai_service');

async function testAria() {
    console.log("--- Testing Aria Persona ---");
    
    // Simulate a first message
    console.log("\nUser: Hi");
    const reply1 = await processMessage("Hi", "919876543210", "r1fh7lhgwte6p30");
    console.log("Aria:", reply1);

    // Simulate requirement gathering
    console.log("\nUser: I'm looking for a 3BHK in Worli");
    const reply2 = await processMessage("I'm looking for a 3BHK in Worli", "919876543210", "r1fh7lhgwte6p30");
    console.log("Aria:", reply2);
}

testAria().catch(console.error);
