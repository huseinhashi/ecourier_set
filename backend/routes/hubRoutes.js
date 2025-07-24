import express from "express";
import * as hubController from "../controllers/hubController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", authenticate, hubController.getAllHubs);
router.get("/:id", authenticate, hubController.getHubById);
router.post("/", authenticate, restrictTo("admin"), hubController.createHub);
router.put("/:id", authenticate, restrictTo("admin"), hubController.updateHub);
router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  hubController.deleteHub
);
router.get("/city/:cityId", authenticate, hubController.getHubsByCity);

export default router;
