const {
  Asset,
  BOMItem,
  Cabinet,
  CableCalculation,
  Feeder,
  HistoryEvent,
  Installation,
  Maintenance,
  MainFeeder,
  PowerBalance,
  Project,
  Quotation,
  Ticket,
} = require("../models");
const { HttpError, handle, isValidId } = require("../utils/http");

const time = (value) => (value ? new Date(value).getTime() : 0);
const OPEN_TICKET_STATUSES = ["reported", "assigned", "in_progress"];

async function findProject(projectId) {
  if (!isValidId(projectId)) throw new HttpError(400, "Identifiant de projet invalide");
  const project = await Project.findById(projectId);
  if (!project) throw new HttpError(404, "Projet introuvable");
  return project;
}

// Construit la partie « armoire + étapes » de la vue agrégée à partir de documents déjà chargés (un seul projet
// pour /overview, ou un lot entier pour /projects/summary). Les indicateurs `stale` signalent qu'une étape en
// amont a changé après l'enregistrement de l'étape en aval (ex. un départ recalculé après le bilan) : l'étape
// aval doit être mise à jour.
function buildCabinetOverview({ cabinet, feeders, calculations, balance, mainFeeder, bomItems, quotation, installation, asset, plan, tickets }) {
  const calculationsUpdatedAt = Math.max(0, ...calculations.map((calculation) => time(calculation.updatedAt)));
  const bomUpdatedAt = Math.max(0, ...bomItems.map((item) => time(item.updatedAt)));

  return {
    cabinet,
    feeders: feeders.map((feeder) => ({ _id: feeder._id, reference: feeder.reference, status: feeder.status })),
    balance: balance && {
      status: balance.status,
      updatedAt: balance.updatedAt,
      stale: calculationsUpdatedAt > time(balance.basedOn),
    },
    mainFeeder: mainFeeder && {
      status: mainFeeder.status,
      updatedAt: mainFeeder.updatedAt,
      stale: balance ? time(balance.updatedAt) > time(mainFeeder.basedOn) : false,
    },
    bom: {
      count: bomItems.length,
      updatedAt: bomItems.length ? new Date(bomUpdatedAt) : null,
      missingPrices: bomItems.filter((item) => item.priceMissing && !(item.unitPrice > 0)).length,
      stale: bomItems.length > 0 && Math.max(calculationsUpdatedAt, time(mainFeeder?.updatedAt)) > bomUpdatedAt,
    },
    quotation: quotation && {
      reference: quotation.reference,
      status: quotation.status,
      totalTTC: quotation.totalTTC,
      updatedAt: quotation.updatedAt,
      stale: bomUpdatedAt > time(quotation.updatedAt),
    },
    installation: installation && {
      status: installation.status,
      installationDate: installation.installationDate,
    },
    asset: asset && {
      assetId: asset.assetId,
      serialNumber: asset.serialNumber,
      status: asset.status,
      installationDate: asset.installationDate,
      warranty: asset.warranty,
    },
    maintenance: plan && {
      frequencyMonths: plan.frequencyMonths,
      nextDate: plan.nextDate,
      interventions: plan.interventions.length,
    },
    tickets: { total: tickets.length, open: tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).length },
  };
}

// Vue agrégée d'un projet : une seule requête alimente le stepper du workflow et la vue globale du projet.
const overview = handle(async (req, res) => {
  const project = await findProject(req.params.projectId);
  const cabinet = await Cabinet.findOne({ projectId: project._id }).sort({ createdAt: 1 });
  if (!cabinet) {
    return res.json({ project, cabinet: null, eventsCount: await HistoryEvent.countDocuments({ projectId: project._id }) });
  }

  const [feeders, calculations, balance, mainFeeder, bomItems, quotation, installation, asset] = await Promise.all([
    Feeder.find({ cabinetId: cabinet._id }).sort({ reference: 1 }),
    CableCalculation.find({ cabinetId: cabinet._id }),
    PowerBalance.findOne({ cabinetId: cabinet._id }),
    MainFeeder.findOne({ cabinetId: cabinet._id }),
    BOMItem.find({ cabinetId: cabinet._id }),
    Quotation.findOne({ cabinetId: cabinet._id }),
    Installation.findOne({ cabinetId: cabinet._id }),
    Asset.findOne({ cabinetId: cabinet._id }),
  ]);
  const [plan, tickets, eventsCount] = asset
    ? await Promise.all([Maintenance.findOne({ assetId: asset._id }), Ticket.find({ assetId: asset._id }), HistoryEvent.countDocuments({ projectId: project._id })])
    : [null, [], await HistoryEvent.countDocuments({ projectId: project._id })];

  res.json({
    project,
    eventsCount,
    ...buildCabinetOverview({ cabinet, feeders, calculations, balance, mainFeeder, bomItems, quotation, installation, asset, plan, tickets }),
  });
});

// Même agrégation que /projects/:projectId/overview, mais pour tous les projets en une poignée de requêtes
// (filtres `$in`) au lieu d'un aller-retour par projet : alimente les listes (page Projets, tableau de bord)
// sans déclencher un appel réseau par ligne.
const summaries = handle(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  const projectIds = projects.map((project) => project._id);
  if (projectIds.length === 0) return res.json([]);

  const cabinets = await Cabinet.find({ projectId: { $in: projectIds } }).sort({ createdAt: 1 });
  const cabinetByProject = new Map();
  for (const cabinet of cabinets) {
    const key = String(cabinet.projectId);
    if (!cabinetByProject.has(key)) cabinetByProject.set(key, cabinet); // la première armoire créée, comme /overview.
  }
  const cabinetIds = [...cabinetByProject.values()].map((cabinet) => cabinet._id);

  const [feeders, calculations, balances, mainFeeders, bomItems, quotations, installations, assets, eventCounts] = await Promise.all([
    Feeder.find({ cabinetId: { $in: cabinetIds } }).sort({ reference: 1 }),
    CableCalculation.find({ cabinetId: { $in: cabinetIds } }),
    PowerBalance.find({ cabinetId: { $in: cabinetIds } }),
    MainFeeder.find({ cabinetId: { $in: cabinetIds } }),
    BOMItem.find({ cabinetId: { $in: cabinetIds } }),
    Quotation.find({ cabinetId: { $in: cabinetIds } }),
    Installation.find({ cabinetId: { $in: cabinetIds } }),
    Asset.find({ cabinetId: { $in: cabinetIds } }),
    HistoryEvent.aggregate([{ $match: { projectId: { $in: projectIds } } }, { $group: { _id: "$projectId", count: { $sum: 1 } } }]),
  ]);

  const assetIds = assets.map((asset) => asset._id);
  const [plans, tickets] = await Promise.all([
    Maintenance.find({ assetId: { $in: assetIds } }),
    Ticket.find({ assetId: { $in: assetIds } }),
  ]);

  const groupBy = (docs, key) => {
    const map = new Map();
    for (const doc of docs) {
      const groupKey = String(doc[key]);
      if (!map.has(groupKey)) map.set(groupKey, []);
      map.get(groupKey).push(doc);
    }
    return map;
  };
  const oneBy = (docs, key) => new Map(docs.map((doc) => [String(doc[key]), doc]));

  const feedersByCabinet = groupBy(feeders, "cabinetId");
  const calculationsByCabinet = groupBy(calculations, "cabinetId");
  const bomByCabinet = groupBy(bomItems, "cabinetId");
  const ticketsByAsset = groupBy(tickets, "assetId");
  const balanceByCabinet = oneBy(balances, "cabinetId");
  const mainFeederByCabinet = oneBy(mainFeeders, "cabinetId");
  const quotationByCabinet = oneBy(quotations, "cabinetId");
  const installationByCabinet = oneBy(installations, "cabinetId");
  const assetByCabinet = oneBy(assets, "cabinetId");
  const planByAsset = oneBy(plans, "assetId");
  const eventCountByProject = new Map(eventCounts.map((entry) => [String(entry._id), entry.count]));

  res.json(
    projects.map((project) => {
      const projectKey = String(project._id);
      const eventsCount = eventCountByProject.get(projectKey) ?? 0;
      const cabinet = cabinetByProject.get(projectKey) ?? null;
      if (!cabinet) return { project, cabinet: null, eventsCount };

      const cabinetKey = String(cabinet._id);
      const asset = assetByCabinet.get(cabinetKey) ?? null;
      const assetKey = asset ? String(asset._id) : null;

      return {
        project,
        eventsCount,
        ...buildCabinetOverview({
          cabinet,
          feeders: feedersByCabinet.get(cabinetKey) ?? [],
          calculations: calculationsByCabinet.get(cabinetKey) ?? [],
          balance: balanceByCabinet.get(cabinetKey) ?? null,
          mainFeeder: mainFeederByCabinet.get(cabinetKey) ?? null,
          bomItems: bomByCabinet.get(cabinetKey) ?? [],
          quotation: quotationByCabinet.get(cabinetKey) ?? null,
          installation: installationByCabinet.get(cabinetKey) ?? null,
          asset,
          plan: assetKey ? planByAsset.get(assetKey) ?? null : null,
          tickets: assetKey ? ticketsByAsset.get(assetKey) ?? [] : [],
        }),
      };
    }),
  );
});

// Historique du projet puis de l'actif (chronologique). Les événements viennent du journal alimenté par le
// système ; la prochaine maintenance préventive est ajoutée comme événement « planifié » calculé à la volée.
const history = handle(async (req, res) => {
  const project = await findProject(req.params.projectId);
  const events = (await HistoryEvent.find({ projectId: project._id }).sort({ date: 1, createdAt: 1 })).map((event) => event.toObject());

  const asset = await Asset.findOne({ projectId: project._id });
  const plan = asset ? await Maintenance.findOne({ assetId: asset._id }) : null;
  if (plan) {
    events.push({
      _id: `planned-maintenance-${plan._id}`,
      key: "planned-maintenance",
      date: plan.nextDate,
      title: "Maintenance préventive",
      type: "maintenance",
      status: "planned",
      derived: true,
    });
  }
  events.sort((a, b) => time(a.date) - time(b.date));
  res.json({ project, asset: asset ? { assetId: asset.assetId } : null, events });
});

module.exports = { history, overview, summaries };
