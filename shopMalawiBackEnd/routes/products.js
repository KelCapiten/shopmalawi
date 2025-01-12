import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addProduct,
  getCategories,
  getAllProducts,
  getProductById, // Import the new controller
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

// Fetch all products with filters
router.get("/getAllProducts", getAllProducts);

// Fetch a single product by ID
router.get("/getProduct/:id", getProductById); // New route

export default router;
