const express = require("express");
const assets = require("../controllers/assetController");
const dashboard = require("../controllers/dashboardController");
const installation = require("../controllers/installationController");
const overview = require("../controllers/overviewController");
const quotation = require("../controllers/quotationController");
const stage = require("../controllers/stageController");

// Routes du workflow : bilan → départ général → nomenclature → devis → installation → actif → maintenance → tickets.
// Montées avant les routes CRUD génériques ; les actifs sont adressés par leur identifiant métier (ACT-2026-001).
const router = express.Router();

// Montée avant /projects/:projectId/... : évite que "summary" ne soit jamais interprété comme un identifiant.
router.get("/projects/summary", overview.summaries);
router.get("/projects/:projectId/overview", overview.overview);
router.get("/projects/:projectId/history", overview.history);

router.get("/dashboard/metrics", dashboard.metrics);

router.get("/cabinets/:cabinetId/power-balance", stage.powerBalance.get);
router.put("/cabinets/:cabinetId/power-balance", stage.powerBalance.put);
router.get("/cabinets/:cabinetId/main-feeder", stage.mainFeeder.get);
router.put("/cabinets/:cabinetId/main-feeder", stage.mainFeeder.put);
router.get("/cabinets/:cabinetId/bom", stage.bom.list);
router.put("/cabinets/:cabinetId/bom", stage.bom.replace);

router.get("/quotations/next-reference", quotation.nextReference);
router.get("/cabinets/:cabinetId/quotation", quotation.get);
router.put("/cabinets/:cabinetId/quotation", quotation.put);

router.get("/cabinets/:cabinetId/installation", installation.get);
router.put("/cabinets/:cabinetId/installation", installation.put);

router.get("/assets", assets.listAssets);
router.get("/assets/:assetId", assets.getAsset);
router.patch("/assets/:assetId", assets.updateAsset);
router.get("/assets/:assetId/maintenance", assets.getMaintenance);
router.put("/assets/:assetId/maintenance-plan", assets.putMaintenancePlan);
router.post("/assets/:assetId/interventions", assets.addIntervention);
router.get("/assets/:assetId/tickets", assets.listAssetTickets);
router.post("/assets/:assetId/tickets", assets.createTicket);

router.get("/maintenance-plans", assets.listMaintenancePlans);
router.get("/tickets", assets.listTickets);
router.patch("/tickets/:id", assets.updateTicket);

module.exports = router;
