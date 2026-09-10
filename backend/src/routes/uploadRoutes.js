import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 0,
  },

  fileFilter(req, file, callback) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG and MP4 files are allowed.")
      );
    }

    callback(null, true);
  },
});

router.post(
  "/",
  authenticate,
  authorizeRoles("CITIZEN"),
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "The file must be smaller than 10 MB."
              : error.message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file.",
      });
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `samadhan-setu/evidence/${req.user.id}`,
            resource_type:
              req.file.mimetype === "video/mp4"
                ? "video"
                : "image",
            allowed_formats: ["jpg", "jpeg", "png", "mp4"],
          },
          (error, uploadedFile) => {
            if (error) {
              reject(error);
            } else {
              resolve(uploadedFile);
            }
          }
        );

        stream.on("error", reject);
        stream.end(req.file.buffer);
      });

      return res.status(201).json({
        success: true,
        message: "Evidence uploaded successfully",
        media: {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", {
        message: error.message,
        name: error.name,
        httpCode: error.http_code,
      });

      return res.status(502).json({
        success: false,
        message: "Evidence upload failed. Please try again.",
      });
    }
  }
);

export default router;