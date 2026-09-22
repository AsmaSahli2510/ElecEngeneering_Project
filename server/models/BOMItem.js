const mongoose = require("mongoose");

const CATEGORIES = [
  "Protection",
  "Câble",
  "Disjoncteur",
  "Interrupteur",
  "Contacteur",
  "Bornier",
  "Rail DIN",
  "Accessoire",
  "Composant de commande",
];

// Ligne de nomenclature. `source: "auto"` = générée depuis les départs / le départ général ;
// `autoKey` identifie la ligne générée (ex. "D01:breaker") pour la régénérer sans écraser les retouches.
const bomItemSchema = new mongoose.Schema(
  {
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    position: { type: Number, default: 0 },
    reference: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    unit: { type: String, default: "u", trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, min: 0, default: 0 },
    priceMissing: { type: Boolean, default: false },
    source: { type: String, enum: ["auto", "manual"], default: "manual" },
    autoKey: String,
    sourceRef: String,
    edited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Total ligne = quantité × prix unitaire (arrondi au centime).
bomItemSchema.pre("validate", function computeTotal() {
  this.totalPrice = Math.round(this.quantity * this.unitPrice * 100) / 100;
});

module.exports = mongoose.model("BOMItem", bomItemSchema);
module.exports.CATEGORIES = CATEGORIES;
