import express from "express";
import {
  getAllPayments,
  getPaymentById,
} from "../controllers/paymentController.js";

const router = express.Router();

// Get all payments
router.get("/", getAllPayments);

// Get payment by ID
router.get("/:id", getPaymentById);

export default router;
