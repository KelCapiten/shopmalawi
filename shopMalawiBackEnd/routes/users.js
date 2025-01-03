import express from "express";
import { registerUser, loginUser } from "../controllers/usersController.js"; // Import loginUser

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

// Login an existing user
router.post("/login", loginUser);

export default router;
