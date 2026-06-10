import rateLimit from "express-rate-limit";

// Dùng store mặc định (memory) phù hợp local/dev.
// Khi deploy production nên dùng Redis store.

const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || { status: "error", message: "Too many requests" },
  });

export const authLoginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: "error", message: "Too many login attempts. Try again later." },
});

export const authRegisterRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { status: "error", message: "Too many register requests. Try again later." },
});

export const authPasswordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: "error", message: "Too many password reset requests. Try again later." },
});

export const authRefreshTokenRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "error", message: "Too many refresh attempts. Try again later." },
});

