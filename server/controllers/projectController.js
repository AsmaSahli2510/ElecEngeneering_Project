const { Project } = require("../models");
const { formatId, nextSequence, peekSequence } = require("../services/sequenceService");
const { handle } = require("../utils/http");

// Références de projet séquentielles (PROJ-2026-001, PROJ-2026-002, ...) : un compteur par compte et par année,
// puisque chaque compte a son propre espace. Les références déjà prises (projets saisis avant la numérotation
// automatique) sont sautées.
const counterName = (ownerId, year) => `project-${ownerId}-${year}`;

async function isTaken(owner, reference) {
  return Boolean(await Project.exists({ owner, reference }));
}

// Référence proposée dans le formulaire (sans consommer le compteur).
const nextReference = handle(async (req, res) => {
  const year = new Date().getUTCFullYear();
  let seq = await peekSequence(counterName(req.userId, year));
  while (await isTaken(req.userId, formatId("PROJ", year, seq))) seq += 1;
  res.json({ reference: formatId("PROJ", year, seq) });
});

// Attribue la référence définitive à la création : celle envoyée par le client n'est jamais reprise.
async function assignReference(data, req) {
  const year = new Date().getUTCFullYear();
  let reference;
  do {
    reference = formatId("PROJ", year, await nextSequence(counterName(req.userId, year)));
  } while (await isTaken(req.userId, reference));
  data.reference = reference;
}

module.exports = { nextReference, assignReference };
