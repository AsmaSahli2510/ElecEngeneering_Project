const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    designation: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, default: "unité" },
    unitPrice: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Component", componentSchema);
