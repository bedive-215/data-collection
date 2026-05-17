import express from "express";
import aiChatController from "../controllers/aiChat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/chat", authMiddleware.auth.bind(authMiddleware), aiChatController.chat);

export default router;
