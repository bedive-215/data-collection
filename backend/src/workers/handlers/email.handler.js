// workers/handlers/email.handler.js
export const emailHandlers = {
    "invite-email": async (data) => {
        return sendInviteEmail(data);
    },

    "verification-email": async (data) => {
        return sendVerificationEmail(
            data.to,
            data.code,
            data.expireTime,
            data.fullName
        );
    },

    "password-reset-email": async (data) => {
        return sendPasswordResetEmail(
            data.to,
            data.code,
            data.expireTime,
            data.fullName
        );
    },
};