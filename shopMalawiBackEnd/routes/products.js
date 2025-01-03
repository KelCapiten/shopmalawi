import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addProduct,
  getCategories,
  getProductsAddedToday, // Import the new function
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Add Product Route
router.post(
  "/addProducts",
  authenticateUser,
  upload.array("images", 4),
  addProduct
);

// Fetch categories
router.get("/getCategories", getCategories);

// Fetch products added today
router.get("/getProductsAddedToday", getProductsAddedToday);

export default router;
