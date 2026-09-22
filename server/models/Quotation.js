const mongoose = require("mongoose");

// Devis d'une armoire. Les lignes sont figées (instantané de la nomenclature à l'enregistrement).
const quotationSchema = new mongoose.Schema(
  {
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    reference: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    validityDays: { type: Number, required: true, min: 0, default: 30 },
    validUntil: Date,
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    vatPercent: { type: Number, min: 0, max: 100, required: true },
    currency: { type: String, default: "EUR" },
    lines: [
      {
        _id: false,
        reference: String,
        designation: String,
        category: String,
        unit: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
      },
    ],
    subtotalHT: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalHT: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    status: { type: String, enum: ["saved", "generated"], default: "saved" },
    generatedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quotation", quotationSchema);
