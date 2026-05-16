import cloudinary from "../configs/cloudinary.config.js";

/**
 * Upload media file lên Cloudinary, trả về URL.
 * Supported types: image/*, video/*
 */
async function uploadToCloudinary(file, folder = "survey-media") {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto",
                allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi"],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(file.buffer);
    });
}

export default async function uploadMedia(file) {
    if (!file) return null;
    const url = await uploadToCloudinary(file, "survey-media");
    return url;
}
