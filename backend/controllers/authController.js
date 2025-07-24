import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import User from "../models/user.model.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user._id,
      role: user.role,
      type: "user",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register customer (public)
export const registerCustomer = async (req, res, next) => {
  try {
    const { phone, password, name, address } = req.body;
    if (!phone || !password || !name || !address) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const exists = await User.findOne({ phone });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Phone already registered" });
    }
    const user = await User.create({
      phone,
      password,
      name,
      address,
      role: "customer",
    });
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          address: user.address,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login (admin, courier, customer)
export const login = async (req, res, next) => {
  try {
    const { phone, password, role } = req.body;
    if (!phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Phone, password, and role are required",
      });
    }
    const user = await User.findOne({ phone, role });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          address: user.address,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
