const express = require("express");
const createResourceRoutes = require("./resourceRoutes");
const feederCalculationRoutes = require("./feederCalculationRoutes");
const workflowRoutes = require("./workflowRoutes");
const models = require("../models");
const { recordEvent } = require("../services/historyService");

const router = express.Router();

// Routes spécifiques (départs/calculs, puis suite du workflow) montées avant le CRUD générique.
router.use(feederCalculationRoutes);
router.use(workflowRoutes);

// CRUD générique : uniquement pour les ressources simples. Les autres modèles (bilan, nomenclature, devis,
// installation, actifs, maintenance, tickets) passent exclusivement par des routes métier ; l'historique
// n'est jamais modifiable depuis l'API.
const resources = {
  Project: {
    path: "projects",
    hooks: {
      afterCreate: (project) =>
        recordEvent({
          projectId: project._id,
          key: "project",
          type: "project_created",
          title: `Création du projet ${project.reference}`,
          status: "completed",
        }),
    },
  },
  Cabinet: {
    path: "cabinets",
    hooks: {
      afterCreate: (cabinet) =>
        recordEvent({
          projectId: cabinet.projectId,
          cabinetId: cabinet._id,
          key: "cabinet",
          type: "cabinet_created",
          title: `Création de l'armoire ${cabinet.reference}`,
          status: "completed",
        }),
    },
  },
  Feeder: { path: "feeders" },
  CableCalculation: { path: "cable-calculations" },
  Component: { path: "components" },
};

Object.entries(resources).forEach(([modelName, { path, hooks }]) => {
  router.use(`/${path}`, createResourceRoutes(models[modelName], hooks));
});

module.exports = router;
