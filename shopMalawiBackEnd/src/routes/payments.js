import express from "express";
import {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentsCrontroller.js";
const router = express.Router();

// Payment Methods Routes
router.get("/getPaymentMethods", getPaymentMethods);
router.post("/addPaymentMethod", addPaymentMethod);
router.put("/updatePaymentMethod/:id", updatePaymentMethod);
router.delete("/deletePaymentMethod/:id", deletePaymentMethod);

export default router;
