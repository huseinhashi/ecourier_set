import express from "express";
import * as cityController from "../controllers/cityController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", authenticate, cityController.getAllCities);
router.get("/:id", authenticate, cityController.getCityById);
router.post("/", authenticate, restrictTo("admin"), cityController.createCity);
router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  cityController.updateCity
);
router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  cityController.deleteCity
);

export default router;
