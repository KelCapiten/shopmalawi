import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configurable values from environment variables
const UPLOAD_DIR = process.env.USER_UPLOADS_DIR || "uploads/userUploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // Default: 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];

// Ensure the upload directory exists
const ensureUploadDirExists = (uploadDir) => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Directory ${uploadDir} created successfully.`);
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDirExists(UPLOAD_DIR); // Ensure directory exists
    cb(null, UPLOAD_DIR); // Directory to store files
  },
  filename: (req, file, cb) => {
    // Convert the original filename to lowercase
    const lowercaseName = file.originalname.toLowerCase();
    // Generate a unique filename with the lowercase extension
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(lowercaseName)}`;
    cb(null, uniqueName); // Unique filename
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_FILE_TYPES.join(", ")} are allowed.`
      ),
      false
    ); // Reject the file
  }
};

// Multer instance
export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
