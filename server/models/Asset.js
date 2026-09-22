const mongoose = require("mongoose");

// Actif créé automatiquement quand l'installation d'une armoire passe à « Terminée ».
// Il ne duplique aucune donnée : projet, armoire, départs, calculs, bilan, nomenclature, devis et installation
// restent dans leurs collections et sont retrouvés via projectId / cabinetId.
const assetSchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, unique: true, trim: true }, // ACT-2026-001
    serialNumber: { type: String, required: true, unique: true, trim: true }, // AR-01-2026-001
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, unique: true },
    installationId: { type: mongoose.Schema.Types.ObjectId, ref: "Installation" },
    installationDate: { type: Date, required: true },
    status: { type: String, enum: ["in_service", "maintenance", "out_of_service", "retired"], default: "in_service" },
    warranty: {
      start: { type: Date, required: true },
      partsEnd: { type: Date, required: true },
      laborEnd: { type: Date, required: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Asset", assetSchema);
