import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import route from "#routes/app.route.js";
import "#infrastructure/events/eventListenerIndex.js";
import { errorHandler } from "#middlewares/handleException.middlware.js";

import { securityMiddleware } from "./middlewares/security.middleware.js";
import {
  authLoginRateLimiter,
  authRegisterRateLimiter,
  authPasswordResetRateLimiter,
  authRefreshTokenRateLimiter,
} from "./middlewares/rateLimit.middleware.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://frontend:5173",
];

// Middleware parse body phải trước route
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Security headers + rate limit (trước route)
app.use(securityMiddleware);

// Rate limit cho các endpoint nhạy cảm auth
app.post(
  "/api/v1/auth/login",
  authLoginRateLimiter,
  (req, res, next) => next()
);

app.post(
  "/api/v1/auth/register",
  authRegisterRateLimiter,
  (req, res, next) => next()
);

app.post(
  "/api/v1/auth/forgot-password",
  authPasswordResetRateLimiter,
  (req, res, next) => next()
);

app.post(
  "/api/v1/auth/verify-reset-code",
  authPasswordResetRateLimiter,
  (req, res, next) => next()
);

app.post(
  "/api/v1/auth/reset-password",
  authPasswordResetRateLimiter,
  (req, res, next) => next()
);

app.post(
  "/api/v1/auth/refresh-token",
  authRefreshTokenRateLimiter,
  (req, res, next) => next()
);

// Routes
app.use("/api/v1", route);
app.use(errorHandler);

export { app };
