const mongoose = require("mongoose");

const feederSchema = new mongoose.Schema(
  {
    cabinetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cabinet",
      required: true,
    },
    reference: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    loadType: {
      type: String,
      enum: ["Moteur", "Éclairage", "Prises", "Chauffage", "Autre"],
      default: "Autre",
    },
    power: { type: Number, required: true, min: 0 },
    powerUnit: { type: String, enum: ["W", "kW", "kVA"], default: "kW" },
    voltage: { type: Number, default: 400, min: 0 },
    cableLength: { type: Number, required: true, min: 0 },
    // draft : à calculer ; calculated : calcul enregistré et conforme ; non_compliant : calcul enregistré, non conforme.
    status: {
      type: String,
      enum: ["draft", "calculated", "non_compliant"],
      default: "draft",
    },
  },
  { timestamps: true },
);

feederSchema.index({ cabinetId: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model("Feeder", feederSchema);
