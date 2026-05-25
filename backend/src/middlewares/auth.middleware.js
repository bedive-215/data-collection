import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/token.js";
import "dotenv/config";
import models from "../models/index.js";
import { AppError } from "./handleException.middlware.js";
import _checkOwnerOrAdmin from "../utils/checkOwnerOrAdmin.js";

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
            if (!user.is_active) {
                throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
            }
            req.user = {
                id: decoded.user_id,
                email: decoded.email,
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

            if (!user.is_active) {
                throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
            }

            // Kiểm tra refresh token hết hạn chưa
            if (user.refresh_token_expires_at && new Date(user.refresh_token_expires_at) < new Date()) {
                throw new AppError('Refresh token expired. Please login again.', 401);
            }

            // Tạo access token mới
            const payload = {
                user_id: user.id,
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

    checkSurveyAccess(...allowedRoles) {
        return async (req, res, next) => {
            try {
                const { survey_id } = req.params;
                const user = req.user;

                const token =
                    req.query.access_token || req.headers["x-access-token"];

                const survey = await models.Survey.findByPk(survey_id, {
                    include: [
                        {
                            model: models.SurveyAccess,
                            as: "survey_access",
                            attributes: ["access_token"]
                        }
                    ]
                });

                if (!survey) {
                    throw new AppError("Survey not found", 404);
                }

                // Check owner or admin
                const isOwner = user && survey.created_by === user.id;
                const isAdmin = user && user.role?.toLowerCase() === "admin";
                console.log('[DEBUG checkSurveyAccess] user.role:', user?.role, '| isOwner:', isOwner, '| isAdmin:', isAdmin, '| survey.created_by:', survey.created_by); // TODO: remove

                if (isOwner || isAdmin) {
                    req.survey = survey;
                    return next();
                }

                // PUBLIC
                if (survey.access_type === "PUBLIC") {
                    req.survey = survey;
                    return next();
                }

                // LINK
                if (survey.access_type === "LINK") {
                    if (!token) {
                        throw new AppError("Access token required", 403);
                    }

                    const valid =
                        survey.survey_access?.access_token === token;

                    if (!valid) {
                        throw new AppError("Invalid access token", 403);
                    }

                    req.survey = survey;
                    return next();
                }

                // PRIVATE
                if (survey.access_type === "PRIVATE") {
                    if (!user) {
                        throw new AppError("Unauthorized", 401);
                    }

                    const participant = await models.SurveyParticipant.findOne({
                        where: {
                            survey_id,
                            user_id: user.id
                        }
                    });

                    if (!participant) {
                        throw new AppError("Access denied", 403);
                    }

                    // nếu có truyền role → check role
                    if (allowedRoles.length > 0) {
                        const role = participant.role?.toLowerCase();

                        const normalizedRoles = allowedRoles.map(r => r.toLowerCase());

                        if (!normalizedRoles.includes(role)) {
                            throw new AppError(
                                "Insufficient permission in this survey",
                                403
                            );
                        }
                    }

                    req.participant = participant;
                    req.survey = survey;
                    return next();
                }

                throw new AppError("Invalid access type", 400);

            } catch (err) {
                next(err);
            }
        };
    };

    async checkSurveyOwnerOrAdmin(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;

            if (!user) {
                throw new AppError("Unauthorized", 401);
            }

            const survey = await models.Survey.findByPk(survey_id);

            if (!survey) {
                throw new AppError("Survey not found", 404);
            }

            if (!_checkOwnerOrAdmin(user, survey)) {
                throw new AppError("Forbidden", 403);
            }

            req.survey = survey;

            next();
        } catch (err) {
            next(err);
        }
    };
}

export default new authMiddleware;