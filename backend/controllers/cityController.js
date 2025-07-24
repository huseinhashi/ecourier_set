import City from "../models/city.model.js";
import Hub from "../models/hub.model.js";
import PricingRule from "../models/pricingRule.model.js";

export const getAllCities = async (req, res, next) => {
  try {
    const cities = await City.find();
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
};

export const getCityById = async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

export const createCity = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "City name is required" });
    const city = await City.create({ name });
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

export const updateCity = async (req, res, next) => {
  try {
    const { name } = req.body;
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

export const deleteCity = async (req, res, next) => {
  try {
    const cityId = req.params.id;
    // Check for references in hubs
    const hubRef = await Hub.findOne({ city: cityId });
    if (hubRef) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete city: it is referenced by a hub.",
        });
    }
    // Check for references in pricing rules
    const ruleRef = await PricingRule.findOne({
      $or: [{ originCity: cityId }, { destinationCity: cityId }],
    });
    if (ruleRef) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete city: it is referenced by a pricing rule.",
        });
    }
    const city = await City.findByIdAndDelete(cityId);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, message: "City deleted" });
  } catch (error) {
    next(error);
  }
};
