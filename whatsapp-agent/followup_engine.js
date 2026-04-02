const db = require('./database');
const { sendMessage } = require('./evolution');

/**
 * Periodically checks for due follow-up messages and sends them.
 */
async function processFollowups() {
    console.log(`[Follow-up Engine] Checking for due follow-ups at ${new Date().toISOString()}...`);
    
    const dueFollowups = await db.getDueFollowups();
    
    if (dueFollowups.length === 0) {
        console.log(`[Follow-up Engine] No follow-ups due.`);
        return;
    }

    console.log(`[Follow-up Engine] Found ${dueFollowups.length} follow-ups due.`);

    for (const followup of dueFollowups) {
        try {
            const lead = followup.expand?.lead;
            const sequence = followup.expand?.sequence || followup.expand?.sequences;
            
            if (!sequence) {
                console.log('[DEBUG] Followup expand keys:', Object.keys(followup.expand || {}));
                console.log('[DEBUG] Followup raw sequence field:', followup.sequence);
            }

            const currentStepIndex = followup.current_step;
            const step = sequence?.steps[currentStepIndex];

            if (!lead || !sequence || !step) {
                console.error(`[Follow-up Engine] Missing data for followup ${followup.id}. Skipping.`);
                continue;
            }

            const phone = lead.phone;
            const instanceName = `Agency_${followup.agency_id}`;
            const message = step.message_template;

            console.log(`[Follow-up Engine] Sending step ${currentStepIndex + 1} to ${phone}...`);
            
            const sent = await sendMessage(phone, message, instanceName);
            
            if (sent) {
                // Determine next step
                const nextStepIndex = currentStepIndex + 1;
                const hasNextStep = sequence.steps.length > nextStepIndex;

                if (hasNextStep) {
                    const nextStep = sequence.steps[nextStepIndex];
                    const nextSendAt = new Date();
                    nextSendAt.setHours(nextSendAt.getHours() + (nextStep.delay_hours || 0));

                    await db.updateFollowupProgress(followup.id, {
                        current_step: nextStepIndex,
                        next_send_at: nextSendAt.toISOString(),
                        status: 'pending'
                    });
                    console.log(`[Follow-up Engine] Scheduled next step for ${phone} at ${nextSendAt.toISOString()}`);
                } else {
                    await db.updateFollowupProgress(followup.id, {
                        status: 'completed'
                    });
                    console.log(`[Follow-up Engine] Sequence completed for ${phone}.`);
                }
                
                // Log the follow-up message to chat logs
                await db.logChat(phone, 'assistant', `[Automated Follow-up] ${message}`, followup.agency_id, lead.id);
            } else {
                console.error(`[Follow-up Engine] Failed to send message to ${phone}. Will retry in next run.`);
            }
        } catch (err) {
            console.error(`[Follow-up Engine] Error processing followup ${followup.id}:`, err.message);
        }
    }
}

/**
 * Starts the follow-up engine.
 * @param {number} intervalMs - Interval in milliseconds (default: 15 minutes)
 */
function startEngine(intervalMs = 15 * 60 * 1000) {
    console.log(`🚀 Follow-up Engine started. Polling every ${intervalMs / 60000} minutes.`);
    
    // Initial run after a short delay
    setTimeout(processFollowups, 5000);
    
    setInterval(processFollowups, intervalMs);
}

module.exports = { startEngine, processFollowups };
