import express from "express";
import * as pricingRuleController from "../controllers/pricingRuleController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", authenticate, pricingRuleController.getAllPricingRules);
router.get("/:id", authenticate, pricingRuleController.getPricingRuleById);
router.post(
  "/",
  authenticate,
  restrictTo("admin"),
  pricingRuleController.createPricingRule
);
router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  pricingRuleController.updatePricingRule
);
router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  pricingRuleController.deletePricingRule
);

export default router;
