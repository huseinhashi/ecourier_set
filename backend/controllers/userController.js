import { User } from "../models/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import Shipment from "../models/shipment.model.js";
import Payment from "../models/payment.model.js";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      type: "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get admins only
export const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

// Get couriers only
export const getCouriers = async (req, res, next) => {
  try {
    const couriers = await User.find({ role: "courier" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: couriers,
    });
  } catch (error) {
    next(error);
  }
};

// Get customers only
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// Public endpoints for dropdowns
export const getPublicCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("name phone address")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicCouriers = async (req, res, next) => {
  try {
    const couriers = await User.find({ role: "courier" })
      .select("name phone")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: couriers,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      { role: "user" },
      { exclude: ["password"] },
      { order: [["createdAt", "DESC"]] }
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID (admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user (admin only)
export const createUser = async (req, res, next) => {
  try {
    const { name, phone, password, role, address } = req.body;
    // Inline validation
    if (!name || typeof name !== "string" || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be at least 2 characters.",
      });
    }
    if (!phone || typeof phone !== "string" || !/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required and must be 10-15 digits.",
      });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password is required and must be at least 8 characters.",
      });
    }
    if (!role || !["admin", "courier", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role is required and must be admin, courier, or customer.",
      });
    }
    if (
      role === "customer" &&
      (!address || typeof address !== "string" || address.length < 10)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Address is required for customers and must be at least 10 characters.",
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    // Create new user
    const newUser = new User({ name, phone, password, role, address });
    await newUser.save();

    // Return user without password
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user (admin only)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const { name, phone, password, role, address } = req.body;
    // Inline validation (partial)
    if (name && (typeof name !== "string" || name.length < 2)) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }
    if (phone && (typeof phone !== "string" || !/^\d{10,15}$/.test(phone))) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10-15 digits.",
      });
    }
    if (password && (typeof password !== "string" || password.length < 8)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }
    if (role && !["admin", "courier", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, courier, or customer.",
      });
    }
    if (
      (role === "customer" || user.role === "customer") &&
      address &&
      (typeof address !== "string" || address.length < 10)
    ) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 10 characters for customers.",
      });
    }

    // If updating phone, check if it's already in use
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    if (role) user.role = role;
    if (address !== undefined) user.address = address;
    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Check for references in shipments (sender or receiver)
    const shipmentRef = await Shipment.findOne({
      $or: [{ sender: user._id }, { "receiver.userId": user._id }],
    });
    if (shipmentRef) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete user: referenced by a shipment.",
        });
    }
    // Check for references in payments (customer)
    const paymentRef = await Payment.findOne({ customer: user._id });
    if (paymentRef) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete user: referenced by a payment.",
        });
    }
    await user.deleteOne();
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.user_id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const { name, phone, password, address } = req.body;
    // Inline validation (partial, exclude role)
    if (name && (typeof name !== "string" || name.length < 2)) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }
    if (phone && (typeof phone !== "string" || !/^\d{10,15}$/.test(phone))) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10-15 digits.",
      });
    }
    if (password && (typeof password !== "string" || password.length < 8)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }
    if (
      user.role === "customer" &&
      address &&
      (typeof address !== "string" || address.length < 10)
    ) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 10 characters for customers.",
      });
    }

    // If updating phone, check if it's already in use
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    if (address !== undefined) user.address = address;
    await user.save();

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
