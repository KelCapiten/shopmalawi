import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";

const router = express.Router();

// Fetch categories
router.get("/getCategories", getCategories);

// Add Category
router.post("/addCategory", authenticateUser, addCategory);

// Update Category
router.put("/updateCategory/:id", authenticateUser, updateCategory);

// Delete Category
router.delete("/deleteCategory/:id", authenticateUser, deleteCategory);

export default router;
