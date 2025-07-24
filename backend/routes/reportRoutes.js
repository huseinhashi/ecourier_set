import express from "express";
import {
  shipmentsReport,
  usersReport,
  paymentsReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/shipments", shipmentsReport);
router.get("/users", usersReport);
router.get("/payments", paymentsReport);

export default router;
