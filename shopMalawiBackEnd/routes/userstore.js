// routes/userstore.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addStore,
  getStore,
  updateStore,
} from "../controllers/userstoreController.js";

const router = express.Router();

// Get store details (optionally filtered by id or owner_id)
router.get("/getStore", getStore);

// Add a store
router.post("/addStore", authenticateUser, addStore);

// Update a store
router.put("/updateStore/:id", authenticateUser, updateStore);

export default router;
