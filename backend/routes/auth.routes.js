import express from "express";
import { login, registerCustomer } from "../controllers/authController.js";
import { updateCurrentUser, changePassword } from "../controllers/userController.js";
import { authenticate } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Public authentication routes
router.post("/register", registerCustomer); // Customer registration
router.post("/login", login); // Login for admin, courier, customer

// Protected profile routes
router.put("/profile", authenticate, updateCurrentUser); // Update current user profile
router.put("/change-password", authenticate, changePassword); // Change password

export default router;
