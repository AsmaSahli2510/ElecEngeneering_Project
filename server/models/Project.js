const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    reference: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    installationSite: { type: String, required: true, trim: true },
    siteAddress: { type: String, trim: true },
    description: { type: String, trim: true },
    creationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "draft",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);
