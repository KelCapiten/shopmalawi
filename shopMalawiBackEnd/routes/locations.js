import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { getLocations } from "../controllers/locationsController.js";

const router = express.Router();

// Fetch all locations
router.get("/getLocations", getLocations);

export default router;
