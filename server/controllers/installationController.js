const { Installation } = require("../models");
const { createAssetFromInstallation } = require("../services/assetService");
const { recordEvent } = require("../services/historyService");
const { HttpError, handle, pick } = require("../utils/http");
const { findCabinet } = require("./stageController");

const FIELDS = ["installationDate", "team", "status", "comment"];

const get = handle(async (req, res) => {
  const cabinet = await findCabinet(req.params.cabinetId);
  const installation = await Installation.findOne({ cabinetId: cabinet._id });
  if (!installation) return res.status(204).send();
  res.json(installation);
});

// Enregistre l'installation. Quand elle passe à « Terminée », l'actif de l'armoire est créé automatiquement
// (une seule fois) et retourné avec l'installation.
const put = handle(async (req, res) => {
  const cabinet = await findCabinet(req.params.cabinetId);
  const existing = await Installation.findOne({ cabinetId: cabinet._id });
  const data = pick(req.body, FIELDS);
  if (!data.installationDate) throw new HttpError(400, "Date d'installation requise");

  // Une installation terminée ne peut pas revenir en arrière : l'actif qui en découle existe déjà.
  if (existing?.status === "completed" && data.status !== "completed") {
    throw new HttpError(409, "L'installation est terminée : l'actif a déjà été créé.");
  }

  const completing = data.status === "completed";
  const installation = await Installation.findOneAndUpdate(
    { cabinetId: cabinet._id },
    {
      ...data,
      cabinetId: cabinet._id,
      projectId: cabinet.projectId,
      completedAt: completing ? (existing?.completedAt ?? new Date()) : null,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await recordEvent({
    projectId: cabinet.projectId,
    cabinetId: cabinet._id,
    key: "installation",
    type: "installation",
    title: "Installation",
    status: installation.status === "completed" ? "completed" : installation.status,
    date: installation.installationDate,
  });

  let asset = null;
  let assetCreated = false;
  if (completing) {
    ({ asset, created: assetCreated } = await createAssetFromInstallation({ installation, cabinet }));
  }
  res.json({ installation, asset, assetCreated });
});

module.exports = { get, put };
