// Lancer avec : npm test   (node --test, aucune dépendance supplémentaire)

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyInputChange, buildDefaultInputs, calculateFeeder, mergeSavedInputs, prototypeReferenceProvider } from "./index.js";
import { CALCULATION_STATUS, CHECK_STATUS } from "./constants.js";

const cabinet = { neutralSystem: "TN-S" };
const D01 = { reference: "D01", loadType: "Moteur", power: 15, powerUnit: "kW", voltage: 400, cableLength: 25 };
const D02 = { reference: "D02", loadType: "Moteur", power: 7.5, powerUnit: "kW", voltage: 400, cableLength: 35 };
const D03 = { reference: "D03", loadType: "Éclairage", power: 5, powerUnit: "kW", voltage: 400, cableLength: 40 };

const inputsFor = (feeder, patch = {}) => {
  const inputs = buildDefaultInputs({ cabinet, feeder });
  for (const [form, values] of Object.entries(patch)) Object.assign(inputs[form], values);
  return inputs;
};
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label ?? ""} attendu ≈ ${expected}, obtenu ${actual}`);

describe("D01 — exemple de référence de l'énoncé", () => {
  const outcome = calculateFeeder(inputsFor(D01));
  const { result } = outcome;

  it("est calculable sans erreur", () => {
    assert.equal(outcome.ready, true);
    assert.deepEqual(outcome.issues, []);
  });

  it("Ib = 15 kW / (√3 × 400 × 0,85 × 0,90) ≈ 28,3 A", () => {
    near(result.designCurrent, 15000 / (Math.sqrt(3) * 400 * 0.85 * 0.9), 1e-9);
    near(result.designCurrent, 28.3, 0.05);
  });

  it("K = K3 × K4 × K5 = 1,00 × 0,80 × 1,00 = 0,80", () => {
    near(result.coefficients.k, 0.8, 1e-12);
  });

  it("retient 6 mm² : 4 mm² donne Iz = 34 × 0,8 = 27,2 A < Ib, 6 mm² donne 43 × 0,8 = 34,4 A", () => {
    assert.equal(result.cable.recommendedSection, 6);
    assert.equal(result.cable.thermalSection, 6);
    assert.equal(result.cable.limitingCriterion, "thermal");
    near(result.cable.currentCapacityTable, 43, 0);
    near(result.cable.correctedCurrentCapacity, 34.4, 1e-9);
    assert.ok(result.cable.correctedCurrentCapacity >= result.designCurrent);
    const fourMm = prototypeReferenceProvider.findCurrentCapacityTable({ material: "Cuivre", insulation: "PVC", installationMethod: "Chemin de câbles", loadedConductors: 3 }).rows.find((row) => row.section === 4);
    assert.ok(fourMm.iz * 0.8 < result.designCurrent);
  });

  it("ΔU% = √3·I·L·(R cosφ + X sinφ)/U avec R, X issus du câble 6 mm²", () => {
    const r = 3.08 * (1 + 0.00393 * (70 - 20)); // Ω/km, R20 CEI 60228 ramenée à 70 °C
    const x = 0.08;
    const sinPhi = Math.sqrt(1 - 0.85 ** 2);
    const expectedVolts = Math.sqrt(3) * result.designCurrent * 0.025 * (r * 0.85 + x * sinPhi);
    near(result.cable.resistanceOhmPerKm, r, 1e-9);
    near(result.voltageDrop.feederVolts, expectedVolts, 1e-9);
    near(result.voltageDrop.feederPercent, (expectedVolts / 400) * 100, 1e-9);
    near(result.voltageDrop.feederPercent, 0.97, 0.01);
  });

  it("ΔU disponible = 3 % − 1 % = 2 %", () => {
    near(result.voltageDrop.availablePercent, 2, 1e-12);
    assert.ok(result.voltageDrop.feederPercent <= result.voltageDrop.availablePercent);
  });

  it("Icu 15 kA >= Icc 10 kA et statut global validé", () => {
    assert.equal(result.checks.breakingCapacity, CHECK_STATUS.COMPLIANT);
    assert.deepEqual(result.checks, { thermal: "compliant", voltageDrop: "compliant", breakingCapacity: "compliant" });
    assert.equal(result.globalStatus, CALCULATION_STATUS.VALIDATED);
  });

  it("expose les données utiles au futur bilan de puissance", () => {
    near(result.absorbedPowerKw, 15 / 0.9, 1e-9);
    near(result.apparentPowerKva, (Math.sqrt(3) * 400 * result.designCurrent) / 1000, 1e-9);
  });
});

describe("D02 et D03", () => {
  it("D02 (7,5 kW, 35 m) : 2,5 mm² et conforme", () => {
    const { result } = calculateFeeder(inputsFor(D02));
    near(result.designCurrent, 14.15, 0.01);
    assert.equal(result.cable.recommendedSection, 2.5);
    assert.equal(result.globalStatus, CALCULATION_STATUS.VALIDATED);
  });

  it("D03 (éclairage 5 kW, 40 m) : cos φ 0,95 / η 1 par défaut, conforme", () => {
    const { result } = calculateFeeder(inputsFor(D03));
    near(result.designCurrent, 5000 / (Math.sqrt(3) * 400 * 0.95), 1e-9);
    assert.equal(result.globalStatus, CALCULATION_STATUS.VALIDATED);
  });
});

describe("critères de non-conformité", () => {
  it("Icc > pouvoir de coupure : non conforme", () => {
    const { result } = calculateFeeder(inputsFor(D01, { upstreamShortCircuit: { iccKa: 20, breakingCapacityKa: 15 } }));
    assert.equal(result.checks.breakingCapacity, CHECK_STATUS.NON_COMPLIANT);
    assert.equal(result.globalStatus, CALCULATION_STATUS.NON_COMPLIANT);
  });

  it("Icc = pouvoir de coupure : conforme (Icu >= Icc)", () => {
    const { result } = calculateFeeder(inputsFor(D01, { upstreamShortCircuit: { iccKa: 15, breakingCapacityKa: 15 } }));
    assert.equal(result.checks.breakingCapacity, CHECK_STATUS.COMPLIANT);
  });

  it("section manuelle trop faible : thermique non conforme", () => {
    const { result } = calculateFeeder(inputsFor(D01, { cable: { section: "4" } }));
    assert.equal(result.cable.recommendedSection, 4);
    assert.equal(result.cable.thermalSection, 6);
    assert.equal(result.checks.thermal, CHECK_STATUS.NON_COMPLIANT);
    assert.equal(result.globalStatus, CALCULATION_STATUS.NON_COMPLIANT);
  });

  it("câble long en mode auto : la section augmente pour respecter ΔU", () => {
    const { result } = calculateFeeder(inputsFor(D01, { load: { cableLength: 150 } }));
    assert.equal(result.cable.thermalSection, 6);
    assert.ok(result.cable.recommendedSection > 6);
    assert.equal(result.cable.limitingCriterion, "voltageDrop");
    assert.equal(result.checks.voltageDrop, CHECK_STATUS.COMPLIANT);
    assert.equal(result.checks.thermal, CHECK_STATUS.COMPLIANT);
  });

  it("ΔU amont >= ΔU max : ΔU disponible <= 0, chute de tension non conforme", () => {
    const { result } = calculateFeeder(inputsFor(D01, { upstreamVoltageDrop: { value: 3, unit: "%" } }));
    near(result.voltageDrop.availablePercent, 0, 1e-12);
    assert.equal(result.checks.voltageDrop, CHECK_STATUS.NON_COMPLIANT);
  });

  it("ΔU amont saisi en volts est converti en % de U", () => {
    const { result } = calculateFeeder(inputsFor(D01, { upstreamVoltageDrop: { value: 4, unit: "V" } }));
    near(result.voltageDrop.upstreamPercent, 1, 1e-12);
    near(result.voltageDrop.availablePercent, 2, 1e-12);
  });
});

describe("coefficients", () => {
  it("mode automatique : 30 °C PVC -> K3 = 1,00 ; 3 circuits sur chemin de câbles -> K4 = 0,82 ; K5 = 1,00", () => {
    const outcome = calculateFeeder(inputsFor(D01, { coefficients: { mode: "auto" } }));
    assert.equal(outcome.ready, true);
    const { k3, k4, k5, k } = outcome.result.coefficients;
    assert.deepEqual([k3, k4, k5], [1, 0.82, 1]);
    near(k, 0.82, 1e-12);
  });

  it("mode automatique : température intermédiaire -> ligne supérieure (plus défavorable)", () => {
    const outcome = calculateFeeder(inputsFor(D01, { coefficients: { mode: "auto" }, installation: { ambientTemperature: 32 } }));
    assert.equal(outcome.result.coefficients.k3, 0.94);
  });

  it("mode automatique : installation particulière -> K5 à saisir, calcul bloqué", () => {
    const outcome = calculateFeeder(inputsFor(D01, { coefficients: { mode: "auto" }, installation: { specialInstallation: true } }));
    assert.equal(outcome.ready, false);
    assert.equal(outcome.issues[0].form, "coefficients");
  });

  it("mode automatique : température hors table -> calcul bloqué", () => {
    const outcome = calculateFeeder(inputsFor(D01, { coefficients: { mode: "auto" }, installation: { ambientTemperature: 75 } }));
    assert.equal(outcome.ready, false);
    assert.ok(outcome.issues.some((issue) => issue.field === "k3"));
  });

  it("saisie manuelle hors plage refusée", () => {
    const outcome = calculateFeeder(inputsFor(D01, { coefficients: { k4: 2 } }));
    assert.equal(outcome.ready, false);
    assert.ok(outcome.errors.coefficients.k4);
  });

  it("les valeurs des tables restent affichables en saisie manuelle", () => {
    const outcome = calculateFeeder(inputsFor(D01));
    assert.equal(outcome.coefficients.reference.k4.value, 0.82);
  });
});

describe("tables de référence remplaçables", () => {
  it("aluminium : aucune table -> calcul bloqué avec un message explicite (pas de valeur inventée)", () => {
    const outcome = calculateFeeder(inputsFor(D01, { cable: { material: "Aluminium" } }));
    assert.equal(outcome.ready, false);
    assert.equal(outcome.issues[0].form, "cable");
    assert.match(outcome.issues[0].message, /Aucune table/);
  });

  it("un autre fournisseur de référence change la section retenue", () => {
    const provider = {
      ...prototypeReferenceProvider,
      id: "test-provider",
      findCurrentCapacityTable: (key) => ({
        ...prototypeReferenceProvider.findCurrentCapacityTable(key),
        rows: [{ section: 6, iz: 100 }, { section: 10, iz: 200 }],
      }),
    };
    const { result } = calculateFeeder(inputsFor(D01), provider);
    assert.equal(result.referenceProviderId, "test-provider");
    assert.equal(result.cable.recommendedSection, 6);
    near(result.cable.correctedCurrentCapacity, 80, 1e-9);
  });

  it("courant trop élevé pour toute la table : calcul bloqué", () => {
    const outcome = calculateFeeder(inputsFor({ ...D01, power: 900 }));
    assert.equal(outcome.ready, false);
    assert.match(outcome.issues[0].message, /Aucune section/);
  });
});

describe("unités et types de circuit", () => {
  it("W : 15000 W équivaut à 15 kW", () => {
    const a = calculateFeeder(inputsFor({ ...D01, power: 15000, powerUnit: "W" })).result;
    const b = calculateFeeder(inputsFor(D01)).result;
    near(a.designCurrent, b.designCurrent, 1e-9);
  });

  it("kVA : Ib = S / (√3 × U), sans cos φ ni η", () => {
    const { result } = calculateFeeder(inputsFor({ ...D01, power: 20, powerUnit: "kVA" }));
    near(result.designCurrent, 20000 / (Math.sqrt(3) * 400), 1e-9);
  });

  it("monophasé : Ib = P / (U cosφ η), 2 conducteurs chargés, ΔU avec b = 2", () => {
    const outcome = calculateFeeder(inputsFor({ ...D01, power: 2, voltage: 230, cableLength: 20 }, { circuit: { circuitType: "Monophasé" }, cable: { conductorCount: 3 } }));
    const { result } = outcome;
    assert.equal(outcome.ready, true);
    assert.equal(result.loadedConductors, 2);
    near(result.designCurrent, 2000 / (230 * 0.85 * 0.9), 1e-9);
    const sinPhi = Math.sqrt(1 - 0.85 ** 2);
    const expectedVolts = 2 * result.designCurrent * 0.02 * (result.cable.resistanceOhmPerKm * 0.85 + 0.08 * sinPhi);
    near(result.voltageDrop.feederVolts, expectedVolts, 1e-9);
  });
});

describe("validation des saisies", () => {
  it("rejette puissance nulle, cos φ > 1, longueur vide, conducteurs insuffisants", () => {
    const outcome = calculateFeeder(inputsFor(D01, { load: { power: 0, powerFactor: 1.2, cableLength: "" }, cable: { conductorCount: 2 } }));
    assert.equal(outcome.ready, false);
    assert.ok(outcome.errors.load.power && outcome.errors.load.powerFactor && outcome.errors.load.cableLength);
    assert.ok(outcome.errors.cable.conductorCount);
    assert.deepEqual(Object.keys(outcome.errors.circuit), []);
  });

  it("accepte la virgule décimale française", () => {
    const { result } = calculateFeeder(inputsFor(D01, { load: { powerFactor: "0,85", efficiency: "0,90" } }));
    near(result.designCurrent, 28.3, 0.05);
  });
});

describe("état des formulaires", () => {
  it("changer le type de charge remplace cos φ / η si non modifiés", () => {
    const inputs = inputsFor(D01);
    const next = applyInputChange(inputs, "load", { loadType: "Éclairage" });
    assert.equal(next.load.powerFactor, 0.95);
    assert.equal(next.load.efficiency, 1);
    assert.equal(inputs.load.loadType, "Moteur", "l'état précédent n'est pas muté");
  });

  it("changer le type de charge conserve cos φ / η modifiés par l'utilisateur", () => {
    const inputs = inputsFor(D01, { load: { powerFactor: "0.8" } });
    const next = applyInputChange(inputs, "load", { loadType: "Éclairage" });
    assert.equal(next.load.powerFactor, "0.8");
  });

  it("mergeSavedInputs : les tranches enregistrées l'emportent, les manquantes retombent sur les défauts", () => {
    const defaults = inputsFor(D01);
    const merged = mergeSavedInputs(defaults, { cable: { material: "Aluminium" }, load: { power: 99 } });
    assert.equal(merged.cable.material, "Aluminium");
    assert.equal(merged.cable.insulation, "PVC");
    assert.equal(merged.load.power, 99);
    assert.equal(merged.circuit.nominalVoltage, 400);
  });
});
