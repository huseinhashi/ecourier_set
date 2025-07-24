import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Public routes (for customer dropdowns, etc.)
router.get("/public/customers", userController.getPublicCustomers);
router.get("/public/couriers", userController.getPublicCouriers);

// Admin-only routes
router.get("/", authenticate, restrictTo("admin"), userController.getAllUsers);
router.get(
  "/admins",
  authenticate,
  restrictTo("admin"),
  userController.getAdmins
);
router.get(
  "/couriers",
  authenticate,
  restrictTo("admin"),
  userController.getCouriers
);
router.get("/customers", authenticate, userController.getCustomers);
router.get(
  "/:id",
  authenticate,
  restrictTo("admin"),
  userController.getUserById
);
router.post("/", authenticate, restrictTo("admin"), userController.createUser);
router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  userController.updateUser
);
router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  userController.deleteUser
);

// User profile routes (authenticated users can manage their own profile)
router.get("/profile/me", authenticate, userController.getCurrentUser);
router.put("/profile/me", authenticate, userController.updateCurrentUser);
router.post("/change-password", authenticate, userController.changePassword);

export default router;
