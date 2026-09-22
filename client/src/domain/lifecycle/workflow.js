// Progression du cycle complet d'un projet, calculée à partir de la vue agrégée `GET /api/projects/:id/overview`.
//
//   Projet → Armoire → Départs → Calculs → Bilan → Départ général → Nomenclature → Devis
//   → Installation → Actif → Garantie → QR Code → Maintenance → Tickets → Historique
//
// Statuts : not_started (peut démarrer), in_progress, done, blocked (une étape précédente doit être terminée).
// `issue: true` signale une non-conformité ou une donnée obsolète sur une étape commencée.

export const STEP_LABELS = {
  project: "Projet",
  cabinet: "Armoire",
  feeders: "Départs",
  calculations: "Calculs des départs",
  balance: "Bilan de puissance",
  mainFeeder: "Départ général",
  bom: "Nomenclature",
  quotation: "Devis",
  installation: "Installation",
  asset: "Actif",
  warranty: "Garantie",
  qr: "QR Code",
  maintenance: "Maintenance",
  tickets: "Tickets",
  history: "Historique",
};

export const STEP_ICONS = {
  project: "assignment",
  cabinet: "developer_board",
  feeders: "account_tree",
  calculations: "calculate",
  balance: "analytics",
  mainFeeder: "electrical_services",
  bom: "list_alt",
  quotation: "request_quote",
  installation: "construction",
  asset: "inventory_2",
  warranty: "verified_user",
  qr: "qr_code_2",
  maintenance: "build",
  tickets: "confirmation_number",
  history: "history",
};

export const STEP_ORDER = Object.keys(STEP_LABELS);

const STATUS = { NOT_STARTED: "not_started", IN_PROGRESS: "in_progress", DONE: "done", BLOCKED: "blocked" };
export const STEP_STATUS = STATUS;

export function stepPaths(overview) {
  const projectId = overview.project?._id;
  const cabinetId = overview.cabinet?._id;
  const base = projectId && cabinetId ? `/projects/${projectId}/cabinets/${cabinetId}` : null;
  const assetId = overview.asset?.assetId;
  return {
    project: projectId ? `/projects/${projectId}` : null,
    cabinet: projectId ? `/projects/${projectId}/cabinet` : null,
    feeders: base && `${base}/feeders`,
    calculations: base && `${base}/feeders`,
    balance: base && `${base}/balance`,
    mainFeeder: base && `${base}/main-feeder`,
    bom: base && `${base}/bom`,
    quotation: base && `${base}/quotation`,
    installation: base && `${base}/installation`,
    asset: assetId ? `/assets/${assetId}` : null,
    warranty: assetId ? `/assets/${assetId}#garantie` : null,
    qr: assetId ? `/assets/${assetId}#qr` : null,
    maintenance: assetId ? `/assets/${assetId}/maintenance` : null,
    tickets: assetId ? `/assets/${assetId}/tickets` : null,
    history: projectId ? `/projects/${projectId}/history` : null,
  };
}

// Retourne { steps: [{ key, label, icon, status, reason, issue, path }], next } où `next` est la première étape non terminée.
export function computeWorkflow(overview) {
  const { cabinet } = overview;
  const feeders = overview.feeders ?? [];
  const calculated = feeders.filter((feeder) => feeder.status !== "draft");
  const nonCompliantFeeders = feeders.filter((feeder) => feeder.status === "non_compliant").length;
  const { balance, mainFeeder, bom, quotation, installation, asset, maintenance, tickets } = overview;

  const steps = {};
  const set = (key, status, extra = {}) => {
    steps[key] = { status, reason: "", issue: false, ...extra };
  };
  const requires = (key, ok, needed) => {
    if (ok) return false;
    set(key, STATUS.BLOCKED, { reason: `Terminez d'abord : ${STEP_LABELS[needed]}` });
    return true;
  };
  const doneOrBlocked = (key) => steps[key]?.status === STATUS.DONE;

  set("project", STATUS.DONE);
  set("cabinet", cabinet ? STATUS.DONE : STATUS.NOT_STARTED);

  if (!requires("feeders", Boolean(cabinet), "cabinet")) {
    set("feeders", feeders.length > 0 ? STATUS.DONE : STATUS.NOT_STARTED);
  }

  if (!requires("calculations", feeders.length > 0, "feeders")) {
    if (calculated.length === feeders.length) set("calculations", STATUS.DONE, { issue: nonCompliantFeeders > 0, reason: nonCompliantFeeders > 0 ? `${nonCompliantFeeders} départ(s) non conforme(s)` : "" });
    else if (calculated.length > 0) set("calculations", STATUS.IN_PROGRESS, { reason: `${calculated.length} / ${feeders.length} départs calculés` });
    else set("calculations", STATUS.NOT_STARTED);
  }

  if (!requires("balance", doneOrBlocked("calculations"), "calculations")) {
    if (!balance) set("balance", STATUS.NOT_STARTED);
    else if (balance.stale) set("balance", STATUS.IN_PROGRESS, { issue: true, reason: "Obsolète : un départ a été recalculé" });
    else if (balance.status === "validated") set("balance", STATUS.DONE);
    else set("balance", STATUS.IN_PROGRESS, { issue: true, reason: "Bilan à vérifier (départs non conformes)" });
  }

  if (!requires("mainFeeder", Boolean(balance) && !balance.stale && balance.status === "validated", "balance")) {
    if (!mainFeeder) set("mainFeeder", STATUS.NOT_STARTED);
    else if (mainFeeder.stale) set("mainFeeder", STATUS.IN_PROGRESS, { issue: true, reason: "Obsolète : le bilan a changé" });
    else if (mainFeeder.status === "compliant") set("mainFeeder", STATUS.DONE);
    else set("mainFeeder", STATUS.IN_PROGRESS, { issue: true, reason: "Départ général non conforme" });
  }

  if (!requires("bom", doneOrBlocked("mainFeeder"), "mainFeeder")) {
    if (!bom || bom.count === 0) set("bom", STATUS.NOT_STARTED);
    else if (bom.stale) set("bom", STATUS.IN_PROGRESS, { issue: true, reason: "À régénérer : les calculs ont changé" });
    else if (bom.missingPrices > 0) set("bom", STATUS.IN_PROGRESS, { issue: true, reason: `${bom.missingPrices} prix à renseigner` });
    else set("bom", STATUS.DONE);
  }

  if (!requires("quotation", doneOrBlocked("bom"), "bom")) {
    if (!quotation) set("quotation", STATUS.NOT_STARTED);
    else if (quotation.stale) set("quotation", STATUS.IN_PROGRESS, { issue: true, reason: "Obsolète : la nomenclature a changé" });
    else if (quotation.status === "generated") set("quotation", STATUS.DONE);
    else set("quotation", STATUS.IN_PROGRESS, { reason: "Devis enregistré, à générer" });
  }

  // L'installation peut démarrer dès qu'un devis existe (enregistré ou généré).
  if (!requires("installation", Boolean(quotation), "quotation")) {
    if (!installation) set("installation", STATUS.NOT_STARTED);
    else if (installation.status === "completed") set("installation", STATUS.DONE);
    else set("installation", STATUS.IN_PROGRESS);
  }

  for (const key of ["asset", "warranty", "qr"]) {
    if (!requires(key, Boolean(asset), "installation")) set(key, STATUS.DONE);
  }
  if (!requires("maintenance", Boolean(asset), "asset")) {
    set("maintenance", maintenance ? STATUS.DONE : STATUS.NOT_STARTED, { reason: maintenance ? "" : "Aucun plan préventif défini" });
  }
  if (!requires("tickets", Boolean(asset), "asset")) {
    if (!tickets || tickets.total === 0) set("tickets", STATUS.NOT_STARTED, { reason: "Aucun ticket" });
    else if (tickets.open > 0) set("tickets", STATUS.IN_PROGRESS, { reason: `${tickets.open} ticket(s) ouvert(s)` });
    else set("tickets", STATUS.DONE);
  }

  set("history", asset ? STATUS.DONE : STATUS.IN_PROGRESS, { reason: "Alimenté automatiquement par le système" });

  const paths = stepPaths(overview);
  const list = STEP_ORDER.map((key) => ({ key, label: STEP_LABELS[key], icon: STEP_ICONS[key], path: paths[key], ...steps[key] }));
  const flow = list.filter((step) => step.key !== "history");
  const next = flow.find((step) => step.status !== STATUS.DONE && step.status !== STATUS.BLOCKED) ?? null;
  return { steps: list, next };
}
