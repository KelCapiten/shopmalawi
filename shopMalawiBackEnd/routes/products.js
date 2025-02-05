//\routes\products.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addProduct,
  getAllProducts,
  getProductById,
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Add Product Route
router.post(
  "/addProduct",
  authenticateUser,
  upload.array("images", 4),
  addProduct
);

// Fetch all products with filters
router.get("/getAllProducts", getAllProducts);

// Fetch a single product by ID
router.get("/getProduct/:id", getProductById);

export default router;
