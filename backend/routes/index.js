import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./userRoutes.js";
import cityRoutes from "./cityRoutes.js";
import pricingRuleRoutes from "./pricingRuleRoutes.js";
import hubRoutes from "./hubRoutes.js";
import shipmentRoutes from "./shipmentRoutes.js";
import reportRoutes from "./reportRoutes.js";
import paymentRoutes from "./paymentRoutes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", authRoutes);

// User management routes
router.use("/users", userRoutes);

// Resource routes
router.use("/cities", cityRoutes);
router.use("/pricing-rules", pricingRuleRoutes);
router.use("/hubs", hubRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/reports", reportRoutes);
router.use("/payments", paymentRoutes);

export default router;
