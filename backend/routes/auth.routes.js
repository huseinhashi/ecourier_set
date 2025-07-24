import express from "express";
import { login, registerCustomer } from "../controllers/authController.js";

const router = express.Router();

// Public authentication routes
router.post("/register", registerCustomer); // Customer registration
router.post("/login", login); // Login for admin, courier, customer

export default router;
