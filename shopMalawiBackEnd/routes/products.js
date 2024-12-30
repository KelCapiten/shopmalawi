import express from "express";
import multer from "multer"; // Import multer
import { getProducts, addProduct } from "../controllers/productController.js";

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Get all products
router.get("/", getProducts);

// Add a new product
router.post("/", upload.single("image"), addProduct);

export default router;
