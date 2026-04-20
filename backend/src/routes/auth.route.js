import AuthController from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import { registerSchema } from "../validates/register.validate.js";
import { loginSchema } from "../validates/login.validate.js";
import { oauthLoginRequest } from "../validates/oauthLogin.validate.js";
import { verifyEmailRequest } from "../validates/verifyEmail.validate.js";
import { reSendVerifyCodeRequest } from "../validates/resendVerifyEmail.validate.js";
import { forgotPasswordRequest, 
        verifyResetCodeRequest, 
        resetPasswordRequest } from "../validates/forgotPassword.validate.js";

import { Router } from 'express';

const route = Router();

route.post('/register', validate(registerSchema), AuthController.register);
route.post('/login', validate(loginSchema), AuthController.login);
route.post('/verify', validate(verifyEmailRequest), AuthController.verifyEmail);
route.post('/verification-code/resend', validate(reSendVerifyCodeRequest), AuthController.resendVerifyCode);
route.post('/login/oauth', validate(oauthLoginRequest), AuthController.oauthLogin);
route.post('/forgot-password', validate(forgotPasswordRequest), AuthController.sendResetPasswordCode);
route.post("/verify-reset-code", validate(verifyResetCodeRequest), AuthController.verifyResetCode);
route.post('/reset-password', validate(resetPasswordRequest), AuthController.resetPassword);

route.post('/refresh-token', authMiddleware.checkAuth, AuthController.checkAuth);
route.post('/logout', authMiddleware.auth, AuthController.logout);

export default route;