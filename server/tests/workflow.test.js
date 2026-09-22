// Test d'intégration du cycle complet, contre une base MongoDB éphémère (supprimée à la fin).
// Les données sont fabriquées avec les VRAIS moteurs du client (client/src/domain) : le test vérifie donc aussi
// que les formes de données produites par le client sont acceptées par les modèles du serveur.
//
// Lancer avec : npm test   (nécessite un MongoDB local ; MONGO_TEST_URI pour en cibler un autre)

const assert = require("node:assert/strict");
const path = require("node:path");
const { after, before, describe, it } = require("node:test");
const { pathToFileURL } = require("node:url");
const mongoose = require("mongoose");
const { app } = require("../server");

const DOMAIN = path.join(__dirname, "..", "..", "client", "src", "domain");
const load = (file) => import(pathToFileURL(path.join(DOMAIN, file)).href);

const DB_URI = `${process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/elec-project-test"}-${process.pid}`;
let server;
let base;
let engines;

async function call(method, url, body) {
  const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.init()));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const [calculation, balance, mainFeeder, bom, quotation] = await Promise.all([
    load("calculation/index.js"),
    load("balance/index.js"),
    load("mainFeeder/index.js"),
    load("bom/index.js"),
    load("quotation/index.js"),
  ]);
  engines = { calculation, balance, mainFeeder, bom, quotation };
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe("cycle complet Projet → … → Historique", () => {
  const ctx = {};

  it("projet, armoire, départs, calculs (avec événements d'historique)", async () => {
    const project = await call("POST", "/projects", { name: "Extension atelier de production", reference: "PROJ-2026-001", client: "ABC Industrie", installationSite: "Usine Tunis", siteAddress: "Ben Arous, Tunis", status: "active" });
    assert.equal(project.status, 201);
    ctx.projectId = project.body._id;
    const cabinet = await call("POST", "/cabinets", { projectId: ctx.projectId, reference: "AR-01", powerSupplyPoint: "TGBT-01", distanceToTGBT: 25, neutralSystem: "TN-S" });
    assert.equal(cabinet.status, 201);
    ctx.cabinet = cabinet.body;

    const defs = [
      { reference: "D01", designation: "Pompe de circulation", loadType: "Moteur", power: 15, powerUnit: "kW", voltage: 400, cableLength: 25 },
      { reference: "D02", designation: "Ventilateur industriel", loadType: "Moteur", power: 7.5, powerUnit: "kW", voltage: 400, cableLength: 35 },
      { reference: "D03", designation: "Éclairage atelier", loadType: "Éclairage", power: 5, powerUnit: "kW", voltage: 400, cableLength: 40 },
    ];
    ctx.feeders = [];
    for (const definition of defs) ctx.feeders.push((await call("POST", "/feeders", { ...definition, cabinetId: ctx.cabinet._id })).body);

    const { buildDefaultInputs, calculateFeeder } = engines.calculation;
    for (const feeder of ctx.feeders) {
      const outcome = calculateFeeder(buildDefaultInputs({ cabinet: ctx.cabinet, feeder }));
      const saved = await call("PUT", `/feeders/${feeder._id}/calculation`, { inputs: outcome.inputs, result: outcome.result });
      assert.equal(saved.status, 200, JSON.stringify(saved.body));
    }
    // Ré-enregistrer un calcul ne duplique pas son événement d'historique.
    const again = calculateFeeder(buildDefaultInputs({ cabinet: ctx.cabinet, feeder: ctx.feeders[0] }));
    await call("PUT", `/feeders/${ctx.feeders[0]._id}/calculation`, { inputs: again.inputs, result: again.result });
    const history = await call("GET", `/projects/${ctx.projectId}/history`);
    assert.equal(history.body.events.filter((event) => event.type === "feeder_calculated").length, 3);
    assert.deepEqual(history.body.events.slice(0, 2).map((event) => event.type), ["project_created", "cabinet_created"]);
  });

  it("l'historique n'est pas modifiable depuis l'API", async () => {
    assert.equal((await call("POST", "/history-events", { title: "faux" })).status, 404);
    assert.equal((await call("POST", "/assets", { assetId: "X" })).status, 404);
  });

  it("aperçu du projet avant le bilan : calculs terminés, bilan absent", async () => {
    const { body } = await call("GET", `/projects/${ctx.projectId}/overview`);
    assert.equal(body.feeders.length, 3);
    assert.ok(body.feeders.every((feeder) => feeder.status === "calculated"));
    assert.equal(body.balance, null);
    assert.equal(body.asset, null);
  });

  it("bilan de puissance : enregistrement et relecture", async () => {
    ctx.calculations = (await call("GET", `/cabinets/${ctx.cabinet._id}/calculations`)).body;
    ctx.balance = engines.balance.computeBalance({ feeders: ctx.feeders, calculations: ctx.calculations });
    assert.equal(ctx.balance.ready, true);
    const payload = engines.balance.toBalancePayload(ctx.balance, { simultaneityFactor: 1 });
    const saved = await call("PUT", `/cabinets/${ctx.cabinet._id}/power-balance`, payload);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    ctx.balanceDoc = saved.body;
    const read = await call("GET", `/cabinets/${ctx.cabinet._id}/power-balance`);
    assert.ok(Math.abs(read.body.result.installedPowerKw - 27.5) < 1e-9);
    assert.equal(read.body.status, "validated");
    assert.equal((await call("PUT", `/cabinets/${ctx.cabinet._id}/power-balance`, { ...payload, parameters: { simultaneityFactor: 3, utilizationFactors: [] } })).status, 400);
  });

  it("départ général", async () => {
    const { buildDefaultMainFeederInputs, calculateMainFeeder, toMainFeederPayload } = engines.mainFeeder;
    const inputs = { ...buildDefaultMainFeederInputs({ cabinet: ctx.cabinet, balanceTotals: ctx.balance.totals, calculations: ctx.calculations }), rating: 63 };
    const outcome = calculateMainFeeder(inputs, ctx.balance.totals);
    assert.equal(outcome.result.globalStatus, "compliant");
    // basedOn du départ général = date de mise à jour du bilan enregistré (permet de détecter un bilan modifié depuis).
    const payload = toMainFeederPayload(outcome, ctx.balanceDoc.updatedAt);
    const saved = await call("PUT", `/cabinets/${ctx.cabinet._id}/main-feeder`, payload);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    ctx.mainFeeder = saved.body;
    assert.equal((await call("GET", `/cabinets/${ctx.cabinet._id}/main-feeder`)).body.result.section, 16);
  });

  it("nomenclature : génération, enregistrement, totaux calculés par le modèle", async () => {
    const { lines } = engines.bom.generateBom({ feeders: ctx.feeders, calculations: ctx.calculations, mainFeeder: ctx.mainFeeder });
    const saved = await call("PUT", `/cabinets/${ctx.cabinet._id}/bom`, { items: engines.bom.toBomPayload(lines) });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    ctx.bom = (await call("GET", `/cabinets/${ctx.cabinet._id}/bom`)).body;
    assert.equal(ctx.bom.length, lines.length);
    assert.ok(Math.abs(ctx.bom.reduce((sum, item) => sum + item.totalPrice, 0) - engines.bom.bomTotal(lines)) < 0.005);
    // Une ligne invalide est refusée sans détruire l'existant.
    const bad = await call("PUT", `/cabinets/${ctx.cabinet._id}/bom`, { items: [{ reference: "X", designation: "Y", category: "Inconnue", quantity: 1, unitPrice: 1 }] });
    assert.equal(bad.status, 400);
    assert.equal((await call("GET", `/cabinets/${ctx.cabinet._id}/bom`)).body.length, lines.length);
  });

  it("devis : référence séquentielle, totaux recalculés par le serveur (les totaux du client sont ignorés)", async () => {
    const next = await call("GET", "/quotations/next-reference");
    assert.match(next.body.reference, /^DEV-\d{4}-001$/);
    const quoteLines = engines.quotation.linesFromBom(ctx.bom);
    const payload = { date: "2026-10-01", validityDays: 30, discountPercent: 5, vatPercent: 19, lines: quoteLines, totalTTC: 1, totalHT: 1 };
    const saved = await call("PUT", `/cabinets/${ctx.cabinet._id}/quotation`, payload);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    const expected = engines.quotation.computeQuotationTotals(quoteLines, 5, 19);
    assert.equal(saved.body.totalTTC, expected.totalTTC);
    assert.equal(saved.body.totalHT, expected.totalHT);
    assert.equal(saved.body.reference, next.body.reference);
    assert.equal(saved.body.validUntil.slice(0, 10), "2026-10-31");
    assert.equal(saved.body.status, "saved");
    const generated = await call("PUT", `/cabinets/${ctx.cabinet._id}/quotation`, { ...payload, reference: saved.body.reference, status: "generated" });
    assert.equal(generated.body.status, "generated");
    assert.ok(generated.body.generatedAt);
    assert.equal(generated.body.reference, saved.body.reference);
    assert.equal((await call("PUT", `/cabinets/${ctx.cabinet._id}/quotation`, { ...payload, lines: [] })).status, 400);
    assert.equal((await call("GET", "/quotations/next-reference")).body.reference, "DEV-2026-002".replace("2026", String(new Date().getUTCFullYear())));
  });

  it("installation : planifiée sans actif ; terminée -> actif créé une seule fois avec garantie dérivée de la date", async () => {
    const planned = await call("PUT", `/cabinets/${ctx.cabinet._id}/installation`, { installationDate: "2026-10-15", team: "Équipe installation A", status: "planned" });
    assert.equal(planned.status, 200);
    assert.equal(planned.body.asset, null);
    assert.equal((await call("GET", `/projects/${ctx.projectId}/overview`)).body.asset, null);

    const done = await call("PUT", `/cabinets/${ctx.cabinet._id}/installation`, { installationDate: "2026-10-15", team: "Équipe installation A", status: "completed", comment: "Installation et raccordement terminés." });
    assert.equal(done.status, 200, JSON.stringify(done.body));
    assert.equal(done.body.assetCreated, true);
    ctx.asset = done.body.asset;
    assert.equal(ctx.asset.assetId, "ACT-2026-001");
    assert.equal(ctx.asset.serialNumber, "AR-01-2026-001");
    assert.equal(ctx.asset.status, "in_service");
    assert.equal(ctx.asset.installationDate.slice(0, 10), "2026-10-15");
    assert.equal(ctx.asset.warranty.start.slice(0, 10), "2026-10-15");
    assert.equal(ctx.asset.warranty.partsEnd.slice(0, 10), "2028-10-15");
    assert.equal(ctx.asset.warranty.laborEnd.slice(0, 10), "2027-10-15");

    const again = await call("PUT", `/cabinets/${ctx.cabinet._id}/installation`, { installationDate: "2026-10-15", team: "Équipe installation A", status: "completed" });
    assert.equal(again.body.assetCreated, false);
    assert.equal(again.body.asset.assetId, "ACT-2026-001");
    assert.equal((await call("PUT", `/cabinets/${ctx.cabinet._id}/installation`, { installationDate: "2026-10-15", team: "A", status: "planned" })).status, 409);
    assert.equal((await call("PUT", `/cabinets/${ctx.cabinet._id}/installation`, { team: "A", status: "planned" })).status, 400);
  });

  it("actif : détails liés (projet, client, site, armoire) sans duplication ; garantie modifiable et cohérente", async () => {
    const { status, body } = await call("GET", "/assets/ACT-2026-001");
    assert.equal(status, 200);
    assert.equal(body.project.client, "ABC Industrie");
    assert.equal(body.project.installationSite, "Usine Tunis");
    assert.equal(body.cabinet.reference, "AR-01");
    assert.equal(body.openTickets, 0);
    assert.equal(body.lastMaintenance, null);
    assert.equal((await call("GET", "/assets/ACT-9999-999")).status, 404);
    assert.equal((await call("GET", "/assets")).body.length, 1);

    assert.equal((await call("PATCH", "/assets/ACT-2026-001", { warranty: { partsEnd: "2026-01-01" } })).status, 400);
    const updated = await call("PATCH", "/assets/ACT-2026-001", { warranty: { partsEnd: "2029-10-15" } });
    assert.equal(updated.body.warranty.partsEnd.slice(0, 10), "2029-10-15");
    assert.equal(updated.body.warranty.start.slice(0, 10), "2026-10-15", "le début de garantie reste lié à l'installation");
  });

  it("maintenance préventive : prochaine date calculée depuis l'installation puis la dernière intervention", async () => {
    const early = await call("POST", "/assets/ACT-2026-001/interventions", { date: "2027-04-15", technician: "T1", result: "ok" });
    assert.equal(early.status, 409);
    const plan = await call("PUT", "/assets/ACT-2026-001/maintenance-plan", { frequencyMonths: 6, technician: "Technicien 1" });
    assert.equal(plan.status, 200, JSON.stringify(plan.body));
    assert.equal(plan.body.nextDate.slice(0, 10), "2027-04-15");
    assert.equal((await call("PUT", "/assets/ACT-2026-001/maintenance-plan", { frequencyMonths: 5, technician: "T" })).status, 400);

    const done = await call("POST", "/assets/ACT-2026-001/interventions", { date: "2027-04-20", type: "preventive", technician: "Technicien 1", result: "ok", observations: "RAS" });
    assert.equal(done.status, 201, JSON.stringify(done.body));
    assert.equal(done.body.nextDate.slice(0, 10), "2027-10-20");
    assert.equal(done.body.interventions.length, 1);
    const asset = (await call("GET", "/assets/ACT-2026-001")).body;
    assert.equal(asset.lastMaintenance.slice(0, 10), "2027-04-20");
    assert.equal(asset.nextMaintenance.slice(0, 10), "2027-10-20");
  });

  it("tickets : règles de statut, résolution, réparation et changement de composant dans l'historique", async () => {
    const noTech = await call("POST", "/assets/ACT-2026-001/tickets", { title: "Surchauffe armoire", description: "Température élevée", priority: "high", status: "assigned" });
    assert.equal(noTech.status, 400);
    const created = await call("POST", "/assets/ACT-2026-001/tickets", { title: "Surchauffe armoire", description: "Température élevée détectée dans l'armoire.", priority: "high" });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.match(created.body.number, /^TKT-\d{4}-001$/);
    assert.equal(created.body.status, "reported");
    assert.equal((await call("GET", "/assets/ACT-2026-001")).body.openTickets, 1);

    const id = created.body._id;
    assert.equal((await call("PATCH", `/tickets/${id}`, { status: "assigned" })).status, 400, "technicien requis");
    assert.equal((await call("PATCH", `/tickets/${id}`, { status: "assigned", technician: "Technicien 2" })).body.status, "assigned");
    assert.equal((await call("PATCH", `/tickets/${id}`, { status: "resolved" })).status, 400, "action requise");
    const resolved = await call("PATCH", `/tickets/${id}`, { status: "resolved", resolution: { action: "Remplacement du ventilateur", partsUsed: "Ventilateur 230 V", comment: "Température revenue à la normale" } });
    assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
    assert.ok(resolved.body.resolution.resolvedAt, "date de résolution renseignée automatiquement");
    assert.equal((await call("GET", "/assets/ACT-2026-001")).body.openTickets, 0);
    assert.equal((await call("GET", "/assets/ACT-2026-001/tickets")).body.length, 1);
    assert.equal((await call("GET", "/tickets?status=resolved")).body[0].asset.assetId, "ACT-2026-001");
  });

  it("historique : chronologique, alimenté automatiquement, sans doublon, avec la prochaine maintenance planifiée", async () => {
    const { body } = await call("GET", `/projects/${ctx.projectId}/history`);
    const types = body.events.map((event) => event.type);
    for (const type of ["project_created", "cabinet_created", "feeder_calculated", "power_balance", "main_feeder", "bom", "quotation", "installation", "asset_created", "maintenance", "ticket", "repair", "component_change"]) {
      assert.ok(types.includes(type), `événement ${type} manquant`);
    }
    const dates = body.events.map((event) => new Date(event.date).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => a - b), "ordre chronologique");
    assert.equal(new Set(body.events.map((event) => event.key)).size, body.events.length, "un événement par entité");
    const installation = body.events.find((event) => event.type === "installation");
    assert.equal(installation.status, "completed");
    assert.equal(installation.date.slice(0, 10), "2026-10-15");
    const planned = body.events.filter((event) => event.status === "planned");
    assert.equal(planned.length, 1);
    assert.equal(planned[0].derived, true);
    assert.equal(planned[0].date.slice(0, 10), "2027-10-20");
    assert.equal(body.asset.assetId, "ACT-2026-001");
    assert.equal(body.events.filter((event) => event.type === "maintenance" && !event.derived).length, 1);
  });

  it("aperçu final : tout est renseigné ; recalculer un départ rend le bilan obsolète", async () => {
    let { body } = await call("GET", `/projects/${ctx.projectId}/overview`);
    assert.equal(body.balance.stale, false);
    assert.equal(body.mainFeeder.stale, false);
    assert.equal(body.quotation.status, "generated");
    assert.equal(body.installation.status, "completed");
    assert.equal(body.asset.assetId, "ACT-2026-001");
    assert.equal(body.maintenance.frequencyMonths, 6);
    assert.equal(body.tickets.total, 1);

    await new Promise((resolve) => setTimeout(resolve, 15));
    const outcome = engines.calculation.calculateFeeder(engines.calculation.buildDefaultInputs({ cabinet: ctx.cabinet, feeder: ctx.feeders[1] }));
    await call("PUT", `/feeders/${ctx.feeders[1]._id}/calculation`, { inputs: outcome.inputs, result: outcome.result });
    ({ body } = await call("GET", `/projects/${ctx.projectId}/overview`));
    assert.equal(body.balance.stale, true, "le bilan doit être recalculé");
    assert.equal(body.bom.stale, true, "la nomenclature doit être régénérée");
  });

  it("suppression d'un départ : calcul et événement supprimés", async () => {
    await call("DELETE", `/feeders/${ctx.feeders[2]._id}`);
    const { body } = await call("GET", `/projects/${ctx.projectId}/history`);
    assert.equal(body.events.filter((event) => event.type === "feeder_calculated").length, 2);
    assert.equal((await call("GET", `/cabinets/${ctx.cabinet._id}/calculations`)).body.length, 2);
  });

  it("identifiants invalides -> 400 ; ressources absentes -> 204 / 404", async () => {
    assert.equal((await call("GET", "/projects/abc/overview")).status, 400);
    assert.equal((await call("GET", "/cabinets/abc/bom")).status, 400);
    assert.equal((await call("PATCH", "/tickets/abc", { status: "closed" })).status, 400);
    const other = await call("POST", "/projects", { name: "Autre", reference: "PROJ-2026-002", client: "X", installationSite: "Y" });
    const cabinet = await call("POST", "/cabinets", { projectId: other.body._id, reference: "AR-09" });
    assert.equal((await call("GET", `/cabinets/${cabinet.body._id}/power-balance`)).status, 204);
    assert.equal((await call("GET", `/cabinets/${cabinet.body._id}/installation`)).status, 204);
    assert.equal((await call("GET", `/cabinets/${cabinet.body._id}/quotation`)).status, 204);
  });
});
