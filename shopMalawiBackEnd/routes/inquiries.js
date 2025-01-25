import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getInquiries,
  addInquiry,
} from "../controllers/inquiriesController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Add Category
router.post(
  "/addInquiry",
  authenticateUser,
  upload.array("images", 4),
  addInquiry
);

// Fetch all inquiries
router.get("/getInquiries", getInquiries);

export default router;
