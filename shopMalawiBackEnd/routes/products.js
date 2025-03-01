//routes/products.js
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  addProduct,
  getAllProducts,
  deactivateProduct,
  activateProduct,
  editProduct,
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/addProduct",
  authenticateUser,
  upload.array("images", 4),
  addProduct
);

router.put(
  "/editProduct/:id",
  authenticateUser,
  upload.array("images", 4),
  editProduct
);

router.put("/deactivateProduct/:id", authenticateUser, deactivateProduct);
router.put("/activateProduct/:id", authenticateUser, activateProduct);
router.get("/getAllProducts", getAllProducts);

export default router;
