const mongoose = require("mongoose");

// Départ général de l'armoire (liaison TGBT → armoire). `result` est l'instantané du moteur
// client/src/domain/mainFeeder ; `basedOn` = date de mise à jour du bilan de puissance utilisé.
const num = { type: Number };
const CHECK = ["compliant", "non_compliant"];

const mainFeederSchema = new mongoose.Schema(
  {
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    inputs: {
      protectionType: { type: String, required: true },
      rating: { type: Number, required: true, min: 0 },
      material: { type: String, enum: ["Cuivre", "Aluminium"], required: true },
      insulation: { type: String, enum: ["PVC", "PR/EPR"], required: true },
      section: { type: String, required: true }, // "auto" ou section imposée (mm²)
      length: { type: Number, required: true, min: 0 },
      installationMethod: { type: String, required: true },
      coefficients: { k3: { type: Number, required: true }, k4: { type: Number, required: true }, k5: { type: Number, required: true } },
      maxVoltageDrop: { type: Number, required: true, min: 0, max: 100 },
    },
    result: {
      designCurrent: { type: Number, required: true },
      rating: { type: Number, required: true },
      section: { type: Number, required: true },
      currentCapacityTable: num,
      k: num,
      correctedCurrentCapacity: { type: Number, required: true },
      voltageDropPercent: { type: Number, required: true },
      voltageDropVolts: num,
      voltageDropLimitPercent: num,
      networkVoltage: num,
      phases: String,
      powerFactor: num,
      demandPowerKw: num,
      checks: {
        ibLeIn: { type: String, enum: CHECK, required: true },
        inLeIz: { type: String, enum: CHECK, required: true },
        voltageDrop: { type: String, enum: CHECK, required: true },
      },
      globalStatus: { type: String, enum: ["compliant", "non_compliant"], required: true },
    },
    status: { type: String, enum: ["compliant", "non_compliant"], required: true },
    basedOn: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MainFeeder", mainFeederSchema);
