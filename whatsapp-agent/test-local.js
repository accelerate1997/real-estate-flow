require('dotenv').config();
const readline = require('readline');
const { processMessage } = require('./gemini');

// Set up readline interface for CLI interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("=========================================");
console.log(" Rajesh Real Estate AI - Local Terminal  ");
console.log("=========================================");
console.log("Type your message and press Enter. Ensure .env is setup.");
console.log("Type 'exit' or 'quit' to end the session.");
console.log("-----------------------------------------\n");

const phoneNumber = "1234567890"; // Mock static user ID for session tracking

function promptUser() {
    rl.question('\nYou: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log('Ending session. Goodbye!');
            rl.close();
            process.exit(0);
        }

        if (input.trim() === '') {
            promptUser();
            return;
        }

        try {
            console.log('AI is typing...');
            const reply = await processMessage(input, phoneNumber);
            console.log('\nAgent: ' + reply);
        } catch (error) {
            console.error('\n[Fatal Error]:', error.message);
        }

        // Loop back for next input
        promptUser();
    });
}

// Start CLI
promptUser();
