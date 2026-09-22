const mongoose = require("mongoose");

const cabinetSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, trim: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    powerSupplyPoint: { type: String, trim: true },
    distanceToTGBT: { type: Number, min: 0 },
    network: { type: String, default: "400/230 V - 50 Hz", trim: true },
    neutralSystem: {
      type: String,
      enum: ["TT", "TN-S", "TN-C", "IT"],
      default: "TN-S",
    },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

cabinetSchema.index({ projectId: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model("Cabinet", cabinetSchema);
