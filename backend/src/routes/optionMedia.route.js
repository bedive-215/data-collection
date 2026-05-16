import express from "express";
import OptionMediaController from "../controllers/optionMedia.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// Upload option media (image/video)
router.post(
    "/option-media",
    authMiddleware.auth.bind(authMiddleware),
    upload.single("file"),
    OptionMediaController.uploadOptionMedia
);

export default router;
