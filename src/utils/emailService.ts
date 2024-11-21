// emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password
  },
});

export const sendVerificationEmail = async (to: any, verificationCode: any) => {
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

  await transporter.sendMail(mailOptions);
};
