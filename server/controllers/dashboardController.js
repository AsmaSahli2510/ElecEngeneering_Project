const { Asset, Cabinet, Maintenance, Project, Ticket } = require("../models");
const { handle } = require("../utils/http");
const { addDays, today } = require("../utils/dates");
const { getOwnedProjectIds } = require("../utils/ownership");

const OPEN_TICKET_STATUSES = ["reported", "assigned", "in_progress"];
const HIGH_PRIORITIES = ["high", "critical"];
const DUE_SOON_DAYS = 7;

// Indicateurs agrégés du tableau de bord : des comptages directs en base (countDocuments), jamais le chargement
// puis l'enrichissement de collections entières (ce que font GET /assets ou /tickets pour l'affichage détaillé).
const metrics = handle(async (req, res) => {
  const dueBefore = addDays(today(), DUE_SOON_DAYS);
  // Cabinet, Asset, Ticket et Maintenance portent tous déjà un projectId : les indicateurs se limitent aux
  // projets du compte connecté sans avoir à remonter une chaîne de jointures.
  const ownedProjectIds = await getOwnedProjectIds(req.userId);
  const inOwnedProjects = { projectId: { $in: ownedProjectIds } };

  const [
    projectsTotal,
    activeProjects,
    cabinetsTotal,
    assetsTotal,
    commissionedAssets,
    openTickets,
    highPriorityOpenTickets,
    maintenanceTotal,
    maintenanceDueSoon,
  ] = await Promise.all([
    Project.countDocuments({ owner: req.userId }),
    Project.countDocuments({ owner: req.userId, status: "active" }),
    Cabinet.countDocuments(inOwnedProjects),
    Asset.countDocuments(inOwnedProjects),
    Asset.countDocuments({ ...inOwnedProjects, status: "in_service" }),
    Ticket.countDocuments({ ...inOwnedProjects, status: { $in: OPEN_TICKET_STATUSES } }),
    Ticket.countDocuments({ ...inOwnedProjects, status: { $in: OPEN_TICKET_STATUSES }, priority: { $in: HIGH_PRIORITIES } }),
    Maintenance.countDocuments(inOwnedProjects),
    Maintenance.countDocuments({ ...inOwnedProjects, nextDate: { $lte: dueBefore } }),
  ]);

  res.json({
    projectsTotal,
    activeProjects,
    cabinetsTotal,
    assetsTotal,
    commissionedAssets,
    openTickets,
    highPriorityOpenTickets,
    maintenanceTotal,
    maintenanceDueSoon,
  });
});

module.exports = { metrics };
