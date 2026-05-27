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
    role = "respondent",
}) => {
    const roleConfig = {
        respondent: { ctaText: "Làm khảo sát", ctaColor: "#4CAF50", ctaBg: "#e8f5e9" },
        viewer:      { ctaText: "Xem câu hỏi", ctaColor: "#1976D2", ctaBg: "#e3f2fd" },
        editor:      { ctaText: "Chỉnh sửa", ctaColor: "#F59E0B", ctaBg: "#fff8e1" },
    };
    const { ctaText, ctaColor, ctaBg } = roleConfig[role] || roleConfig.respondent;
    const roleNote = {
        respondent: "Bạn được mời làm khảo sát này. Nhấn nút bên dưới để bắt đầu.",
        viewer:      "Bạn được mời xem câu hỏi của khảo sát này. Nhấn nút bên dưới để xem.",
        editor:      "Bạn được mời tham gia chỉnh sửa khảo sát này. Nhấn nút bên dưới để bắt đầu.",
    };
    const note = roleNote[role] || roleNote.respondent;

    await sendEmail({
        to,
        subject: `Bạn được mời tham gia khảo sát: ${surveyTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px 12px 0 0; padding: 24px 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">📋 Lời mời tham gia khảo sát</h1>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #333; margin: 0 0 8px;">
              Xin chào,
            </p>
            <p style="font-size: 14px; color: #555; margin: 0 0 4px;">
              <strong>${senderName}</strong> (${senderEmail}) đã mời bạn tham gia khảo sát.
            </p>

            <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${ctaColor};">
              <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em;">Tên khảo sát</p>
              <h3 style="margin: 0; color: #222; font-size: 18px;">${surveyTitle}</h3>
            </div>

            <div style="background-color: ${ctaBg}; padding: 12px 15px; border-radius: 8px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #555;">
                <strong style="color: ${ctaColor};">Vai trò của bạn:</strong> ${role === "respondent" ? "📋 Người trả lời" : role === "viewer" ? "👁️ Người xem" : "✏️ Biên tập viên"}
              </p>
            </div>

            <p style="font-size: 14px; color: #555; margin: 0 0 20px; line-height: 1.6;">
              ${note}
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${surveyLink}"
                 style="display: inline-block; background-color: ${ctaColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                 ${ctaText}
              </a>
            </div>

            <p style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; margin: 20px 0 0;">
              Email này được gửi tự động bởi Data Collection System thay mặt ${senderName}.
            </p>
          </div>
        </div>
        `,
    }).catch((error) => {
        console.error('Error sending invite email:', error);
    });
};

export { sendEmail, sendVerificationEmail, reSendVerificationEmail, sendPasswordResetEmail, sendInviteEmail };