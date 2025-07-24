import mongoose from "mongoose";

const hubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    address: {
      type: String,
    },
  },
  { timestamps: true }
);

const Hub = mongoose.model("Hub", hubSchema);

export default Hub;
