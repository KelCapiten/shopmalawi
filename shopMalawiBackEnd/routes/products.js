import express from "express";
import multer from "multer";
import {
  addProduct,
  getNewlyAddedProducts,
} from "../controllers/productController.js";

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Add a new product
router.post("/", upload.array("images", 4), addProduct);

// Get newly added products (added today)
router.get("/newly-added", getNewlyAddedProducts);

export default router;
