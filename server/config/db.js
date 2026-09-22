const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  // Aligne les index sur les schémas : supprime ceux des anciennes versions des modèles (ex. l'ancien index unique
  // `assetReference`, qui empêcherait de créer plus d'un actif) et crée les manquants.
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.syncIndexes()));
}

module.exports = connectDatabase;
