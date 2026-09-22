const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);

// Erreur métier portant un code HTTP ; transformée en réponse JSON par le gestionnaire d'erreurs de server.js.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => source?.[key] !== undefined).map((key) => [key, source[key]]));
}

// Enveloppe un contrôleur async : toute erreur part vers next() (gestionnaire d'erreurs Express).
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, handle, isValidId, pick };
