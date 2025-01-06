import express from "express";
import { searchProducts } from "../controllers/searchController.js";

const router = express.Router();

// Search Products Route
router.get("/searchProducts", searchProducts);

export default router;
