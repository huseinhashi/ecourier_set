import Hub from "../models/hub.model.js";
import City from "../models/city.model.js";
import Shipment from "../models/shipment.model.js";

export const getAllHubs = async (req, res, next) => {
  try {
    const hubs = await Hub.find().populate("city");
    res.json({ success: true, data: hubs });
  } catch (error) {
    next(error);
  }
};

export const getHubById = async (req, res, next) => {
  try {
    const hub = await Hub.findById(req.params.id).populate("city");
    if (!hub)
      return res.status(404).json({ success: false, message: "Hub not found" });
    res.json({ success: true, data: hub });
  } catch (error) {
    next(error);
  }
};

export const createHub = async (req, res, next) => {
  try {
    const { name, city, address } = req.body;
    if (!name || !city)
      return res
        .status(400)
        .json({ success: false, message: "Name and city are required" });
    const cityExists = await City.findById(city);
    if (!cityExists)
      return res
        .status(400)
        .json({ success: false, message: "City does not exist" });
    const hub = await Hub.create({ name, city, address });
    res.status(201).json({ success: true, data: hub });
  } catch (error) {
    next(error);
  }
};

export const updateHub = async (req, res, next) => {
  try {
    const { name, city, address } = req.body;
    if (city) {
      const cityExists = await City.findById(city);
      if (!cityExists)
        return res
          .status(400)
          .json({ success: false, message: "City does not exist" });
    }
    const hub = await Hub.findByIdAndUpdate(
      req.params.id,
      { name, city, address },
      { new: true }
    );
    if (!hub)
      return res.status(404).json({ success: false, message: "Hub not found" });
    res.json({ success: true, data: hub });
  } catch (error) {
    next(error);
  }
};

export const deleteHub = async (req, res, next) => {
  try {
    const hubId = req.params.id;
    // Check for references in shipments
    const shipmentRef = await Shipment.findOne({
      $or: [{ originHub: hubId }, { destinationHub: hubId }],
    });
    if (shipmentRef) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete hub: it is referenced by a shipment.",
      });
    }
    const hub = await Hub.findByIdAndDelete(hubId);
    if (!hub)
      return res.status(404).json({ success: false, message: "Hub not found" });
    res.json({ success: true, message: "Hub deleted" });
  } catch (error) {
    next(error);
  }
};

export const getHubsByCity = async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const hubs = await Hub.find({ city: cityId }).populate("city");
    res.json({ success: true, data: hubs });
  } catch (error) {
    next(error);
  }
};
