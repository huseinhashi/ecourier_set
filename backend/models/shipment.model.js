import mongoose from "mongoose";

const shipmentLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "Created",
        "Status Updated",
        "Payment",
        "QR Generated",
        "Courier Assigned",
        "Weight Updated",
        "Price Calculated",
        "Cancelled",
      ],
    },
    status: {
      type: String,
      enum: [
        "Pending Pickup",
        "Picked Up",
        "At Origin Hub",
        "In Transit",
        "At Destination Hub",
        "Out for Delivery",
        "Delivered",
        "Canceled",
        "Paid",
        "Unpaid",
      ],
    },
    description: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["admin", "courier", "customer"],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const shipmentSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
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
    courierA: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    courierB: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    originHub: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" }, // not required
    destinationHub: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" }, // not required
    weight: { type: Number },
    price: { type: Number },
    qrCodeId: { type: String },
    status: {
      type: String,
      enum: [
        "Pending Pickup",
        "Picked Up",
        "At Origin Hub",
        "In Transit",
        "At Destination Hub",
        "Out for Delivery",
        "Delivered",
        "Canceled",
      ],
      default: "Pending Pickup",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    logs: [shipmentLogSchema],
  },
  { timestamps: true }
);

// Pre-save middleware to add logs for status changes
shipmentSchema.pre("save", function (next) {
  if (this.isModified("status") || this.isModified("paymentStatus")) {
    // This will be handled in the controller where we have user context
    next();
  } else {
    next();
  }
});

shipmentSchema.index(
  { qrCodeId: 1 },
  { unique: true, partialFilterExpression: { qrCodeId: { $type: "string" } } }
);

const Shipment = mongoose.model("Shipment", shipmentSchema);

export default Shipment;
