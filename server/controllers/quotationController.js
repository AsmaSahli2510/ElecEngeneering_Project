const { Quotation } = require("../models");
const { recordEvent } = require("../services/historyService");
const { formatId, nextSequence, peekSequence } = require("../services/sequenceService");
const { addDays } = require("../utils/dates");
const { HttpError, handle, pick } = require("../utils/http");
const { computeQuotationTotals } = require("../utils/money");
const { findCabinet } = require("./stageController");

const FIELDS = ["reference", "date", "validityDays", "discountPercent", "vatPercent", "currency", "lines", "status"];

const get = handle(async (req, res) => {
  const cabinet = await findCabinet(req.params.cabinetId);
  const quotation = await Quotation.findOne({ cabinetId: cabinet._id });
  if (!quotation) return res.status(204).send();
  res.json(quotation);
});

// Référence proposée pour un nouveau devis (sans consommer le compteur).
const nextReference = handle(async (req, res) => {
  const year = new Date().getUTCFullYear();
  res.json({ reference: formatId("DEV", year, await peekSequence(`quotation-${year}`)) });
});

// Enregistre le devis. Les montants sont TOUJOURS recalculés ici à partir des lignes, de la remise et de la TVA :
// les totaux envoyés par le client ne sont pas repris.
const put = handle(async (req, res) => {
  const cabinet = await findCabinet(req.params.cabinetId);
  const existing = await Quotation.findOne({ cabinetId: cabinet._id });
  const data = pick(req.body, FIELDS);

  if (!Array.isArray(data.lines) || data.lines.length === 0) throw new HttpError(400, "Le devis doit contenir au moins une ligne");
  if (!(data.date instanceof Date) && Number.isNaN(Date.parse(data.date))) throw new HttpError(400, "Date du devis invalide");
  for (const line of data.lines) {
    if (!(Number(line.quantity) >= 0) || !(Number(line.unitPrice) >= 0)) throw new HttpError(400, "Quantité et prix unitaire doivent être positifs");
  }
  const discountPercent = Number(data.discountPercent ?? 0);
  const vatPercent = Number(data.vatPercent);
  if (!(discountPercent >= 0 && discountPercent <= 100)) throw new HttpError(400, "Remise comprise entre 0 et 100 %");
  if (!(vatPercent >= 0 && vatPercent <= 100)) throw new HttpError(400, "TVA comprise entre 0 et 100 %");

  // Un devis généré est figé : seule sa régénération explicite (status: "generated") ou son retour à « saved » est possible.
  const status = data.status === "generated" ? "generated" : "saved";
  const validityDays = Number(data.validityDays ?? 30);
  const totals = computeQuotationTotals(data.lines, discountPercent, vatPercent);

  let reference = (data.reference ?? "").trim() || existing?.reference;
  if (!reference) {
    const year = new Date(data.date).getUTCFullYear();
    reference = formatId("DEV", year, await nextSequence(`quotation-${year}`));
  }

  const quotation = await Quotation.findOneAndUpdate(
    { cabinetId: cabinet._id },
    {
      ...data,
      ...totals,
      reference,
      validityDays,
      discountPercent,
      vatPercent,
      status,
      validUntil: addDays(data.date, validityDays),
      generatedAt: status === "generated" ? (existing?.status === "generated" ? existing.generatedAt : new Date()) : null,
      cabinetId: cabinet._id,
      projectId: cabinet.projectId,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  await recordEvent({
    projectId: cabinet.projectId,
    cabinetId: cabinet._id,
    key: "quotation",
    type: "quotation",
    title: `Devis ${quotation.reference}`,
    status: quotation.status === "generated" ? "completed" : "in_progress",
  });
  res.json(quotation);
});

module.exports = { get, nextReference, put };
