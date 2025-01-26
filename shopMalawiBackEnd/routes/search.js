import express from "express";
import {
  searchProducts,
  searchProductsExcludingOffered,
} from "../controllers/searchController.js";

const router = express.Router();

// Search Products Route
router.get("/searchProducts", searchProducts);

// Search Inquiries Products Route
router.get("/searchProductsExcludingOffered", searchProductsExcludingOffered);

export default router;
