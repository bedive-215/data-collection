import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import models from "../models/index.js";
import notificationService from "../services/notification.service.js";

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://frontend:5173"
            ],
            credentials: true,
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    const userSockets = new Map();

    const getUserSocketIds = (userId) => {
        return userSockets.get(userId) || new Set();
    };

    const emitToUser = (userId, event, data) => {
        const socketIds = getUserSocketIds(userId);
        socketIds.forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    };

    const emitToSurveyAdmins = (surveyId, event, data) => {
        io.to(`survey-admin:${surveyId}`).emit(event, data);
    };

    global.io = io;
    global.emitToUser = emitToUser;
    global.emitToSurveyAdmins = emitToSurveyAdmins;

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error("Authentication error: Token required"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const user = await models.User.findByPk(decoded.user_id);

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.userId = decoded.user_id;
            socket.userEmail = decoded.email;
            socket.userRole = user.role;
            socket.userName = user.full_name;

            next();
        } catch (err) {
            console.error("Socket auth error:", err.message);
            if (err.name === "TokenExpiredError") {
                return next(new Error("Token expired"));
            }
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;
        const userName = socket.userName;

        console.log(`[Socket] User connected: ${userName} (${userId})`);

        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        socket.join(`user:${userId}`);

        if (socket.userRole === "admin") {
            socket.join("admin");
            console.log(`[Socket] Admin ${userName} joined admin room`);
        }

        socket.on("join:survey", (surveyId) => {
            socket.join(`survey:${surveyId}`);
            console.log(`[Socket] User ${userId} joined survey:${surveyId}`);
        });

        socket.on("leave:survey", (surveyId) => {
            socket.leave(`survey:${surveyId}`);
            console.log(`[Socket] User ${userId} left survey:${surveyId}`);
        });

        socket.on("typing:start", ({ surveyId, questionId }) => {
            socket.to(`survey:${surveyId}`).emit("user:typing", {
                userId,
                userName,
                surveyId,
                questionId
            });
        });

        socket.on("typing:stop", ({ surveyId }) => {
            socket.to(`survey:${surveyId}`).emit("user:stop-typing", {
                userId,
                surveyId
            });
        });

        socket.on("ping", () => {
            socket.emit("pong", { timestamp: Date.now() });
        });

        // Real-time: when a survey response is submitted, notify admins watching this survey
        socket.on("admin:watch-survey", (surveyId) => {
            socket.join(`survey-admin:${surveyId}`);
            console.log(`[Socket] Admin watching survey:${surveyId}`);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[Socket] User disconnected: ${userName} (${userId}) - ${reason}`);

            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            }
        });

        socket.on("error", (err) => {
            console.error(`[Socket] Error for user ${userId}:`, err.message);
        });
    });

    const checkExpiredSurveys = async () => {
        try {
            const now = new Date();
            console.log(`[Socket] Checking expired surveys at ${now.toISOString()}`);

            const expiredSurveys = await models.Survey.findAll({
                where: {
                    end_at: {
                        [Op.lte]: now
                    },
                    notified_expired: false
                },
                include: [
                    {
                        model: models.User,
                        as: "creator",
                        attributes: ["id", "email", "full_name"]
                    }
                ]
            });

            console.log(`[Socket] Found ${expiredSurveys.length} expired surveys`);

            for (const survey of expiredSurveys) {
                console.log(`[Socket] Processing expired survey: ${survey.id} - ${survey.title}`);

                // Count responses
                let responseCount = 0;
                try {
                    if (models.Response) {
                        responseCount = await models.Response.count({
                            where: { survey_id: survey.id }
                        });
                    }
                } catch (countErr) {
                    console.error(`[Socket] Error counting responses for survey ${survey.id}:`, countErr.message);
                }

                // Prepare survey data for notification
                const surveyData = {
                    id: survey.id,
                    title: survey.title,
                    end_at: survey.end_at,
                    description: survey.description,
                    created_by: survey.created_by,
                    creator: survey.creator
                };

                console.log(`[Socket] Calling notifySurveyExpired for user ${survey.created_by}`);
                await notificationService.notifySurveyExpired({ survey: surveyData });

                await survey.update({ notified_expired: true });
                console.log(`[Socket] Marked survey ${survey.id} as notified`);
            }
        } catch (err) {
            console.error("[Socket] Error checking expired surveys:", err);
        }
    };

    setInterval(checkExpiredSurveys, 30 * 60 * 1000);

    // Check immediately on startup
    checkExpiredSurveys();

    console.log("[Socket.io] Server initialized");
    return io;
};

export default setupSocket;
