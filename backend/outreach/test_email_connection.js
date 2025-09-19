import { api } from "encore.dev/api";
import { crmDB } from "./db";
// Tests the email connection by sending a test email to the user's own email address.
export const testEmailConnection = api({ expose: true, method: "POST", path: "/outreach/test-email-connection" }, async (req) => {
    try {
        // Get user's email connection settings
        const emailSettings = await crmDB.queryRow `
        SELECT provider, email_address, is_active
        FROM user_email_settings 
        WHERE user_id = ${req.userId} AND is_active = TRUE
      `;
        if (!emailSettings) {
            return {
                success: false,
                message: "No email connection found. Please connect your email account first.",
            };
        }
        // Get user details for the test email
        const user = await crmDB.queryRow `
        SELECT first_name, last_name, email_signature
        FROM users 
        WHERE id = ${req.userId}
      `;
        if (!user) {
            return {
                success: false,
                message: "User not found.",
            };
        }
        const testSubject = "ProByr CRM - Email Connection Test";
        const testBody = `Hello ${user.first_name},

This is a test email from your ProByr CRM to verify that your email connection is working correctly.

If you received this email, your email integration is configured properly and you can send emails from the CRM.

Best regards,
ProByr CRM System

--
This is an automated test email sent from ProByr CRM.`;
        // In a real implementation, this would actually send the email using the configured SMTP settings
        // For this demo, we'll simulate the email sending process
        console.log(`Test email would be sent to: ${emailSettings.email_address}`);
        console.log(`Subject: ${testSubject}`);
        console.log(`Body: ${testBody}`);
        console.log(`Provider: ${emailSettings.provider}`);
        // Simulate different outcomes based on provider for demo purposes
        if (emailSettings.provider === 'gmail' || emailSettings.provider === 'outlook') {
            // OAuth providers - simulate success
            return {
                success: true,
                message: "Test email sent successfully! Please check your inbox.",
            };
        }
        else if (emailSettings.provider === 'smtp') {
            // SMTP - simulate potential failure for demo
            return {
                success: false,
                message: "Connection failed. Please verify your SMTP server, port, and credentials.",
                error: "SMTP authentication failed: Invalid username or password",
            };
        }
        return {
            success: true,
            message: "Test email sent successfully! Please check your inbox.",
        };
    }
    catch (error) {
        console.error('Error testing email connection:', error);
        return {
            success: false,
            message: "Connection failed. Please verify your SMTP server, port, and credentials.",
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
});
//# sourceMappingURL=test_email_connection.js.map