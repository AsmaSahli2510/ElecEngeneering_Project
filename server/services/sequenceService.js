const { Counter } = require("../models");

const pad = (value) => String(value).padStart(3, "0");
const formatId = (prefix, year, seq) => `${prefix}-${year}-${pad(seq)}`;

// Incrémente atomiquement le compteur `name` (ex. "asset-2026") et retourne la nouvelle valeur.
async function nextSequence(name) {
  const counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return counter.seq;
}

// Prochaine valeur sans la consommer (proposition de référence dans un formulaire).
async function peekSequence(name) {
  const counter = await Counter.findById(name);
  return (counter?.seq ?? 0) + 1;
}

module.exports = { formatId, nextSequence, peekSequence };
