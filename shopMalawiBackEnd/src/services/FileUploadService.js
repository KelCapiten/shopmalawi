import path from "path";
import fs from "fs/promises";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  audio: ["audio/mpeg", "audio/wav"],
  video: ["video/mp4", "video/quicktime"],
};

export const validateFile = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Check file type
  const fileType = Object.keys(ALLOWED_TYPES).find((type) =>
    ALLOWED_TYPES[type].includes(file.mimetype)
  );

  if (!fileType) {
    throw new Error(
      `Invalid file type. Allowed types: ${Object.values(ALLOWED_TYPES)
        .flat()
        .join(", ")}`
    );
  }

  return fileType;
};

export const uploadFile = async (file, connection, messageId) => {
  // Validate file before upload
  const fileType = validateFile(file);

  // Create directory if it doesn't exist
  const fileDir = path.join(
    process.env.UPLOAD_DIR,
    "messages",
    messageId.toString()
  );
  await fs.mkdir(fileDir, { recursive: true });

  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(fileDir, filename);

  await fs.writeFile(filepath, file.buffer);

  await connection.query(
    `INSERT INTO message_attachments 
     (message_id, file_type, file_path, file_name, file_size, mime_type) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, fileType, filepath, filename, file.size, file.mimetype]
  );

  return filepath;
};
