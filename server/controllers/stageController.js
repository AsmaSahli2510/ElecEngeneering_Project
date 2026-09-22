const { BOMItem, Cabinet, MainFeeder, PowerBalance } = require("../models");
const { recordEvent } = require("../services/historyService");
const { HttpError, handle, isValidId, pick } = require("../utils/http");

async function findCabinet(cabinetId) {
  if (!isValidId(cabinetId)) throw new HttpError(400, "Identifiant d'armoire invalide");
  const cabinet = await Cabinet.findById(cabinetId);
  if (!cabinet) throw new HttpError(404, "Armoire introuvable");
  return cabinet;
}

// Contrôleur GET / PUT d'un document unique rattaché à une armoire (bilan de puissance, départ général).
// GET : 204 tant que rien n'est enregistré. PUT : crée ou remplace, puis journalise l'événement.
function createCabinetDocController(Model, { fields, describe }) {
  return {
    get: handle(async (req, res) => {
      const cabinet = await findCabinet(req.params.cabinetId);
      const doc = await Model.findOne({ cabinetId: cabinet._id });
      if (!doc) return res.status(204).send();
      res.json(doc);
    }),
    put: handle(async (req, res) => {
      const cabinet = await findCabinet(req.params.cabinetId);
      const doc = await Model.findOneAndUpdate(
        { cabinetId: cabinet._id },
        { ...pick(req.body, fields), cabinetId: cabinet._id, projectId: cabinet.projectId },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      );
      await recordEvent({ projectId: cabinet.projectId, cabinetId: cabinet._id, ...describe(doc) });
      res.json(doc);
    }),
  };
}

const powerBalance = createCabinetDocController(PowerBalance, {
  fields: ["parameters", "result", "lines", "status", "basedOn"],
  describe: (doc) => ({
    key: "power-balance",
    type: "power_balance",
    title: "Bilan de puissance",
    status: doc.status === "validated" ? "completed" : "non_compliant",
  }),
});

const mainFeeder = createCabinetDocController(MainFeeder, {
  fields: ["inputs", "result", "status", "basedOn"],
  describe: (doc) => ({
    key: "main-feeder",
    type: "main_feeder",
    title: "Départ général",
    status: doc.status === "compliant" ? "completed" : "non_compliant",
  }),
});

const BOM_FIELDS = ["reference", "designation", "category", "unit", "quantity", "unitPrice", "priceMissing", "source", "autoKey", "sourceRef", "edited"];

// Nomenclature : GET la liste ordonnée ; PUT remplace toute la liste (ajout, modification, suppression,
// régénération). Toutes les lignes sont validées avant de toucher à la base pour ne jamais perdre l'existant.
const bom = {
  list: handle(async (req, res) => {
    const cabinet = await findCabinet(req.params.cabinetId);
    res.json(await BOMItem.find({ cabinetId: cabinet._id }).sort({ position: 1, createdAt: 1 }));
  }),
  replace: handle(async (req, res) => {
    const cabinet = await findCabinet(req.params.cabinetId);
    const items = req.body?.items;
    if (!Array.isArray(items)) throw new HttpError(400, "Liste de lignes requise");

    const docs = items.map(
      (item, index) => new BOMItem({ ...pick(item, BOM_FIELDS), position: index, cabinetId: cabinet._id, projectId: cabinet.projectId }),
    );
    await Promise.all(docs.map((doc) => doc.validate()));

    await BOMItem.deleteMany({ cabinetId: cabinet._id });
    const saved = docs.length > 0 ? await BOMItem.insertMany(docs) : [];
    await recordEvent({
      projectId: cabinet.projectId,
      cabinetId: cabinet._id,
      key: "bom",
      type: "bom",
      title: "Nomenclature",
      status: "completed",
    });
    res.json(saved);
  }),
};

module.exports = { powerBalance, mainFeeder, bom, findCabinet };
