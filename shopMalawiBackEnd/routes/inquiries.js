import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getInquiries,
  addInquiry,
  associateInquiryToProduct,
  disassociateInquiryFromProduct,
  getProductsByInquiryAndUser,
} from "../controllers/inquiriesController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Add Inquiry
router.post(
  "/addInquiry",
  authenticateUser,
  upload.array("images", 4),
  addInquiry
);

// Associate inquiry to products
router.post(
  "/associateInquiryToProduct",
  authenticateUser,
  associateInquiryToProduct
);

// Disassociate inquiry from products
router.post(
  "/disassociateInquiryFromProduct",
  authenticateUser,
  disassociateInquiryFromProduct
);

// Fetch all inquiries
router.get("/getInquiries", getInquiries);

// Fetch all Products Associated with an Inquiry and User
router.get("/getProductsByInquiryAndUser", getProductsByInquiryAndUser);

export default router;
