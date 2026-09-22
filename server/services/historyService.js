const { HistoryEvent } = require("../models");

// Enregistre (ou met à jour) l'événement d'historique d'une entité. `key` identifie l'entité
// (ex. "feeder:<id>", "installation", "ticket:<id>") : un seul événement par entité, à jour de son dernier statut.
// L'historique ne doit jamais faire échouer l'action de l'utilisateur : une erreur est journalisée puis ignorée.
async function recordEvent({ projectId, cabinetId, assetId, key, type, title, status, date = new Date() }) {
  if (!projectId) return;
  try {
    await HistoryEvent.findOneAndUpdate(
      { projectId, key },
      { $set: { cabinetId, assetId, type, title, status, date } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    console.error(`History event "${key}" not recorded: ${error.message}`);
  }
}

module.exports = { recordEvent };
