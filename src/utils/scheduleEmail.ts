import cron from "node-cron";
import { sendVerificationEmail } from "./emailService.js";

export const scheduleEmail = (email: any, verificationCode: any) => {
    // Get the current time and calculate the delay for 2 minutes
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000);

    console.log(`Email scheduled for: ${scheduledTime.toISOString()}`);

    // Create a one-time cron job that checks every second
    const job = cron.schedule("* * * * * *", async () => {
        const currentTime = new Date();

        // Check if the current time has reached or exceeded the scheduled time
        if (currentTime >= scheduledTime) {
            try {
                await sendVerificationEmail(email, verificationCode);
                console.log(`Email sent to ${email}`);
            } catch (error) {
                console.error("Failed to send email:", error);
            }

            // Stop the job after sending the email
            job.stop();
            console.log("Cron job stopped after sending the email.");
        }
    });
};
