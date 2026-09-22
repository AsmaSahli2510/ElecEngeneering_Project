const mongoose = require("mongoose");

// Plan de maintenance préventive d'un actif + interventions réalisées (une fiche par actif).
const maintenanceSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    frequencyMonths: { type: Number, enum: [3, 6, 12], required: true },
    technician: { type: String, required: true, trim: true },
    // Prochaine date = date de la dernière intervention (ou d'installation) + fréquence.
    baseDate: { type: Date, required: true },
    nextDate: { type: Date, required: true },
    interventions: [
      {
        date: { type: Date, required: true },
        type: { type: String, enum: ["preventive", "corrective", "inspection"], default: "preventive" },
        technician: { type: String, required: true, trim: true },
        result: { type: String, enum: ["ok", "reserves", "defect"], required: true },
        observations: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Maintenance", maintenanceSchema);
