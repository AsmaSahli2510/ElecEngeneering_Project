const { Asset, Cabinet, Maintenance, Project, Ticket } = require("../models");
const { handle } = require("../utils/http");
const { addDays, today } = require("../utils/dates");

const OPEN_TICKET_STATUSES = ["reported", "assigned", "in_progress"];
const HIGH_PRIORITIES = ["high", "critical"];
const DUE_SOON_DAYS = 7;

// Indicateurs agrégés du tableau de bord : des comptages directs en base (countDocuments), jamais le chargement
// puis l'enrichissement de collections entières (ce que font GET /assets ou /tickets pour l'affichage détaillé).
const metrics = handle(async (req, res) => {
  const dueBefore = addDays(today(), DUE_SOON_DAYS);

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
    Project.countDocuments(),
    Project.countDocuments({ status: "active" }),
    Cabinet.countDocuments(),
    Asset.countDocuments(),
    Asset.countDocuments({ status: "in_service" }),
    Ticket.countDocuments({ status: { $in: OPEN_TICKET_STATUSES } }),
    Ticket.countDocuments({ status: { $in: OPEN_TICKET_STATUSES }, priority: { $in: HIGH_PRIORITIES } }),
    Maintenance.countDocuments(),
    Maintenance.countDocuments({ nextDate: { $lte: dueBefore } }),
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
