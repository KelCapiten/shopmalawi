//\routes\inquiries.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getInquiries,
  addInquiry,
  updateInquiry,
  deleteInquiry,
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

// Update Inquiry
router.put(
  "/updateInquiry/:id",
  authenticateUser,
  upload.array("images", 4),
  updateInquiry
);

// Delete Inquiry
router.delete("/deleteInquiry/:id", authenticateUser, deleteInquiry);

// Associate inquiry to products
router.post(
  "/associateInquiryToProduct",
  authenticateUser,
  associateInquiryToProduct
);

// Disassociate inquiry from products (changed to DELETE with URL params)
router.delete(
  "/disassociateInquiry/:inquiries_id/:product_id",
  authenticateUser,
  disassociateInquiryFromProduct
);

// Fetch all inquiries
router.get("/getInquiries", getInquiries);

// Fetch all Products Associated with an Inquiry and User
router.get("/getProductsByInquiryAndUser", getProductsByInquiryAndUser);

export default router;
