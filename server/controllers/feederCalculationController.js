const mongoose = require("mongoose");
const { Cabinet, CableCalculation, Feeder, HistoryEvent } = require("../models");
const { recordEvent } = require("../services/historyService");

const isValidId = (id) => mongoose.isValidObjectId(id);

// Le statut du départ suit le statut global du calcul enregistré.
const feederStatusFor = (calculationStatus) =>
  calculationStatus === "validated" ? "calculated" : "non_compliant";

async function getForFeeder(req, res, next) {
  try {
    if (!isValidId(req.params.feederId)) return res.status(400).json({ message: "Identifiant de départ invalide" });
    const calculation = await CableCalculation.findOne({ feederId: req.params.feederId });
    // 204 : le départ existe mais n'a pas encore de calcul (évite une erreur 404 dans la console du navigateur).
    if (!calculation) return res.status(204).send();
    res.json(calculation);
  } catch (error) {
    next(error);
  }
}

// Enregistre (crée ou remplace) le calcul d'un départ et met à jour le statut du départ.
async function saveForFeeder(req, res, next) {
  try {
    const { feederId } = req.params;
    if (!isValidId(feederId)) return res.status(400).json({ message: "Identifiant de départ invalide" });

    const feeder = await Feeder.findById(feederId);
    if (!feeder) return res.status(404).json({ message: "Départ introuvable" });
    const cabinet = await Cabinet.findById(feeder.cabinetId);

    const { inputs, result } = req.body;
    const status = result?.globalStatus;
    const calculation = await CableCalculation.findOneAndUpdate(
      { feederId },
      {
        feederId,
        cabinetId: feeder.cabinetId,
        projectId: cabinet?.projectId,
        inputs,
        result,
        status,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    feeder.status = feederStatusFor(calculation.status);
    await feeder.save();

    await recordEvent({
      projectId: cabinet?.projectId,
      cabinetId: feeder.cabinetId,
      key: `feeder:${feeder._id}`,
      type: "feeder_calculated",
      title: `Calcul du départ ${feeder.reference}`,
      status: calculation.status === "validated" ? "completed" : "non_compliant",
    });

    res.status(200).json({ calculation, feeder });
  } catch (error) {
    next(error);
  }
}

// Tous les calculs d'une armoire : point d'entrée pour le futur bilan de puissance.
async function listForCabinet(req, res, next) {
  try {
    if (!isValidId(req.params.cabinetId)) return res.status(400).json({ message: "Identifiant d'armoire invalide" });
    const calculations = await CableCalculation.find({ cabinetId: req.params.cabinetId }).sort({ createdAt: 1 });
    res.json(calculations);
  } catch (error) {
    next(error);
  }
}

// Supprime un départ et son calcul.
async function removeFeeder(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Identifiant de départ invalide" });
    const feeder = await Feeder.findByIdAndDelete(req.params.id);
    if (!feeder) return res.status(404).json({ message: "Départ introuvable" });
    await CableCalculation.deleteOne({ feederId: feeder._id });
    await HistoryEvent.deleteOne({ key: `feeder:${feeder._id}` });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { getForFeeder, saveForFeeder, listForCabinet, removeFeeder };
