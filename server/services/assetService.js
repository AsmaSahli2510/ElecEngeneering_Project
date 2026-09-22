const { Asset } = require("../models");
const { warranty } = require("../config/lifecycle");
const { addMonths } = require("../utils/dates");
const { formatId, nextSequence } = require("./sequenceService");
const { recordEvent } = require("./historyService");

// Crée l'actif d'une armoire une fois son installation terminée. Idempotent : une armoire n'a qu'un actif.
// Les informations projet / client / site / armoire / calculs / nomenclature / devis ne sont pas copiées :
// l'actif y reste lié par projectId et cabinetId.
async function createAssetFromInstallation({ installation, cabinet }) {
  const existing = await Asset.findOne({ cabinetId: cabinet._id });
  if (existing) return { asset: existing, created: false };

  const year = new Date(installation.installationDate).getUTCFullYear();
  const seq = await nextSequence(`asset-${year}`);
  const start = installation.installationDate;

  try {
    const asset = await Asset.create({
      assetId: formatId("ACT", year, seq),
      serialNumber: formatId(cabinet.reference, year, seq),
      projectId: cabinet.projectId,
      cabinetId: cabinet._id,
      installationId: installation._id,
      installationDate: start,
      status: "in_service",
      warranty: {
        start,
        partsEnd: addMonths(start, warranty.partsMonths),
        laborEnd: addMonths(start, warranty.laborMonths),
      },
    });
    await recordEvent({
      projectId: asset.projectId,
      cabinetId: asset.cabinetId,
      assetId: asset._id,
      key: "asset",
      type: "asset_created",
      title: `Création de l'actif ${asset.assetId}`,
      status: "completed",
      date: installation.completedAt ?? new Date(),
    });
    return { asset, created: true };
  } catch (error) {
    // Deux requêtes concurrentes : l'autre a créé l'actif entre-temps.
    if (error.code === 11000) {
      const concurrent = await Asset.findOne({ cabinetId: cabinet._id });
      if (concurrent) return { asset: concurrent, created: false };
    }
    throw error;
  }
}

module.exports = { createAssetFromInstallation };
