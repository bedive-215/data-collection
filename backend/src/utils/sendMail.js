// utils/sendEmail.js
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Tạo transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // false vì port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // App Password Gmail
    },
});

// Gửi email
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM}" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.to}: ${info.messageId}`);
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

const sendVerificationEmail = async (to, code, expireTime, fullName) => {
    await sendEmail({
        to,
        subject: 'Verify your email - Data Collection System',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Data Collection System!</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Thank you for registering. Please verify your email address using the verification code below:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
          <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${code}</h1>
        </div>
        
        <p style="color: #666;">This code will expire in <strong>${expireTime} minutes</strong>.</p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you did not create an account, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          This is an automated email from Data Collection System. Please do not reply to this email.
        </p>
      </div>
    `,
    }).catch((error) => {
        console.error('Error sending verification email:', error);
    });
};

const reSendVerificationEmail = async (to, code, expireTime, fullName) => {
    await sendEmail({
        to,
        subject: 'Resend Verification Code - Data Collection System',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Resend Verification Code</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>You have requested a new verification code. Please use the code below to verify your email address:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">Your new verification code:</p>
          <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${code}</h1>
        </div>
        
        <p style="color: #666;">This code will expire in <strong>${expireTime} minutes</strong>.</p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you did not request this, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          This is an automated email from Data Collection System. Please do not reply to this email.
        </p>
      </div>
    `,
    }).catch((error) => {
        console.error('Error resending verification email:', error);
    });
};

const sendPasswordResetEmail = async (to, code, expireTime, fullName) => {
    await sendEmail({
        to,
        subject: 'Password Reset Request - Data Collection System',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Tech store!</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your reset password code below:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
            <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${code}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in <strong>${expireTime} minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            This is an automated email from Data Collection System. Please do not reply to this email.
          </p>
        </div>
      `,
    }).catch((error) => {
        console.error('Error sending password reset email:', error);
    });
};

const sendInviteEmail = async ({
    to,
    surveyTitle,
    surveyLink,
    senderName,
    senderEmail,
}) => {
    await sendEmail({
        to,
        subject: `You're invited to participate in a survey`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <h2 style="color: #333;">Survey Invitation</h2>
          
          <p>Hello,</p>
          
          <p>
            You have been invited by 
            <strong>${senderName}</strong> 
            (${senderEmail})
            to participate in a survey.
          </p>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Survey Title:</p>
            <h3 style="margin: 5px 0; color: #222;">${surveyTitle}</h3>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Take Survey
            </a>
          </div>

          <p style="color: #666;">
            Click the button above to start the survey. Your responses are valuable!
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

          <p style="font-size: 12px; color: #999;">
            This email was sent via Data Collection System on behalf of ${senderName}.
          </p>

        </div>
        `,
    }).catch((error) => {
        console.error('Error sending invite email:', error);
    });
};

export { sendEmail, sendVerificationEmail, reSendVerificationEmail, sendPasswordResetEmail, sendInviteEmail };