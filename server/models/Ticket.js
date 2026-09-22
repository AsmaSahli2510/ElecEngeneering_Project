const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true }, // TKT-2026-001
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    reportedAt: { type: Date, default: Date.now },
    technician: { type: String, trim: true },
    status: { type: String, enum: ["reported", "assigned", "in_progress", "resolved", "closed"], default: "reported" },
    resolution: {
      action: { type: String, trim: true },
      partsUsed: { type: String, trim: true },
      resolvedAt: Date,
      comment: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
