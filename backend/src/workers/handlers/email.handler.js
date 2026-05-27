// workers/handlers/email.handler.js
import { sendInviteEmail } from "../../utils/sendMail.js";

export const emailHandlers = {
    "invite-email": async (data) => {
        return sendInviteEmail(data);
    },

    "verification-email": async (data) => {
        return sendVerificationEmail(
            data.email,
            data.otp,
            data.otpExpires,
            data.full_name
        );
    },

    "password-reset-email": async (data) => {
        return sendPasswordResetEmail(
            data.email,
            data.code,
            data.expires,
            data.full_name
        );
    },

    "resend-verification-email": async (data) => {
        return reSendVerificationEmail(
            data.email,
            data.otp,
            data.otpExpires,
            data.full_name
        );
    },
};