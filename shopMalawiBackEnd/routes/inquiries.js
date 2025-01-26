import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getInquiries,
  addInquiry,
  associateInquiryToProduct,
  getProductsByInquiryAndUser,
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

// Fetch all Products Associated with an Inquiry and User
router.get("/getProductsByInquiryAndUser", getProductsByInquiryAndUser);

// Associate inquiry to products
router.post(
  "/associateInquiryToProduct",
  authenticateUser,
  associateInquiryToProduct
);

export default router;
