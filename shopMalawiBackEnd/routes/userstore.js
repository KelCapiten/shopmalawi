// routes/userstore.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addStore,
  getStore,
  updateStore,
  deleteStore,
  addProductToStore,
  removeProductFromStore,
} from "../controllers/userstoreController.js";
import { upload } from "../middleware/uploadUserStoreImagesMiddleware.js";

const router = express.Router();

// Get store details (optionally filtered by id or owner_id)
router.get("/getStore", getStore);

// Add a store
router.post("/addStore", authenticateUser, addStore);

// Update a store (allow up to 2 images: banner and profile)
router.put(
  "/updateStore/:id",
  authenticateUser,
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "profile", maxCount: 1 },
  ]),
  updateStore
);

// Delete a store
router.delete("/deleteStore/:id", authenticateUser, deleteStore);

// Add a product to a store
router.post("/addProductToStore", authenticateUser, addProductToStore);

// Remove a product from a store
router.post(
  "/removeProductFromStore",
  authenticateUser,
  removeProductFromStore
);

export default router;
