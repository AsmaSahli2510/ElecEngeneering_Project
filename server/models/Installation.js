const mongoose = require("mongoose");

const installationSchema = new mongoose.Schema(
  {
    cabinetId: { type: mongoose.Schema.Types.ObjectId, ref: "Cabinet", required: true, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    installationDate: { type: Date, required: true },
    team: { type: String, required: true, trim: true },
    status: { type: String, enum: ["planned", "in_progress", "completed"], default: "planned" },
    comment: { type: String, trim: true },
    completedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Installation", installationSchema);
