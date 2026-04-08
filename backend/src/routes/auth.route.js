import {
    register,
    login,
    verifyEmail,
    resendVerifyCode,
    checkAuth,
    logout,
    oauthLogin,
    resetPassword,
    sendResetPasswordCode,
    verifyResetCode
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

import { Router } from 'express';

const route = Router();

route.post('/register', register);
route.post('/login', login);
route.post('/verify', verifyEmail);
route.post('/verification-code/resend', resendVerifyCode);
route.post('/refresh-token', authMiddleware.checkAuth, checkAuth);
route.post('/logout', authMiddleware.auth, logout);
route.post('/login/oauth', oauthLogin);
route.post('/forgot-password', sendResetPasswordCode);
route.post("/verify-reset-code", verifyResetCode);
route.post('/reset-password', resetPassword);

export default route;