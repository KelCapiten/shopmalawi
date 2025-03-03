//\routes\orderAndPayment.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  createOrderAndPayment,
  recordRefund,
  getBuyOrders,
  getSellOrders,
  updatePaymentStatus,
  updateExpiredPaymentStatuses,
} from "../controllers/orderAndPaymentController.js";
import { upload } from "../middleware/uploadScreenShotsMiddleware.js";

const router = express.Router();

router.post(
  "/createOrderAndPayment",
  authenticateUser,
  upload.single("paymentScreenshot"),
  createOrderAndPayment
);

router.post(
  "/recordRefund",
  authenticateUser,
  upload.single("paymentScreenshot"),
  recordRefund
);

router.put(
  "/updatePaymentStatus/:paymentId",
  authenticateUser,
  updatePaymentStatus
);

router.get("/getBuyOrders", getBuyOrders);
router.get("/getSellOrders", getSellOrders);
router.get("/updateExpiredPaymentStatuses", updateExpiredPaymentStatuses);

export default router;
