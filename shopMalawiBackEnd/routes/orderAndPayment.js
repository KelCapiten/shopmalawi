//\routes\orderAndPayment.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { createOrderAndPayment } from "../controllers/orderAndPaymentController.js";
import { upload } from "../middleware/uploadScreenShotsMiddleware.js";

const router = express.Router();

// Create Order and Payment Route
router.post(
  "/createOrderAndPayment",
  authenticateUser,
  upload.single("paymentScreenshot"),
  createOrderAndPayment
);

export default router;
