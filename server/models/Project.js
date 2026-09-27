const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Chaque projet appartient à un compte : c'est ce qui délimite l'espace Bureau d'Études de chaque utilisateur.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    reference: { type: String, required: true, trim: true },
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

// La référence n'a plus besoin d'être unique globalement : deux comptes différents ont chacun leur propre espace.
projectSchema.index({ owner: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model("Project", projectSchema);
