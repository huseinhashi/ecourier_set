import Payment from "../models/payment.model.js";

// Get all payments
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("shipment")
      .populate("customer");
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// Get payment by ID
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("shipment")
      .populate("customer");
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};
