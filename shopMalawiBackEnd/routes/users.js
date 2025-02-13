// routes/users.js
import express from "express";
import {
  registerUser,
  loginUser,
  getUserInfo,
  updateUserInfo,
  getUsers,
} from "../controllers/usersController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

// Login an existing user
router.post("/login", loginUser);

// Get user info (optional authentication)
router.get("/getUserInfo", getUserInfo);

// Update user info (requires authentication)
router.put("/updateUserInfo", authenticateUser, updateUserInfo);

// Get all users (optional authentication)
router.get("/getUsers", getUsers);

export default router;
