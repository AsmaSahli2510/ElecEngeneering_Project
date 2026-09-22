// Tests des moteurs de la suite du workflow : bilan, départ général, nomenclature, devis, dates, progression.
// Lancer avec : npm test

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDefaultInputs, calculateFeeder } from "./calculation/index.js";
import { computeBalance, toBalancePayload } from "./balance/index.js";
import { buildDefaultMainFeederInputs, calculateMainFeeder, defaultVoltageDropLimit, toMainFeederPayload } from "./mainFeeder/index.js";
import { BOM_CATEGORIES, bomTotal, generateBom, lineTotal, mergeBom, toBomPayload } from "./bom/index.js";
import { computeQuotationTotals, validateQuotation } from "./quotation/index.js";
import { addDays, addMonths, daysBetween, dueState, formatDate, nextMaintenanceDate, warrantyStatus } from "./lifecycle/dates.js";
import { computeWorkflow } from "./lifecycle/workflow.js";
import { suggestRating } from "./protection.js";

const near = (actual, expected, tolerance, label = "") => assert.ok(Math.abs(actual - expected) <= tolerance, `${label} attendu ≈ ${expected}, obtenu ${actual}`);

// ---------- jeu de données : D01, D02, D03 calculés avec le moteur de calcul des départs ----------
const cabinet = { _id: "cab1", neutralSystem: "TN-S", distanceToTGBT: 25 };
const feeders = [
  { _id: "f1", reference: "D01", designation: "Pompe de circulation", loadType: "Moteur", power: 15, powerUnit: "kW", voltage: 400, cableLength: 25 },
  { _id: "f2", reference: "D02", designation: "Ventilateur industriel", loadType: "Moteur", power: 7.5, powerUnit: "kW", voltage: 400, cableLength: 35 },
  { _id: "f3", reference: "D03", designation: "Éclairage atelier", loadType: "Éclairage", power: 5, powerUnit: "kW", voltage: 400, cableLength: 40 },
];
const calculations = feeders.map((feeder) => {
  const outcome = calculateFeeder(buildDefaultInputs({ cabinet, feeder }));
  return { feederId: feeder._id, inputs: outcome.inputs, result: outcome.result, status: outcome.result.globalStatus, updatedAt: "2026-09-20T10:00:00.000Z" };
});

describe("bilan de puissance", () => {
  const balance = computeBalance({ feeders, calculations });

  it("Pinstallée = Σ Pi = 27,5 kW ; tension 400 V ; triphasé ; 3 départs", () => {
    assert.equal(balance.ready, true);
    near(balance.totals.installedPowerKw, 27.5, 1e-9);
    assert.equal(balance.totals.networkVoltage, 400);
    assert.equal(balance.totals.phases, "Triphasé");
    assert.equal(balance.totals.feederCount, 3);
  });

  it("avec Ks = Ku = 1 : Pdemandée = Pinstallée", () => {
    near(balance.totals.demandPowerKw, 27.5, 1e-9);
  });

  it("courant et cos φ globaux : somme vectorielle des puissances absorbées", () => {
    const rows = calculations.map((calc) => ({ p: calc.result.absorbedPowerKw, s: calc.result.apparentPowerKva }));
    const p = rows.reduce((sum, row) => sum + row.p, 0);
    const q = rows.reduce((sum, row) => sum + Math.sqrt(row.s ** 2 - row.p ** 2), 0);
    const s = Math.hypot(p, q);
    near(balance.totals.totalCurrent, (s * 1000) / (Math.sqrt(3) * 400), 1e-9);
    near(balance.totals.globalPowerFactor, p / s, 1e-9);
    near(balance.totals.totalCurrent, 49.8, 0.1, "courant total");
    near(balance.totals.globalPowerFactor, 0.87, 0.01, "cos φ global");
    assert.ok(balance.totals.totalCurrent < calculations.reduce((sum, calc) => sum + calc.result.designCurrent, 0), "la somme vectorielle est inférieure à la somme arithmétique des courants");
  });

  it("Ks et Ku configurables : Ku = 1 / 0,8 / 0,6 -> Pdemandée = 24,0 kW (exemple de l'énoncé)", () => {
    const configured = computeBalance({ feeders, calculations, parameters: { utilizationFactors: { f1: 1, f2: 0.8, f3: 0.6 } } });
    near(configured.totals.demandPowerKw, 24.0, 1e-9);
    near(configured.totals.installedPowerKw, 27.5, 1e-9);
  });

  it("Ks = 0,8 : puissance et courant proportionnels, cos φ inchangé", () => {
    const reduced = computeBalance({ feeders, calculations, parameters: { simultaneityFactor: 0.8 } });
    near(reduced.totals.demandPowerKw, 22, 1e-9);
    near(reduced.totals.totalCurrent, balance.totals.totalCurrent * 0.8, 1e-9);
    near(reduced.totals.globalPowerFactor, balance.totals.globalPowerFactor, 1e-9);
  });

  it("Ks ou Ku hors plage : bilan non prêt", () => {
    assert.equal(computeBalance({ feeders, calculations, parameters: { simultaneityFactor: 1.2 } }).ready, false);
    const bad = computeBalance({ feeders, calculations, parameters: { utilizationFactors: { f1: 2 } } });
    assert.ok(bad.errors.utilizationFactors.f1);
  });

  it("un départ non calculé rend le bilan incomplet et est listé", () => {
    const partial = computeBalance({ feeders, calculations: calculations.slice(0, 2) });
    assert.equal(partial.ready, false);
    assert.deepEqual(partial.missing, ["D03"]);
    assert.equal(partial.status, "incomplete");
    assert.equal(partial.totals, null);
  });

  it("un calcul non conforme donne un bilan « attention »", () => {
    const flagged = calculations.map((calc, index) => (index === 0 ? { ...calc, status: "non_compliant" } : calc));
    assert.equal(computeBalance({ feeders, calculations: flagged }).status, "attention");
    assert.equal(balance.status, "validated");
  });

  it("kVA et W : puissance nominale convertie en kW", () => {
    const kva = { ...calculations[0], inputs: { ...calculations[0].inputs, load: { ...calculations[0].inputs.load, power: 20, powerUnit: "kVA", powerFactor: 0.8 } } };
    near(computeBalance({ feeders: [feeders[0]], calculations: [kva] }).totals.installedPowerKw, 16, 1e-9);
  });

  it("payload d'enregistrement : totaux, lignes et date de référence", () => {
    const payload = toBalancePayload(balance, { simultaneityFactor: 1 });
    assert.equal(payload.lines.length, 3);
    assert.equal(payload.status, "validated");
    assert.equal(payload.basedOn, "2026-09-20T10:00:00.000Z");
    assert.equal(payload.parameters.utilizationFactors.length, 3);
  });
});

describe("départ général", () => {
  const balance = computeBalance({ feeders, calculations }).totals;
  const defaults = buildDefaultMainFeederInputs({ cabinet, balanceTotals: balance, calculations });

  it("valeurs par défaut : longueur = distance armoire–TGBT, calibre = plus petit calibre >= Ib (49,8 A -> 50 A), ΔU limite = ΔU amont des départs", () => {
    assert.equal(defaults.length, 25);
    assert.equal(defaults.rating, 50);
    assert.equal(defaults.maxVoltageDrop, 1);
    assert.equal(defaultVoltageDropLimit(calculations), 1);
  });

  it("exemple : 63 A, cuivre PVC, chemin de câbles, 25 m -> 16 mm², conforme (Ib ≤ In ≤ Iz)", () => {
    const outcome = calculateMainFeeder({ ...defaults, rating: 63 }, balance);
    assert.equal(outcome.ready, true);
    const { result } = outcome;
    assert.equal(result.section, 16);
    near(result.correctedCurrentCapacity, 80, 1e-9);
    assert.ok(result.designCurrent <= result.rating && result.rating <= result.correctedCurrentCapacity);
    assert.deepEqual(result.checks, { ibLeIn: "compliant", inLeIz: "compliant", voltageDrop: "compliant" });
    assert.equal(result.globalStatus, "compliant");
  });

  it("ΔU = √3·Ib·L·(R cos φ + X sin φ) / U avec le cos φ global du bilan", () => {
    const { result } = calculateMainFeeder(defaults, balance);
    const r = 1.15 * (1 + 0.00393 * 50);
    const sin = Math.sqrt(1 - balance.globalPowerFactor ** 2);
    const volts = Math.sqrt(3) * balance.totalCurrent * 0.025 * (r * balance.globalPowerFactor + 0.08 * sin);
    near(result.voltageDropVolts, volts, 1e-9);
    near(result.voltageDropPercent, (volts / 400) * 100, 1e-9);
  });

  it("section imposée trop faible : In > Iz -> non conforme", () => {
    const { result } = calculateMainFeeder({ ...defaults, rating: 63, section: "10" }, balance);
    assert.equal(result.section, 10);
    near(result.correctedCurrentCapacity, 60, 1e-9);
    assert.equal(result.checks.inLeIz, "non_compliant");
    assert.equal(result.globalStatus, "non_compliant");
  });

  it("calibre inférieur à Ib -> non conforme", () => {
    const { result } = calculateMainFeeder({ ...defaults, rating: 40 }, balance);
    assert.equal(result.checks.ibLeIn, "non_compliant");
  });

  it("limite ΔU trop stricte en mode auto : la section augmente ; impossible : chute non conforme", () => {
    const tight = calculateMainFeeder({ ...defaults, maxVoltageDrop: 0.5 }, balance).result;
    assert.ok(tight.section > 16);
    assert.equal(tight.checks.voltageDrop, "compliant");
    const long = calculateMainFeeder({ ...defaults, length: 4000, section: "16" }, balance).result;
    assert.equal(long.checks.voltageDrop, "non_compliant");
  });

  it("aluminium : aucune table -> bloqué avec message (aucune valeur inventée)", () => {
    const outcome = calculateMainFeeder({ ...defaults, material: "Aluminium" }, balance);
    assert.equal(outcome.ready, false);
    assert.match(outcome.issues[0].message, /Aucune table/);
  });

  it("erreurs de saisie : calibre nul, longueur vide, K hors plage", () => {
    const outcome = calculateMainFeeder({ ...defaults, rating: 0, length: "", coefficients: { k3: 5, k4: 1, k5: 1 } }, balance);
    assert.equal(outcome.ready, false);
    assert.ok(outcome.errors.rating && outcome.errors.length && outcome.errors.k3);
  });

  it("coefficients K appliqués : K = 0,8 -> Iz corrigé = 64 A pour 16 mm²", () => {
    const { result } = calculateMainFeeder({ ...defaults, coefficients: { k3: 1, k4: 0.8, k5: 1 }, section: "16" }, balance);
    near(result.correctedCurrentCapacity, 64, 1e-9);
    assert.equal(result.checks.inLeIz, "compliant");
  });

  it("payload d'enregistrement", () => {
    const payload = toMainFeederPayload(calculateMainFeeder({ ...defaults, rating: 63 }, balance), "2026-09-20T10:00:00.000Z");
    assert.equal(payload.status, "compliant");
    assert.equal(payload.inputs.section, "auto", "la section saisie reste « auto » ; la section retenue est dans result");
    assert.equal(payload.result.section, 16);
  });

  it("série de calibres : plus petit calibre >= courant", () => {
    assert.equal(suggestRating(28.3), 32);
    assert.equal(suggestRating(63), 63);
    assert.equal(suggestRating(63.1), 80);
    assert.equal(suggestRating(700), null);
    assert.equal(suggestRating(0), null);
  });
});

describe("nomenclature", () => {
  const balance = computeBalance({ feeders, calculations }).totals;
  const mainFeeder = toMainFeederPayload(calculateMainFeeder({ ...buildDefaultMainFeederInputs({ cabinet, balanceTotals: balance, calculations }), rating: 63 }, balance), "2026-09-20T10:00:00.000Z");
  const { lines, warnings } = generateBom({ feeders, calculations, mainFeeder });
  const byKey = (key) => lines.find((entry) => entry.autoKey === key);

  it("génère protection, câble, bornier par départ + départ général + armoire, sans avertissement", () => {
    assert.deepEqual(warnings, []);
    assert.ok(lines.every((entry) => BOM_CATEGORIES.includes(entry.category)), "catégories valides");
    assert.ok(lines.every((entry) => entry.source === "auto" && !entry.edited && entry.quantity > 0));
    assert.equal(new Set(lines.map((entry) => entry.autoKey)).size, lines.length, "clés uniques");
  });

  it("calibres : D01 32 A, D02 16 A, D03 10 A (plus petit calibre >= Ib, <= Iz) ; général 63 A", () => {
    assert.equal(byKey("D01:breaker").reference, "DJ-32A-3P");
    assert.equal(byKey("D02:breaker").reference, "DJ-16A-3P");
    assert.equal(byKey("D03:breaker").reference, "DJ-10A-3P");
    assert.equal(byKey("main:protection").reference, "DJG-63A-3P");
    assert.equal(byKey("main:protection").category, "Disjoncteur");
  });

  it("câbles : quantité = longueur, section issue du calcul", () => {
    const d01 = byKey("D01:cable");
    assert.equal(d01.quantity, 25);
    assert.equal(d01.unit, "m");
    assert.match(d01.designation, /4G6 mm²/);
    assert.equal(byKey("main:cable").quantity, 25);
    assert.match(byKey("main:cable").designation, /4G16 mm²/);
    assert.equal(lineTotal(d01), 25 * d01.unitPrice);
  });

  it("composants selon le type de charge : moteur (contacteur, relais, commande) ; éclairage (contacteur seul)", () => {
    for (const key of ["D01:contactor", "D01:relay", "D01:pushbutton", "D02:contactor"]) assert.ok(byKey(key), key);
    assert.ok(byKey("D03:contactor"));
    assert.equal(byKey("D03:relay"), undefined);
    assert.equal(byKey("D03:pushbutton"), undefined);
  });

  it("armoire : rail DIN dimensionné sur le nombre d'appareils, bornes PE = départs + 1", () => {
    const devices = lines.filter((entry) => ["Disjoncteur", "Interrupteur", "Contacteur", "Protection"].includes(entry.category)).reduce((sum, entry) => sum + entry.quantity, 0);
    assert.equal(devices, 9);
    assert.equal(byKey("cabinet:din-rail").quantity, 2);
    assert.equal(byKey("cabinet:earth").quantity, 4);
  });

  it("prix du catalogue de prototype renseignés : aucun prix manquant, total = Σ lignes", () => {
    assert.ok(lines.every((entry) => !entry.priceMissing && entry.unitPrice > 0));
    assert.equal(bomTotal(lines), Math.round(lines.reduce((sum, entry) => sum + entry.quantity * entry.unitPrice, 0) * 100) / 100);
  });

  it("interrupteur-sectionneur avec fusibles : interrupteur + 3 fusibles", () => {
    const withFuses = { ...mainFeeder, inputs: { ...mainFeeder.inputs, protectionType: "Interrupteur-sectionneur avec fusibles" } };
    const generated = generateBom({ feeders, calculations, mainFeeder: withFuses }).lines;
    assert.equal(generated.find((entry) => entry.autoKey === "main:protection").category, "Interrupteur");
    assert.equal(generated.find((entry) => entry.autoKey === "main:fuses").quantity, 3);
  });

  it("sans départ général : lignes des départs seulement ; départ non calculé ignoré avec avertissement", () => {
    const partial = generateBom({ feeders, calculations: calculations.slice(0, 1), mainFeeder: null });
    assert.ok(!partial.lines.some((entry) => entry.autoKey.startsWith("main:")));
    assert.equal(partial.warnings.length, 2);
    assert.ok(!partial.lines.some((entry) => entry.autoKey.startsWith("D02")));
  });

  it("prix absent du catalogue : ligne signalée priceMissing, prix 0 (jamais inventé)", () => {
    const heavy = { ...calculations[0], result: { ...calculations[0].result, designCurrent: 120 } };
    const generated = generateBom({ feeders: [feeders[0]], calculations: [heavy], mainFeeder: null });
    const contactor = generated.lines.find((entry) => entry.autoKey === "D01:contactor");
    assert.equal(contactor.priceMissing, true);
    assert.equal(contactor.unitPrice, 0);
  });

  describe("fusion (régénération sans écraser les retouches)", () => {
    const existing = [
      { ...byKey("D01:breaker"), quantity: 2, edited: true },
      { ...byKey("D01:cable"), unitPrice: 999 },
      { source: "manual", reference: "MAN-1", designation: "Pièce ajoutée", category: "Accessoire", quantity: 1, unitPrice: 10 },
      { ...byKey("D02:breaker") },
    ];
    const smaller = generateBom({ feeders: [feeders[0]], calculations: [calculations[0]], mainFeeder: null }).lines;
    const { items, stats } = mergeBom(existing, smaller);

    it("garde les lignes manuelles et retouchées", () => {
      assert.equal(items.find((entry) => entry.autoKey === "D01:breaker").quantity, 2);
      assert.ok(items.some((entry) => entry.reference === "MAN-1"));
      assert.equal(stats.keptEdited, 1);
    });
    it("régénère les lignes automatiques non retouchées", () => {
      assert.equal(items.find((entry) => entry.autoKey === "D01:cable").unitPrice, byKey("D01:cable").unitPrice);
      assert.equal(stats.updated, 1);
    });
    it("supprime les lignes automatiques dont le besoin a disparu et ajoute les nouvelles", () => {
      assert.ok(!items.some((entry) => entry.autoKey === "D02:breaker"));
      assert.equal(stats.removed, 1);
      assert.ok(items.some((entry) => entry.autoKey === "D01:terminal"));
      assert.equal(stats.added, smaller.length - 2);
    });
  });

  it("payload : quantités et prix numériques", () => {
    const payload = toBomPayload([{ ...lines[0], quantity: "2", unitPrice: "10.5" }]);
    assert.equal(payload[0].quantity, 2);
    assert.equal(payload[0].unitPrice, 10.5);
  });
});

describe("devis", () => {
  const lines = [{ quantity: 3, unitPrice: 12.34 }, { quantity: 2.5, unitPrice: 10 }];

  it("sous-total, remise, total HT, TVA, TTC en centimes exacts", () => {
    const totals = computeQuotationTotals(lines, 10, 19);
    assert.deepEqual(totals.lines.map((line) => line.total), [37.02, 25]);
    assert.equal(totals.subtotalHT, 62.02);
    assert.equal(totals.discountAmount, 6.2);
    assert.equal(totals.totalHT, 55.82);
    assert.equal(totals.vatAmount, 10.61);
    assert.equal(totals.totalTTC, 66.43);
  });

  it("sans remise ni TVA : TTC = HT = Σ lignes", () => {
    const totals = computeQuotationTotals(lines, 0, 0);
    assert.equal(totals.totalHT, 62.02);
    assert.equal(totals.totalTTC, 62.02);
  });

  it("pas de dérive flottante : 0,1 + 0,2 (× 1) = 0,30", () => {
    assert.equal(computeQuotationTotals([{ quantity: 1, unitPrice: 0.1 }, { quantity: 1, unitPrice: 0.2 }], 0, 0).subtotalHT, 0.3);
  });

  it("validation des champs du devis", () => {
    assert.deepEqual(validateQuotation({ reference: "DEV-2026-001", date: "2026-10-01", validityDays: 30, discountPercent: 0, vatPercent: 19 }), {});
    const errors = validateQuotation({ reference: " ", date: "", validityDays: -1, discountPercent: 120, vatPercent: "" });
    assert.deepEqual(Object.keys(errors).sort(), ["date", "discountPercent", "reference", "validityDays", "vatPercent"]);
  });
});

describe("dates, garantie et maintenance", () => {
  it("addMonths : 15/10/2026 + 6 mois = 15/04/2027 (exemple de l'énoncé)", () => {
    assert.equal(addMonths("2026-10-15", 6), "2027-04-15");
    assert.equal(addMonths("2026-10-15", 3), "2027-01-15");
    assert.equal(addMonths("2026-10-15", 12), "2027-10-15");
  });

  it("addMonths : fin de mois ramenée au dernier jour (et années bissextiles)", () => {
    assert.equal(addMonths("2026-08-31", 6), "2027-02-28");
    assert.equal(addMonths("2027-08-31", 6), "2028-02-29");
    assert.equal(addMonths("2026-11-30", 3), "2027-02-28");
  });

  it("addDays, daysBetween, formatDate", () => {
    assert.equal(addDays("2026-10-01", 30), "2026-10-31");
    assert.equal(daysBetween("2026-10-01", "2026-10-31"), 30);
    assert.equal(formatDate("2026-10-15T00:00:00.000Z"), "15/10/2026");
  });

  it("prochaine maintenance : depuis l'installation, puis depuis la dernière intervention", () => {
    assert.equal(nextMaintenanceDate({ installationDate: "2026-10-15", frequencyMonths: 6 }), "2027-04-15");
    assert.equal(nextMaintenanceDate({ installationDate: "2026-10-15", interventionDates: ["2027-04-15", "2027-04-20"], frequencyMonths: 6 }), "2027-10-20");
  });

  it("garantie : à venir avant le début, active pendant, expirée après ; couvertures évaluées séparément", () => {
    const warranty = { start: "2026-10-15", partsEnd: "2028-10-15", laborEnd: "2027-10-15" };
    assert.equal(warrantyStatus(warranty, "2026-10-01").status, "upcoming");
    assert.equal(warrantyStatus(warranty, "2026-10-15").status, "active");
    const mid = warrantyStatus(warranty, "2028-01-01");
    assert.deepEqual([mid.status, mid.parts, mid.labor], ["active", "active", "expired"]);
    assert.equal(warrantyStatus(warranty, "2028-10-15").status, "active", "le dernier jour est inclus");
    assert.equal(warrantyStatus(warranty, "2028-10-16").status, "expired");
    assert.equal(warrantyStatus(null).status, "unknown");
  });

  it("échéance : en retard / proche / à jour", () => {
    assert.equal(dueState("2026-10-01", "2026-10-15").state, "overdue");
    assert.equal(dueState("2026-10-20", "2026-10-15").state, "soon");
    assert.equal(dueState("2027-04-15", "2026-10-15").state, "ok");
  });
});

describe("progression du workflow", () => {
  const base = { project: { _id: "p1" }, cabinet: { _id: "c1" } };
  const statusOf = (overview) => Object.fromEntries(computeWorkflow(overview).steps.map((step) => [step.key, step.status]));
  const full = {
    ...base,
    feeders: [{ _id: "f1", status: "calculated" }],
    balance: { status: "validated", stale: false, updatedAt: "x" },
    mainFeeder: { status: "compliant", stale: false },
    bom: { count: 5, missingPrices: 0, stale: false },
    quotation: { status: "generated", stale: false, reference: "DEV-2026-001" },
    installation: { status: "completed" },
    asset: { assetId: "ACT-2026-001" },
    maintenance: { frequencyMonths: 6 },
    tickets: { total: 1, open: 0 },
  };

  it("projet seul : armoire à démarrer, tout le reste bloqué avec la raison", () => {
    const workflow = computeWorkflow({ project: { _id: "p1" }, cabinet: null });
    const statuses = Object.fromEntries(workflow.steps.map((step) => [step.key, step.status]));
    assert.equal(statuses.project, "done");
    assert.equal(statuses.cabinet, "not_started");
    assert.equal(statuses.feeders, "blocked");
    assert.equal(statuses.bom, "blocked");
    assert.match(workflow.steps.find((step) => step.key === "feeders").reason, /Armoire/);
    assert.equal(workflow.next.key, "cabinet");
  });

  it("calculs partiels : en cours ; bilan bloqué ; prochaine étape = calculs", () => {
    const workflow = computeWorkflow({ ...base, feeders: [{ _id: "f1", status: "calculated" }, { _id: "f2", status: "draft" }] });
    const statuses = Object.fromEntries(workflow.steps.map((step) => [step.key, step.status]));
    assert.equal(statuses.feeders, "done");
    assert.equal(statuses.calculations, "in_progress");
    assert.equal(statuses.balance, "blocked");
    assert.equal(workflow.next.key, "calculations");
  });

  it("exemple de l'énoncé : jusqu'à la nomenclature terminés, devis en cours, installation bloquée", () => {
    const statuses = statusOf({ ...full, quotation: { status: "saved", stale: false }, installation: null, asset: null, maintenance: null, tickets: { total: 0, open: 0 } });
    assert.deepEqual(
      ["project", "cabinet", "feeders", "calculations", "balance", "mainFeeder", "bom"].map((key) => statuses[key]),
      Array(7).fill("done"),
    );
    assert.equal(statuses.quotation, "in_progress");
    assert.equal(statuses.installation, "not_started", "l'installation peut démarrer dès qu'un devis est enregistré");
    assert.equal(statuses.asset, "blocked");
    assert.equal(statuses.maintenance, "blocked");
  });

  it("cycle complet : tout est terminé et il n'y a plus d'étape suivante", () => {
    const workflow = computeWorkflow(full);
    assert.ok(workflow.steps.every((step) => step.status === "done"), JSON.stringify(workflow.steps.map((s) => [s.key, s.status])));
    assert.equal(workflow.next, null);
  });

  it("données obsolètes ou non conformes : étape « en cours » signalée, étapes suivantes bloquées", () => {
    const stale = computeWorkflow({ ...full, balance: { status: "validated", stale: true } });
    assert.equal(stale.steps.find((s) => s.key === "balance").status, "in_progress");
    assert.equal(stale.steps.find((s) => s.key === "balance").issue, true);
    assert.equal(stale.steps.find((s) => s.key === "mainFeeder").status, "blocked");
    assert.equal(stale.next.key, "balance");

    const nonCompliant = computeWorkflow({ ...full, feeders: [{ _id: "f1", status: "non_compliant" }], balance: { status: "attention", stale: false } });
    assert.equal(nonCompliant.steps.find((s) => s.key === "calculations").issue, true);
    assert.equal(nonCompliant.steps.find((s) => s.key === "balance").status, "in_progress");
  });

  it("prix manquants : nomenclature en cours, devis bloqué", () => {
    const statuses = statusOf({ ...full, bom: { count: 5, missingPrices: 2, stale: false }, quotation: null, installation: null, asset: null });
    assert.equal(statuses.bom, "in_progress");
    assert.equal(statuses.quotation, "blocked");
  });

  it("tickets ouverts : étape en cours ; maintenance sans plan : à démarrer", () => {
    const statuses = statusOf({ ...full, tickets: { total: 2, open: 1 }, maintenance: null });
    assert.equal(statuses.tickets, "in_progress");
    assert.equal(statuses.maintenance, "not_started");
  });

  it("chemins : étapes liées à l'actif pointent vers /assets/<id>", () => {
    const workflow = computeWorkflow(full);
    assert.equal(workflow.steps.find((s) => s.key === "asset").path, "/assets/ACT-2026-001");
    assert.equal(workflow.steps.find((s) => s.key === "maintenance").path, "/assets/ACT-2026-001/maintenance");
    assert.equal(workflow.steps.find((s) => s.key === "balance").path, "/projects/p1/cabinets/c1/balance");
    assert.equal(workflow.steps.find((s) => s.key === "history").path, "/projects/p1/history");
  });
});
