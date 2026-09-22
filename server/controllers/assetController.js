const { Asset, Cabinet, Maintenance, Project, Ticket } = require("../models");
const { recordEvent } = require("../services/historyService");
const { formatId, nextSequence } = require("../services/sequenceService");
const { addMonths } = require("../utils/dates");
const { HttpError, handle, isValidId, pick } = require("../utils/http");

const OPEN_TICKET_STATUSES = ["reported", "assigned", "in_progress"];

// L'actif est identifié dans les URL par son identifiant métier (ACT-2026-001), pas par l'_id MongoDB.
async function findAsset(assetId) {
  const asset = await Asset.findOne({ assetId });
  if (!asset) throw new HttpError(404, `Actif ${assetId} introuvable`);
  return asset;
}

const lastInterventionDate = (plan) =>
  plan?.interventions?.length ? new Date(Math.max(...plan.interventions.map((item) => new Date(item.date).getTime()))) : null;

// ---------- Actifs (lecture enrichie : le QR code ne crée aucune donnée) ----------

async function describeAssets(assets) {
  const ids = assets.map((asset) => asset._id);
  const [projects, cabinets, plans, tickets] = await Promise.all([
    Project.find({ _id: { $in: assets.map((asset) => asset.projectId) } }),
    Cabinet.find({ _id: { $in: assets.map((asset) => asset.cabinetId) } }),
    Maintenance.find({ assetId: { $in: ids } }),
    Ticket.find({ assetId: { $in: ids } }),
  ]);
  const byId = (docs) => new Map(docs.map((doc) => [String(doc._id), doc]));
  const projectMap = byId(projects);
  const cabinetMap = byId(cabinets);

  return assets.map((asset) => {
    const plan = plans.find((item) => String(item.assetId) === String(asset._id));
    const assetTickets = tickets.filter((ticket) => String(ticket.assetId) === String(asset._id));
    return {
      ...asset.toObject(),
      project: projectMap.get(String(asset.projectId)) ?? null,
      cabinet: cabinetMap.get(String(asset.cabinetId)) ?? null,
      lastMaintenance: lastInterventionDate(plan),
      nextMaintenance: plan?.nextDate ?? null,
      ticketsTotal: assetTickets.length,
      openTickets: assetTickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).length,
    };
  });
}

const listAssets = handle(async (req, res) => {
  const assets = await Asset.find().sort({ createdAt: -1 });
  res.json(await describeAssets(assets));
});

const getAsset = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const [details] = await describeAssets([asset]);
  res.json(details);
});

// Garantie et statut : le début de garantie suit la date d'installation et n'est pas modifiable.
const updateAsset = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const { status, warranty } = req.body ?? {};
  if (status) asset.status = status;
  if (warranty?.partsEnd) asset.warranty.partsEnd = new Date(warranty.partsEnd);
  if (warranty?.laborEnd) asset.warranty.laborEnd = new Date(warranty.laborEnd);
  if (asset.warranty.partsEnd < asset.warranty.start || asset.warranty.laborEnd < asset.warranty.start) {
    throw new HttpError(400, "Les fins de garantie ne peuvent pas précéder le début de garantie");
  }
  await asset.save();
  res.json(asset);
});

// ---------- Maintenance préventive ----------

const getMaintenance = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const plan = await Maintenance.findOne({ assetId: asset._id });
  if (!plan) return res.status(204).send();
  res.json(plan);
});

// Définit ou modifie le plan. Prochaine date = dernière intervention (sinon date d'installation) + fréquence.
const putMaintenancePlan = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const { frequencyMonths, technician } = req.body ?? {};
  const existing = await Maintenance.findOne({ assetId: asset._id });
  const baseDate = lastInterventionDate(existing) ?? asset.installationDate;

  const plan = await Maintenance.findOneAndUpdate(
    { assetId: asset._id },
    {
      assetId: asset._id,
      projectId: asset.projectId,
      frequencyMonths: Number(frequencyMonths),
      technician,
      baseDate,
      nextDate: addMonths(baseDate, Number(frequencyMonths)),
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json(plan);
});

const INTERVENTION_LABELS = { preventive: "Maintenance préventive", corrective: "Maintenance corrective", inspection: "Contrôle" };

const addIntervention = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const plan = await Maintenance.findOne({ assetId: asset._id });
  if (!plan) throw new HttpError(409, "Définissez d'abord le plan de maintenance préventive de cet actif");

  plan.interventions.push(pick(req.body, ["date", "type", "technician", "result", "observations"]));
  const intervention = plan.interventions[plan.interventions.length - 1];
  const baseDate = lastInterventionDate(plan);
  plan.baseDate = baseDate;
  plan.nextDate = addMonths(baseDate, plan.frequencyMonths);
  await plan.save();

  await recordEvent({
    projectId: asset.projectId,
    cabinetId: asset.cabinetId,
    assetId: asset._id,
    key: `intervention:${intervention._id}`,
    type: "maintenance",
    title: INTERVENTION_LABELS[intervention.type] ?? "Maintenance",
    status: "completed",
    date: intervention.date,
  });
  res.status(201).json(plan);
});

const listMaintenancePlans = handle(async (req, res) => {
  const plans = await Maintenance.find().sort({ nextDate: 1 });
  const assets = await Asset.find({ _id: { $in: plans.map((plan) => plan.assetId) } });
  const assetMap = new Map(assets.map((asset) => [String(asset._id), asset]));
  res.json(plans.map((plan) => ({ ...plan.toObject(), asset: assetMap.get(String(plan.assetId)) ?? null })));
});

// ---------- Tickets (maintenance corrective) ----------

const TICKET_FIELDS = ["title", "description", "priority", "reportedAt", "technician", "status", "resolution"];

function checkTicketRules(ticket) {
  if (["assigned", "in_progress"].includes(ticket.status) && !ticket.technician?.trim()) {
    throw new HttpError(400, "Un technicien doit être assigné pour ce statut");
  }
  if (["resolved", "closed"].includes(ticket.status)) {
    if (!ticket.resolution?.action?.trim()) throw new HttpError(400, "Renseignez l'action réalisée pour résoudre le ticket");
    ticket.resolution.resolvedAt = ticket.resolution.resolvedAt ?? new Date();
  }
}

async function recordTicketEvents(ticket, asset) {
  const base = { projectId: asset.projectId, cabinetId: asset.cabinetId, assetId: asset._id };
  await recordEvent({ ...base, key: `ticket:${ticket._id}`, type: "ticket", title: ticket.title, status: ticket.status, date: ticket.reportedAt });
  if (["resolved", "closed"].includes(ticket.status)) {
    await recordEvent({
      ...base,
      key: `repair:${ticket._id}`,
      type: "repair",
      title: `Réparation : ${ticket.title}`,
      status: "completed",
      date: ticket.resolution.resolvedAt,
    });
    if (ticket.resolution.partsUsed?.trim()) {
      await recordEvent({
        ...base,
        key: `component-change:${ticket._id}`,
        type: "component_change",
        title: `Changement de composant : ${ticket.resolution.partsUsed.trim()}`,
        status: "completed",
        date: ticket.resolution.resolvedAt,
      });
    }
  }
}

async function describeTickets(tickets) {
  const assets = await Asset.find({ _id: { $in: tickets.map((ticket) => ticket.assetId) } });
  const assetMap = new Map(assets.map((asset) => [String(asset._id), asset]));
  return tickets.map((ticket) => ({ ...ticket.toObject(), asset: assetMap.get(String(ticket.assetId)) ?? null }));
}

const listAssetTickets = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  res.json(await describeTickets(await Ticket.find({ assetId: asset._id }).sort({ reportedAt: -1 })));
});

const listTickets = handle(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await describeTickets(await Ticket.find(filter).sort({ reportedAt: -1 })));
});

const createTicket = handle(async (req, res) => {
  const asset = await findAsset(req.params.assetId);
  const data = pick(req.body, TICKET_FIELDS);
  const ticket = new Ticket({ ...data, assetId: asset._id, projectId: asset.projectId, reportedAt: data.reportedAt ?? new Date() });
  checkTicketRules(ticket);
  const year = new Date(ticket.reportedAt).getUTCFullYear();
  ticket.number = formatId("TKT", year, await nextSequence(`ticket-${year}`));
  await ticket.save();
  await recordTicketEvents(ticket, asset);
  res.status(201).json(ticket);
});

const updateTicket = handle(async (req, res) => {
  if (!isValidId(req.params.id)) throw new HttpError(400, "Identifiant de ticket invalide");
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new HttpError(404, "Ticket introuvable");
  const data = pick(req.body, TICKET_FIELDS);
  const { resolution, ...rest } = data;
  ticket.set(rest);
  if (resolution) ticket.resolution = { ...(ticket.resolution?.toObject?.() ?? {}), ...resolution };
  checkTicketRules(ticket);
  await ticket.save();
  const asset = await Asset.findById(ticket.assetId);
  await recordTicketEvents(ticket, asset);
  res.json(ticket);
});

module.exports = {
  addIntervention,
  createTicket,
  getAsset,
  getMaintenance,
  listAssets,
  listAssetTickets,
  listMaintenancePlans,
  listTickets,
  putMaintenancePlan,
  updateAsset,
  updateTicket,
};
