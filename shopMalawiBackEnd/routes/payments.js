import express from "express";
import { getPaymentMethods } from "../controllers/paymentsCrontroller.js";
const router = express.Router();

// Get Payment Methods Route
router.get("/payment-methods", getPaymentMethods);

export default router;
