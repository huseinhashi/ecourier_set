import mongoose from "mongoose";

const pricingRuleSchema = new mongoose.Schema(
  {
    originCity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    destinationCity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    pricePerKg: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const PricingRule = mongoose.model("PricingRule", pricingRuleSchema);

export default PricingRule;
