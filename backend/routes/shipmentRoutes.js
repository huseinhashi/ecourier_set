import express from "express";
import * as shipmentController from "../controllers/shipmentController.js";
import { authenticate, restrictTo } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Customer creates shipment
router.post(
  "/",
  authenticate,
  restrictTo("customer", "admin"),
  shipmentController.createShipment
);
// Admin updates shipment
router.put(
  "/",
  authenticate,
  restrictTo("admin"),
  shipmentController.updateShipment
);
// Admin assigns courier
router.post(
  "/assign-courier",
  authenticate,
  restrictTo("admin"),
  shipmentController.assignCourier
);
// Courier sets weight and triggers price/payment
router.post(
  "/set-weight",
  authenticate,
  restrictTo("courier"),
  shipmentController.setWeightAndPrice
);
// Mark payment paid and generate QR
router.post(
  "/mark-paid",
  authenticate,
  shipmentController.markPaymentPaidAndGenerateQR
);
// Get shipment details from QR code (for confirmation)
router.post(
  "/qr-details",
  authenticate,
  restrictTo("courier"),
  shipmentController.getShipmentFromQrCode
);
// Courier scans QR code to pick up
router.post(
  "/scan-pickup",
  authenticate,
  restrictTo("courier"),
  shipmentController.scanQrAndPickup
);
// Single update status route for admin and courier
router.post(
  "/update-status",
  authenticate,
  restrictTo("admin", "courier"),
  shipmentController.updateStatus
);
// Customer fetches their shipments
router.get(
  "/customer",
  authenticate,
  restrictTo("customer"),
  shipmentController.getCustomerShipments
);
// Courier fetches assigned shipments
router.get(
  "/courier",
  authenticate,
  restrictTo("courier"),
  shipmentController.getCourierShipments
);
// Admin fetches all shipments
router.get(
  "/",
  authenticate,
  restrictTo("admin"),
  shipmentController.getAllShipments
);
// Fetch a single shipment by ID (admin, sender, receiver, or assigned courier)
router.get("/:id", authenticate, shipmentController.getShipmentById);
// Update a single shipment by ID (admin only)
router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  shipmentController.updateShipment
);
// Get shipment logs (admin, courier, customer)
router.get(
  "/:shipmentId/logs",
  authenticate,
  shipmentController.getShipmentLogs
);
// Admin deletes shipment
router.delete(
  "/:shipmentId",
  authenticate,
  restrictTo("admin"),
  shipmentController.deleteShipment
);
// Admin updates assigned courier
router.post(
  "/update-courier",
  authenticate,
  restrictTo("admin"),
  shipmentController.updateCourier
);

export default router;
