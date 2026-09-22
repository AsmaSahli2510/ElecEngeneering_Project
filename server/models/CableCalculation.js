const mongoose = require("mongoose");

// Calcul d'un départ : un document par départ (feederId unique).
// `inputs` reprend les 7 formulaires ; `result` est l'instantané du moteur de calcul client
// (client/src/domain/calculation). Le futur module « Bilan de puissance » lit directement
// `result.designCurrent`, `result.absorbedPowerKw`, `result.apparentPowerKva` et `status`,
// filtrés par cabinetId (GET /api/cabinets/:cabinetId/calculations).

const CHECK_STATUS = ["compliant", "non_compliant"];
const num = { type: Number };
const requiredNum = { type: Number, required: true };

const inputsSchema = new mongoose.Schema(
  {
    circuit: {
      nominalVoltage: { type: Number, required: true, min: 0 },
      circuitType: { type: String, enum: ["Triphasé", "Monophasé"], required: true },
      neutralSystem: { type: String, enum: ["TT", "TN-S", "TN-C", "IT"], required: true },
    },
    load: {
      power: { type: Number, required: true, min: 0 },
      powerUnit: { type: String, enum: ["kW", "W", "kVA"], required: true },
      loadType: { type: String, enum: ["Moteur", "Éclairage", "Prises", "Chauffage", "Autre"], required: true },
      powerFactor: { type: Number, required: true, min: 0, max: 1 },
      efficiency: { type: Number, required: true, min: 0, max: 1 },
      cableLength: { type: Number, required: true, min: 0 },
      maxVoltageDrop: { type: Number, required: true, min: 0, max: 100 },
    },
    cable: {
      material: { type: String, enum: ["Cuivre", "Aluminium"], required: true },
      insulation: { type: String, enum: ["PVC", "PR/EPR"], required: true },
      conductorCount: { type: Number, required: true, min: 1 },
      installationMethod: { type: String, required: true },
      section: { type: String, required: true }, // "auto" ou la section imposée (mm²)
    },
    installation: {
      ambientTemperature: requiredNum,
      groupedCircuits: { type: Number, required: true, min: 1 },
      specialInstallation: { type: Boolean, default: false },
    },
    coefficients: {
      mode: { type: String, enum: ["auto", "manual"], required: true },
      k3: requiredNum,
      k4: requiredNum,
      k5: requiredNum,
    },
    upstreamVoltageDrop: {
      value: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: ["%", "V"], required: true },
    },
    upstreamShortCircuit: {
      iccKa: { type: Number, required: true, min: 0 },
      breakingCapacityKa: { type: Number, required: true, min: 0 },
    },
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema(
  {
    referenceProviderId: { type: String, required: true },
    designCurrent: { type: Number, required: true },
    absorbedPowerKw: num,
    apparentPowerKva: num,
    loadedConductors: num,
    coefficients: {
      mode: String,
      k3: requiredNum,
      k4: requiredNum,
      k5: requiredNum,
      k: requiredNum,
    },
    cable: {
      material: String,
      insulation: String,
      installationMethod: String,
      recommendedSection: requiredNum,
      thermalSection: num,
      limitingCriterion: { type: String, enum: ["thermal", "voltageDrop", "manual"] },
      currentCapacityTableId: String,
      currentCapacityTable: num,
      correctedCurrentCapacity: requiredNum,
      resistanceOhmPerKm: num,
      reactanceOhmPerKm: num,
    },
    voltageDrop: {
      feederPercent: requiredNum,
      feederVolts: num,
      upstreamPercent: num,
      maxPercent: num,
      availablePercent: num,
    },
    shortCircuit: {
      iccKa: requiredNum,
      breakingCapacityKa: requiredNum,
    },
    checks: {
      thermal: { type: String, enum: CHECK_STATUS, required: true },
      voltageDrop: { type: String, enum: CHECK_STATUS, required: true },
      breakingCapacity: { type: String, enum: CHECK_STATUS, required: true },
    },
    globalStatus: { type: String, enum: ["validated", "non_compliant"], required: true },
  },
  { _id: false },
);

const cableCalculationSchema = new mongoose.Schema(
  {
    feederId: { type: mongoose.Schema.Types.ObjectId, ref: "Feeder", required: true, unique: true },
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    inputs: { type: inputsSchema, required: true },
    result: { type: resultSchema, required: true },
    status: { type: String, enum: ["validated", "non_compliant"], required: true },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CableCalculation", cableCalculationSchema);
