const express = require("express");
const createResourceRoutes = require("./resourceRoutes");
const authRoutes = require("./authRoutes");
const feederCalculationRoutes = require("./feederCalculationRoutes");
const workflowRoutes = require("./workflowRoutes");
const models = require("../models");
const requireAuth = require("../middleware/requireAuth");
const { recordEvent } = require("../services/historyService");

const router = express.Router();

// Inscription/connexion : seules routes accessibles sans jeton. Tout le reste exige un compte (req.userId),
// c'est ce qui permet de délimiter l'espace Bureau d'Études de chacun.
router.use(authRoutes);
router.use(requireAuth);

// Un utilisateur ne doit pouvoir lister/créer des armoires que sous l'un de ses propres projets — sans ce
// contrôle, connaître l'identifiant d'un projet suffirait à voir ou modifier les armoires d'un autre compte.
async function requireOwnedProject(req, res, next) {
  const projectId = req.method === "GET" ? req.query.projectId : req.body.projectId;
  if (!projectId) return next();
  try {
    const owned = await models.Project.exists({ _id: projectId, owner: req.userId });
    if (!owned) return res.status(404).json({ message: "Projet introuvable" });
    next();
  } catch (error) {
    next(error);
  }
}

// Routes spécifiques (départs/calculs, puis suite du workflow) montées avant le CRUD générique.
router.use(feederCalculationRoutes);
router.use(workflowRoutes);

// CRUD générique : uniquement pour les ressources simples. Les autres modèles (bilan, nomenclature, devis,
// installation, actifs, maintenance, tickets) passent exclusivement par des routes métier ; l'historique
// n'est jamais modifiable depuis l'API.
const resources = {
  Project: {
    path: "projects",
    options: { ownerField: "owner" },
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
    middleware: [requireOwnedProject],
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

Object.entries(resources).forEach(([modelName, { path, hooks, options, middleware = [] }]) => {
  router.use(`/${path}`, ...middleware, createResourceRoutes(models[modelName], hooks, options));
});

module.exports = router;
