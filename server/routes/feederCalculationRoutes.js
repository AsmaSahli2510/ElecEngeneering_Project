const express = require("express");
const controller = require("../controllers/feederCalculationController");

// Routes spécifiques au flux Armoire → Départs → Calcul.
// Montées avant les routes CRUD génériques pour surcharger la suppression d'un départ (cascade sur son calcul).
const router = express.Router();

router.get("/feeders/:feederId/calculation", controller.getForFeeder);
router.put("/feeders/:feederId/calculation", controller.saveForFeeder);
router.delete("/feeders/:id", controller.removeFeeder);
router.get("/cabinets/:cabinetId/calculations", controller.listForCabinet);

module.exports = router;
