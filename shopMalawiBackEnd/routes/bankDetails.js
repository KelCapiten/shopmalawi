// routes/bankDetails.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addBankDetails,
  getBankDetails,
  updateBankDetails,
  deleteBankDetails,
} from "../controllers/bankDetailsController.js";

const router = express.Router();

// Get Bank Details (optionally filtered by user_id)
router.get("/getBankDetails", getBankDetails);

// Add Bank Details
router.post("/addBankDetails", authenticateUser, addBankDetails);

// Update Bank Details
router.put("/updateBankDetails/:id", authenticateUser, updateBankDetails);

// Delete Bank Details
router.delete("/deleteBankDetails/:id", authenticateUser, deleteBankDetails);

export default router;
