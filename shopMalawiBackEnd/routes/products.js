import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addProduct,
  addInquiry,
  getCategories,
  getAllProducts,
  getProductById,
  addCategory,
  updateCategory,
  deleteCategory,
  getInquiries, // Import the new endpoint
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

// Add Inquiry Route
router.post(
  "/addInquiry",
  authenticateUser,
  upload.array("images", 4),
  addInquiry
);

// Add Category Route
router.post("/addCategory", authenticateUser, addCategory);

// Update Category Route
router.put("/updateCategory/:id", authenticateUser, updateCategory);

// Delete Category Route
router.delete("/deleteCategory/:id", authenticateUser, deleteCategory);

// Fetch categories
router.get("/getCategories", getCategories);

// Fetch all products with filters
router.get("/getAllProducts", getAllProducts);

// Fetch a single product by ID
router.get("/getProduct/:id", getProductById);

// Fetch all inquiries
router.get("/getInquiries", getInquiries);

export default router;
