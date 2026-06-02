import express from "express";
import MediaController from "#controllers/media.controller.js";
import authMiddleware from "#middlewares/auth.middleware.js";
import upload from "#middlewares/multer.middleware.js";

const router = express.Router();

// Upload question media (image/video)
router.post(
    "/question-media",
    authMiddleware.auth.bind(authMiddleware),
    upload.single("file"),
    MediaController.uploadQuestionMedia
);

export default router;
