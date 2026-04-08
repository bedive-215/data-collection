import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/token.js";
import "dotenv/config";
import models from "../models/index.js";
import { AppError } from "./handleException.middlware.js";

export class authMiddleware {

    async auth(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];

            if (!token) {
                throw new AppError('Access token required', 401);
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!decoded) throw new AppError('Invalid decode', 400)

            const user = await models.User.findByPk(decoded.user_id);
            if (!user) {
                throw new AppError('User not found', 404);
            }
            req.user = {
                id: decoded.user_id,
                email: decoded.email,
                role: decoded.role,
                full_name: user.full_name,
                role: user.role,
                phone_number: decoded.phone_number
            };

            next();
        } catch (err) {
            console.error("Auth middleware error:", err);
            if (err.name === "TokenExpiredError") {
                return next(new AppError("Access token expired", 401));
            }
            if (err.name === "JsonWebTokenError") {
                return next(new AppError("Invalid token", 403));
            }
            next(err);
        }
    }

    // Middleware làm mới Access Token bằng Refresh Token
    async checkAuth(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                throw new AppError('Refresh token missing', 401);
            }

            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const user = await models.User.findOne({
                where: {
                    id: decoded.id,
                    refresh_token: refreshToken
                }
            });

            if (!user) {
                throw new AppError('Invalid refresh token', 403);
            }

            // Kiểm tra refresh token hết hạn chưa
            if (user.refresh_token_expires_at && new Date(user.refresh_token_expires_at) < new Date()) {
                throw new AppError('Refresh token expired. Please login again.', 401);
            }

            // Tạo access token mới
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                phone_number: user.phone_number
            };

            const newAccessToken = generateAccessToken(payload);

            req.user = payload;
            req.token = newAccessToken;
            res.locals.newAccessToken = newAccessToken;

            return next();
        } catch (err) {
            console.error("checkAuth middleware error:", err.message);

            if (err.name === "TokenExpiredError") {
                return next(new AppError('Refresh token expired. Please login again.', 401));
            }
            if (err.name === "JsonWebTokenError") {
                return next(new AppError('Invalid refresh token', 403));
            }
            next(err);
        }
    }

    checkRole(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                throw new AppError('Unauthorized', 401);
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AppError('Access denied. Insufficient permissions.', 403);
            }
            next();
        };
    }
}

export default new authMiddleware;