import { AppError } from "../middlewares/handleException.middlware.js";
import uploadMedia from "../utils/uploadMedia.js";

class OptionMediaController {
    async uploadOptionMedia(req, res, next) {
        try {
            if (!req.file) {
                throw new AppError("No file provided", 400);
            }

            const file = req.file;
            const allowedMime = [
                "image/jpeg", "image/png", "image/gif", "image/webp",
                "video/mp4", "video/quicktime", "video/webm",
            ];

            if (!allowedMime.includes(file.mimetype)) {
                throw new AppError("Unsupported file type. Allowed: jpg, png, gif, webp, mp4, mov, webm", 400);
            }

            const maxSize = file.mimetype.startsWith("video/") ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new AppError(
                    `File too large. Max size: ${file.mimetype.startsWith("video/") ? "100MB" : "10MB"}`,
                    400
                );
            }

            const url = await uploadMedia(file);
            const media_type = file.mimetype.startsWith("video/") ? "video" : "image";

            return res.status(200).json({
                message: "Upload successful",
                data: { url, media_type },
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new OptionMediaController();
