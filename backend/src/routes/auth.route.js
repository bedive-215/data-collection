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
import { validate } from "../middlewares/validate.middleware.js";

import { registerSchema } from "../validates/register.validate.js";
import { loginSchema } from "../validates/login.validate.js";
import { oauthLoginRequest } from "../validates/oauthLogin.validate.js";
import { verifyEmailRequest } from "../validates/verifyEmail.validate.js";
import { reSendVerifyCodeRequest } from "../validates/resendVerifyEmail.validate.js";
import { forgotPasswordRequest, verifyResetCodeRequest, resetPasswordRequest } from "../validates/forgotPassword.validate.js";

import { Router } from 'express';

const route = Router();

route.post('/register', validate(registerSchema), register);
route.post('/login', validate(loginSchema), login);
route.post('/verify', validate(verifyEmailRequest), verifyEmail);
route.post('/verification-code/resend', validate(reSendVerifyCodeRequest), resendVerifyCode);
route.post('/login/oauth', validate(oauthLoginRequest), oauthLogin);
route.post('/forgot-password', validate(forgotPasswordRequest), sendResetPasswordCode);
route.post("/verify-reset-code", validate(verifyResetCodeRequest), verifyResetCode);
route.post('/reset-password', validate(resetPasswordRequest), resetPassword);

route.post('/refresh-token', authMiddleware.checkAuth, checkAuth);
route.post('/logout', authMiddleware.auth, logout);

export default route;