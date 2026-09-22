const mongoose = require("mongoose");

// Compteurs atomiques pour les identifiants séquentiels (ACT-2026-001, DEV-2026-001, TKT-2026-001).
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

module.exports = mongoose.model("Counter", counterSchema);
