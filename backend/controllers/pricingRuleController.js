import PricingRule from "../models/pricingRule.model.js";
import City from "../models/city.model.js";

export const getAllPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.find().populate(
      "originCity destinationCity"
    );
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const getPricingRuleById = async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule)
      return res
        .status(404)
        .json({ success: false, message: "Pricing rule not found" });
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const createPricingRule = async (req, res, next) => {
  try {
    const { originCity, destinationCity, basePrice, pricePerKg } = req.body;
    if (
      !originCity ||
      !destinationCity ||
      basePrice == null ||
      pricePerKg == null
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const origin = await City.findById(originCity);
    const dest = await City.findById(destinationCity);
    if (!origin || !dest) {
      return res.status(400).json({
        success: false,
        message: "Origin or destination city does not exist",
      });
    }
    // Prevent duplicate rule
    const existingRule = await PricingRule.findOne({
      originCity,
      destinationCity,
    });
    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: "A pricing rule for this route already exists.",
      });
    }
    const rule = await PricingRule.create({
      originCity,
      destinationCity,
      basePrice,
      pricePerKg,
    });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const updatePricingRule = async (req, res, next) => {
  try {
    const { originCity, destinationCity, basePrice, pricePerKg } = req.body;
    if (originCity) {
      const origin = await City.findById(originCity);
      if (!origin)
        return res
          .status(400)
          .json({ success: false, message: "Origin city does not exist" });
    }
    if (destinationCity) {
      const dest = await City.findById(destinationCity);
      if (!dest)
        return res
          .status(400)
          .json({ success: false, message: "Destination city does not exist" });
    }
    // Prevent duplicate rule (exclude current rule)
    const duplicate = await PricingRule.findOne({
      originCity,
      destinationCity,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A pricing rule for this route already exists.",
      });
    }
    const rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      { originCity, destinationCity, basePrice, pricePerKg },
      { new: true }
    );
    if (!rule)
      return res
        .status(404)
        .json({ success: false, message: "Pricing rule not found" });
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const deletePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule)
      return res
        .status(404)
        .json({ success: false, message: "Pricing rule not found" });
    res.json({ success: true, message: "Pricing rule deleted" });
  } catch (error) {
    next(error);
  }
};
