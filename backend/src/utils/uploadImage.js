import cloudinary from "../configs/cloudinary.config.js";
import streamifier from "streamifier";

export const uploadBufferToCloudinary = (buffer, folder = "avatar_images") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};