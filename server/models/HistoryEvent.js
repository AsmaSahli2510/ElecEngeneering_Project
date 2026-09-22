const mongoose = require("mongoose");

const TYPES = [
  "project_created",
  "cabinet_created",
  "feeder_calculated",
  "power_balance",
  "main_feeder",
  "bom",
  "quotation",
  "installation",
  "asset_created",
  "maintenance",
  "ticket",
  "repair",
  "component_change",
];

// Journal des événements du projet puis de l'actif. Alimenté uniquement par le serveur (services/historyService) :
// personne ne saisit d'événement à la main. `key` rend l'événement idempotent (un événement par entité).
const historyEventSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet" },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
    key: { type: String, required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: TYPES, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true },
);

historyEventSchema.index({ projectId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("HistoryEvent", historyEventSchema);
module.exports.TYPES = TYPES;
