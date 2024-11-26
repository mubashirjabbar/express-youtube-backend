import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to: string, verificationCode: number): Promise<void> => {
  try {
    // Validate inputs
    if (!to || !verificationCode) {
      throw new Error("Recipient email and verification code are required");
    }

    const htmlContent = `
      <html>
        <body>
          <h1>Email Verification</h1>
          <p>Your verification code is: <b>${verificationCode}</b></p>
          <p>Please use this code to verify your account.</p>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Email Verification",
      html: htmlContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error sending verification email:", error.message);
    } else {
      console.error("Error sending verification email: Unknown error occurred");
    }
    throw new Error("Failed to send verification email");
  }
};

