import Shipment from "../models/shipment.model.js";
import User from "../models/user.model.js";
import City from "../models/city.model.js";
import Hub from "../models/hub.model.js";
import PricingRule from "../models/pricingRule.model.js";
import Payment from "../models/payment.model.js";
import mongoose from "mongoose";
import { paynow } from "../payment/payment.js";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper: calculate price
async function calculatePrice(originCity, destinationCity, weight) {
  const rule = await PricingRule.findOne({ originCity, destinationCity });
  if (!rule) throw new Error("No pricing rule found for this route");
  return rule.basePrice + weight * rule.pricePerKg;
}

// Helper: add log entry
async function addShipmentLog(
  shipmentId,
  action,
  status,
  description,
  userId,
  userRole,
  metadata = {}
) {
  const logEntry = {
    action,
    status,
    description,
    userId,
    userRole,
    metadata,
  };

  await Shipment.findByIdAndUpdate(shipmentId, { $push: { logs: logEntry } });
}

// Helper: upsert payment row
async function upsertPayment({
  shipmentId,
  customerId,
  amount,
  method,
  status,
  paymentResult,
}) {
  return await Payment.findOneAndUpdate(
    { shipment: shipmentId },
    {
      shipment: shipmentId,
      customer: customerId,
      amount,
      method,
      status,
      paymentResult,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Helper: generate QR code if not exists
async function ensureQrCode(shipment) {
  if (!shipment) return;
  const qrFileName = `${shipment._id}.png`;
  const qrDir = path.resolve(__dirname, "../uploads");
  const qrPath = path.join(qrDir, qrFileName);
  if (!shipment.qrCodeId || !shipment.qrCodeImage || !fs.existsSync(qrPath)) {
    shipment.qrCodeId = `QR-${shipment._id}`;
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    await QRCode.toFile(qrPath, shipment.qrCodeId);
    shipment.qrCodeImage = `uploads/${qrFileName}`;
    await shipment.save();
  }
}

// Courier updates weight (and triggers price)
export const setWeightAndPrice = async (req, res, next) => {
  try {
    const { shipmentId, weight } = req.body;
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });

    const oldWeight = shipment.weight;
    const oldPrice = shipment.price;

    shipment.weight = weight;
    shipment.price = await calculatePrice(
      shipment.originCity,
      shipment.destinationCity,
      weight
    );
    await shipment.save();

    // Add log entries
    await addShipmentLog(
      shipmentId,
      "Weight Updated",
      shipment.status,
      `Weight updated from ${oldWeight || "not set"} to ${weight}kg`,
      req.user.user_id,
      req.user.role,
      { oldWeight, newWeight: weight }
    );

    await addShipmentLog(
      shipmentId,
      "Price Calculated",
      shipment.status,
      `Price calculated: ${oldPrice || "not set"} to ${shipment.price}`,
      req.user.user_id,
      req.user.role,
      { oldPrice, newPrice: shipment.price }
    );

    // Payment is NOT triggered here anymore

    res.json({ success: true, data: { shipment } });
  } catch (error) {
    next(error);
  }
};

// Create shipment (customer or admin)
export const createShipment = async (req, res, next) => {
  try {
    const {
      sender,
      receiver,
      originCity,
      destinationCity,
      originHub,
      destinationHub,
      weight,
    } = req.body;
    // sender: user id (admin) or from req.user (customer)
    let senderId = sender;
    if (req.user.role === "customer") senderId = req.user.user_id;
    if (!senderId || !receiver || !originCity || !destinationCity) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    // Prevent sender and receiver from being the same user
    if (receiver.userId && senderId.toString() === receiver.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Sender and receiver cannot be the same user",
      });
    }
    console.log(senderId);
    // receiver: {userId} or {name, phone, address}
    let receiverData = {};
    if (receiver.userId) {
      const user = await User.findById(receiver.userId);
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Receiver not found" });
      receiverData = {
        userId: user._id,
        name: user.name,
        phone: user.phone,
        address: user.address,
      };
    } else {
      if (!receiver.name || !receiver.phone || !receiver.address) {
        return res
          .status(400)
          .json({ success: false, message: "Receiver info required" });
      }
      receiverData = receiver;
    }

    // Calculate price if weight is provided (admin can set weight)
    let price = null;
    if (weight) {
      price = await calculatePrice(originCity, destinationCity, weight);
    }

    // Create shipment
    const shipment = await Shipment.create({
      sender: senderId,
      receiver: receiverData,
      originCity,
      destinationCity,
      originHub,
      destinationHub,
      weight: weight || null,
      price: price || null,
      status: "Pending Pickup",
      logs: [
        {
          action: "Created",
          status: "Pending Pickup",
          description: `Shipment created by ${req.user.role}`,
          userId: req.user.user_id,
          userRole: req.user.role,
          metadata: {
            weight: weight || null,
            price: price || null,
            receiver: receiverData,
          },
        },
      ],
    });
    // If admin and price is set, trigger payment only if not already paid
    let payment = null;
    if (req.user.role === "admin" && shipment.price) {
      // Check if already paid
      const existingPayment = await Payment.findOne({
        shipment: shipment._id,
        status: "completed",
      });
      if (!existingPayment) {
        let paymentResult = null;
        let status = "failed";
        try {
          const customer = await User.findById(shipment.sender);
          if (customer) {
            paymentResult = await paynow(
              customer.phone,
              shipment.price,
              shipment._id
            );
            status = paymentResult.success ? "completed" : "failed";
          }
        } catch (err) {
          paymentResult = { error: err.message };
          status = "failed";
        }

        payment = await upsertPayment({
          shipmentId: shipment._id,
          customerId: shipment.sender,
          amount: shipment.price,
          method: "Waafi",
          status,
          paymentResult,
        });

        // Update shipment paymentStatus if payment succeeded
        if (status === "completed") {
          shipment.paymentStatus = "paid";
          await ensureQrCode(shipment);
          await shipment.save();
        }

        await addShipmentLog(
          shipment._id,
          "Payment",
          status === "completed" ? "Paid" : "Unpaid",
          `Payment attempted via Waafi: ${
            status === "completed" ? "Success" : "Failed"
          }`,
          req.user.user_id,
          req.user.role,
          { paymentResult, paymentId: payment._id }
        );
      }
    }
    res.status(201).json({ success: true, data: shipment, payment });
  } catch (error) {
    next(error);
  }
};

// Assign courier (admin only)
export const assignCourier = async (req, res, next) => {
  try {
    const { shipmentId, courierId, type } = req.body; // type: 'A' or 'B'
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    if (type === "A") shipment.courierA = courierId;
    else if (type === "B") shipment.courierB = courierId;
    else
      return res
        .status(400)
        .json({ success: false, message: "Type must be 'A' or 'B'" });

    await shipment.save();

    // Add log entry
    await addShipmentLog(
      shipmentId,
      "Courier Assigned",
      shipment.status,
      `Courier ${type} assigned to shipment`,
      req.user.user_id,
      req.user.role,
      { courierId, courierType: type }
    );

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// Update assigned courier (admin only)
export const updateCourier = async (req, res, next) => {
  try {
    const { shipmentId, courierId, type } = req.body; // type: 'A' or 'B'
    const shipment = await Shipment.findById(shipmentId).populate(
      "originCity destinationCity"
    );
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });

    // Check if same city
    const isSameCity =
      shipment.originCity._id.toString() ===
      shipment.destinationCity._id.toString();

    if (type === "A") {
      shipment.courierA = courierId;
    } else if (type === "B") {
      if (isSameCity) {
        return res.status(400).json({
          success: false,
          message: "No Courier B needed for same city shipments",
        });
      }
      if (shipment.status !== "At Destination Hub") {
        return res.status(400).json({
          success: false,
          message:
            "Courier B can only be assigned when shipment is at Destination Hub",
        });
      }
      shipment.courierB = courierId;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Type must be 'A' or 'B'" });
    }

    await shipment.save();

    // Add log entry
    await addShipmentLog(
      shipmentId,
      "Courier Assigned",
      shipment.status,
      `Courier ${type} updated for shipment`,
      req.user.user_id,
      req.user.role,
      { courierId, courierType: type }
    );

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// Courier scans QR code from customer phone to pick up shipment
export const scanQrAndPickup = async (req, res, next) => {
  try {
    const { qrCodeId } = req.body;
    console.log("QR Code ID:", qrCodeId);
    const shipment = await Shipment.findOne({ qrCodeId });
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    if (shipment.status !== "Pending Pickup") {
      return res.status(400).json({
        success: false,
        message: "Shipment already picked up or not ready for pickup",
      });
    }

    const oldStatus = shipment.status;
    shipment.status = "Picked Up";
    await shipment.save();

    // Add log entry
    await addShipmentLog(
      shipment._id,
      "Status Updated",
      "Picked Up",
      `Shipment picked up by courier via QR scan`,
      req.user.user_id,
      req.user.role,
      { qrCodeId, oldStatus, newStatus: "Picked Up" }
    );

    res.json({
      success: true,
      data: shipment,
      message: "Shipment picked up successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update payment status and generate QR code (save in root uploads/qrcodes)
export const markPaymentPaidAndGenerateQR = async (req, res, next) => {
  try {
    const { shipmentId } = req.body;
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });

    // Check if already paid
    const existingPayment = await Payment.findOne({
      shipment: shipment._id,
      status: "completed",
    });
    if (existingPayment && shipment.paymentStatus === "paid") {
      // Ensure QR code exists
      await ensureQrCode(shipment);
      return res.json({
        success: true,
        data: shipment,
        message: "Payment already completed",
      });
    }

    // Only allow payment if not picked up
    if (shipment.status !== "Pending Pickup") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot process payment for shipment that is already picked up",
      });
    }

    const customer = await User.findById(shipment.sender);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    // Call paynow before marking as paid
    let paymentResult = null;
    let status = "failed";
    try {
      paymentResult = await paynow(
        customer.phone,
        shipment.price,
        shipment._id
      );
      status = paymentResult.success ? "completed" : "failed";
    } catch (err) {
      paymentResult = { error: err.message };
      status = "failed";
    }

    const payment = await upsertPayment({
      shipmentId: shipment._id,
      customerId: shipment.sender,
      amount: shipment.price,
      method: "Waafi",
      status,
      paymentResult,
    });

    if (status === "completed") {
      shipment.paymentStatus = "paid";
      await ensureQrCode(shipment);
      await shipment.save();
    }

    await addShipmentLog(
      shipment._id,
      "Payment",
      status === "completed" ? "Paid" : "Unpaid",
      `Payment attempted via Waafi: ${
        status === "completed" ? "Success" : "Failed"
      }`,
      req.user.user_id,
      req.user.role,
      { paymentResult, paymentId: payment._id }
    );

    res.json({ success: true, data: shipment, payment });
  } catch (error) {
    next(error);
  }
};

// Update shipment status (courier)
export const updateStatus = async (req, res, next) => {
  try {
    const { shipmentId, status, description, hubId } = req.body;
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });

    const oldStatus = shipment.status;
    shipment.status = status;
    if (status === "At Origin Hub" && hubId) {
      shipment.originHub = hubId;
    }
    await shipment.save();

    // Add log entry
    let logDesc =
      description || `Status updated from ${oldStatus} to ${status}`;
    let logMeta = { oldStatus, newStatus: status };
    if (status === "At Origin Hub" && hubId) {
      const hub = await Hub.findById(hubId);
      if (hub) {
        logDesc += ` at hub: ${hub.name}`;
        logMeta.hub = { _id: hub._id, name: hub.name };
      }
    }
    await addShipmentLog(
      shipmentId,
      "Status Updated",
      status,
      logDesc,
      req.user.user_id,
      req.user.role,
      logMeta
    );

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// Update shipment (admin only)
export const updateShipment = async (req, res, next) => {
  try {
    const shipmentId = req.params.id;
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    }
    const {
      sender,
      receiver,
      originCity,
      destinationCity,
      originHub,
      destinationHub,
      weight,
    } = req.body;
    const changes = {};
    if (sender) {
      shipment.sender = sender;
      changes.sender = "Updated sender";
    }
    if (receiver) {
      if (receiver.userId) {
        const user = await User.findById(receiver.userId);
        if (!user) {
          return res
            .status(400)
            .json({ success: false, message: "Receiver not found" });
        }
        shipment.receiver = {
          userId: user._id,
          name: user.name,
          phone: user.phone,
          address: user.address,
        };
        changes.receiver = "Updated receiver to registered user";
      } else {
        if (!receiver.name || !receiver.phone || !receiver.address) {
          return res
            .status(400)
            .json({ success: false, message: "Receiver info required" });
        }
        shipment.receiver = receiver;
        changes.receiver = "Updated receiver information";
      }
    }
    if (originCity) {
      shipment.originCity = originCity;
      changes.originCity = "Updated origin city";
    }
    if (destinationCity) {
      shipment.destinationCity = destinationCity;
      changes.destinationCity = "Updated destination city";
    }
    if (originHub !== undefined) {
      shipment.originHub = originHub;
      changes.originHub = "Updated origin hub";
    }
    if (destinationHub !== undefined) {
      shipment.destinationHub = destinationHub;
      changes.destinationHub = "Updated destination hub";
    }
    if (weight !== undefined) {
      shipment.weight = weight;
      changes.weight = "Updated weight";
    }
    // Recalculate price if weight or cities changed
    if (weight || originCity || destinationCity) {
      const oldWeight = shipment.weight;
      const oldPrice = shipment.price;
      const newWeight = weight || shipment.weight;
      const newOriginCity = originCity || shipment.originCity;
      const newDestinationCity = destinationCity || shipment.destinationCity;
      if (newWeight && newOriginCity && newDestinationCity) {
        shipment.weight = newWeight;
        shipment.price = await calculatePrice(
          newOriginCity,
          newDestinationCity,
          newWeight
        );
        if (weight && weight !== oldWeight) {
          changes.weight = `Updated weight from ${
            oldWeight || "not set"
          } to ${weight}kg`;
        }
        if (shipment.price !== oldPrice) {
          changes.price = `Recalculated price from ${
            oldPrice || "not set"
          } to ${shipment.price}`;
        }
      }
    }
    await shipment.save();
    // If admin and price is set and not already paid, trigger payment
    let payment = null;
    if (req.user.role === "admin" && shipment.price) {
      // Check if already paid
      const existingPayment = await Payment.findOne({
        shipment: shipment._id,
        status: "completed",
      });
      if (!existingPayment) {
        let paymentResult = null;
        let status = "failed";
        try {
          const customer = await User.findById(shipment.sender);
          if (customer) {
            paymentResult = await paynow(
              customer.phone,
              shipment.price,
              shipment._id
            );
            status = paymentResult.success ? "completed" : "failed";
          }
        } catch (err) {
          paymentResult = { error: err.message };
          status = "failed";
        }
        payment = await upsertPayment({
          shipmentId: shipment._id,
          customerId: shipment.sender,
          amount: shipment.price,
          method: "Waafi",
          status,
          paymentResult,
        });
        if (status === "completed") {
          shipment.paymentStatus = "paid";
          await ensureQrCode(shipment);
          await shipment.save();
        }
        await addShipmentLog(
          shipment._id,
          "Payment",
          status === "completed" ? "Paid" : "Unpaid",
          `Payment attempted via Waafi: ${
            status === "completed" ? "Success" : "Failed"
          }`,
          req.user.user_id,
          req.user.role,
          { paymentResult, paymentId: payment._id }
        );
      }
    }
    // Add log entry for all changes
    if (Object.keys(changes).length > 0) {
      await addShipmentLog(
        shipmentId,
        "Status Updated",
        shipment.status,
        `Shipment updated by admin: ${Object.values(changes).join(", ")}`,
        req.user.user_id,
        req.user.role,
        { changes }
      );
    }
    res.json({ success: true, data: shipment, payment });
  } catch (error) {
    next(error);
  }
};

// Fetch shipments for customer (sent and received)
export const getCustomerShipments = async (req, res, next) => {
  try {
    const sent = await Shipment.find({ sender: req.user.user_id })
      .populate(
        "originCity destinationCity originHub destinationHub courierA courierB receiver"
      )
      .lean();
    const received = await Shipment.find({
      "receiver.userId": req.user.user_id,
    })
      .populate(
        "originCity destinationCity originHub destinationHub courierA courierB sender"
      )
      .lean();
    res.json({ success: true, sent, received });
  } catch (error) {
    next(error);
  }
};

// Fetch shipments for courier (courierA and courierB)
export const getCourierShipments = async (req, res, next) => {
  try {
    const asCourierA = await Shipment.find({ courierA: req.user.user_id })
      .populate(
        "originCity destinationCity originHub destinationHub sender receiver"
      )
      .lean();
    const asCourierB = await Shipment.find({ courierB: req.user.user_id })
      .populate(
        "originCity destinationCity originHub destinationHub sender receiver"
      )
      .lean();
    res.json({ success: true, asCourierA, asCourierB });
  } catch (error) {
    next(error);
  }
};

// Get all shipments (admin)
export const getAllShipments = async (req, res, next) => {
  try {
    const shipments = await Shipment.find()
      .populate(
        "originCity destinationCity originHub destinationHub sender receiver courierA courierB"
      )
      .sort({ createdAt: -1 })
      .lean();
    for (const s of shipments) {
      s.payment = await Payment.findOne({ shipment: s._id });
    }
    res.json({ success: true, data: shipments });
  } catch (error) {
    next(error);
  }
};

// Get shipment logs (admin, courier, customer)
export const getShipmentLogs = async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const shipment = await Shipment.findById(shipmentId)
      .populate("logs.userId", "name phone")
      .select("logs sender courierA courierB");

    if (!shipment) {
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    }

    // Check if user has access to this shipment
    const userHasAccess =
      req.user.role === "admin" ||
      shipment.sender.toString() === req.user.user_id ||
      shipment.courierA?.toString() === req.user.user_id ||
      shipment.courierB?.toString() === req.user.user_id;

    if (!userHasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Sort logs by createdAt descending
    const sortedLogs = [...(shipment.logs || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, data: sortedLogs });
  } catch (error) {
    next(error);
  }
};

// Delete shipment (admin only)
export const deleteShipment = async (req, res, next) => {
  try {
    const shipmentId = req.params.shipmentId;
    const shipment = await Shipment.findByIdAndDelete(shipmentId);
    if (!shipment)
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    await Payment.deleteMany({ shipment: shipmentId });
    res.json({ success: true, message: "Shipment deleted" });
  } catch (error) {
    next(error);
  }
};

export const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate(
        "originCity destinationCity originHub destinationHub sender receiver courierA courierB"
      )
      .lean();
    if (!shipment) {
      return res
        .status(404)
        .json({ success: false, message: "Shipment not found" });
    }
    // Check access: admin, sender, receiver, courierA, courierB
    const userId = req.user.user_id;
    const isAdmin = req.user.role === "admin";
    const isSender = shipment.sender?._id?.toString() === userId;
    const isReceiver = shipment.receiver?.userId?.toString() === userId;
    const isCourierA = shipment.courierA?._id?.toString() === userId;
    const isCourierB = shipment.courierB?._id?.toString() === userId;
    if (!isAdmin && !isSender && !isReceiver && !isCourierA && !isCourierB) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    // Optionally attach payment info
    shipment.payment = await Payment.findOne({ shipment: shipment._id });

    // --- Ensure QR code if paid but missing ---
    if (
      shipment.paymentStatus === "paid" &&
      (!shipment.qrCodeImage || shipment.qrCodeImage === "")
    ) {
      // Fetch the actual shipment doc to update
      const shipmentDoc = await Shipment.findById(shipment._id);
      if (shipmentDoc) {
        await ensureQrCode(shipmentDoc);
        shipment.qrCodeImage = shipmentDoc.qrCodeImage;
      }
    }
    // ---

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};
