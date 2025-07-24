import Shipment from "../models/shipment.model.js";
import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";

function getDateRange(filter, from, to) {
  const now = new Date();
  let start, end;
  if (filter === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (filter === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (filter === "custom" && from && to) {
    start = new Date(from);
    end = new Date(to);
    end.setDate(end.getDate() + 1); // include end date
  } else {
    start = new Date(0);
    end = new Date();
  }
  return { start, end };
}

export async function shipmentsReport(req, res) {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);
    const shipments = await Shipment.find({
      createdAt: { $gte: start, $lt: end },
    })
      .populate({ path: "sender", select: "name phone role" })
      .populate({ path: "originCity", select: "name" })
      .populate({ path: "destinationCity", select: "name" });
    // Format receiver to only include name, phone, address
    const formatted = shipments.map((s) => ({
      _id: s._id,
      sender: s.sender
        ? { name: s.sender.name, phone: s.sender.phone, role: s.sender.role }
        : null,
      receiver: s.receiver
        ? {
            name: s.receiver.name,
            phone: s.receiver.phone,
            address: s.receiver.address,
          }
        : null,
      originCity: s.originCity ? s.originCity.name : null,
      destinationCity: s.destinationCity ? s.destinationCity.name : null,
      weight: s.weight,
      price: s.price,
      status: s.status,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt,
    }));
    res.json({ count: formatted.length, data: formatted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching shipments report", error: err.message });
  }
}

export async function usersReport(req, res) {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);
    const users = await User.find({ createdAt: { $gte: start, $lt: end } });
    // Only return relevant fields
    const formatted = users.map((u) => ({
      _id: u._id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json({ count: formatted.length, data: formatted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users report", error: err.message });
  }
}

export async function paymentsReport(req, res) {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);
    const payments = await Payment.find({
      createdAt: { $gte: start, $lt: end },
    }).populate({ path: "customer", select: "name phone role" });
    const formatted = payments.map((p) => ({
      _id: p._id,
      user: p.customer
        ? {
            name: p.customer.name,
            phone: p.customer.phone,
            role: p.customer.role,
          }
        : null,
      amount: p.amount,
      status: p.status,
      method: p.method,
      createdAt: p.createdAt,
    }));
    res.json({ count: formatted.length, data: formatted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching payments report", error: err.message });
  }
}
