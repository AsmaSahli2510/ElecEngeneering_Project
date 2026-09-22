// Départ général : protection, calibre et câble alimentant l'armoire, dimensionnés à partir du bilan de puissance.
// Fonction pure ; les tables (Iz, R/X) viennent du même fournisseur de référence que le calcul des départs.
//
// Conformité :  Ib ≤ In ≤ Iz   (Iz = Iz_table × K3 × K4 × K5)   et   ΔU% ≤ limite admissible.
// Limite ΔU par défaut = plus petite « ΔU amont » supposée par les calculs de départs : ces départs ont dimensionné leur
// chute de tension en supposant que la liaison amont ne dépasse pas cette valeur.

import { AUTO_SECTION } from "../calculation/constants.js";
import { voltageDropPercent, voltageDropVolts } from "../calculation/formulas.js";
import { prototypeReferenceProvider } from "../calculation/referenceProvider.js";
import { COEFFICIENT_BOUNDS } from "../calculation/referenceData.js";
import { CONDUCTOR_MATERIALS, INSULATION_TYPES } from "../calculation/constants.js";
import { PROTECTION_TYPES, suggestRating } from "../protection.js";

const CHECK = { COMPLIANT: "compliant", NON_COMPLIANT: "non_compliant" };
const status = (ok) => (ok ? CHECK.COMPLIANT : CHECK.NON_COMPLIANT);
const toNumber = (value) => (value === "" || value === null || value === undefined ? Number.NaN : Number(String(value).replace(",", ".")));

// Limite de ΔU proposée : la plus petite ΔU amont (en %) supposée par les départs calculés.
export function defaultVoltageDropLimit(calculations) {
  const values = calculations.map((calculation) => calculation.result?.voltageDrop?.upstreamPercent).filter(Number.isFinite);
  return values.length ? Math.min(...values) : 3;
}

// Valeurs initiales : longueur = distance armoire–TGBT saisie sur l'armoire ; calibre = plus petit calibre >= Ib ;
// section automatique ; coefficients K neutres (1,00) à ajuster.
export function buildDefaultMainFeederInputs({ cabinet, balanceTotals, calculations }) {
  return {
    protectionType: PROTECTION_TYPES[0],
    rating: suggestRating(balanceTotals.totalCurrent) ?? "",
    material: "Cuivre",
    insulation: "PVC",
    section: AUTO_SECTION,
    length: cabinet.distanceToTGBT ?? "",
    installationMethod: "Chemin de câbles",
    coefficients: { k3: 1, k4: 1, k5: 1 },
    maxVoltageDrop: Number(defaultVoltageDropLimit(calculations).toFixed(2)),
  };
}

export function normalizeMainFeederInputs(raw) {
  return {
    protectionType: raw.protectionType,
    rating: toNumber(raw.rating),
    material: raw.material,
    insulation: raw.insulation,
    section: String(raw.section) === AUTO_SECTION ? AUTO_SECTION : toNumber(raw.section),
    length: toNumber(raw.length),
    installationMethod: raw.installationMethod,
    coefficients: { k3: toNumber(raw.coefficients.k3), k4: toNumber(raw.coefficients.k4), k5: toNumber(raw.coefficients.k5) },
    maxVoltageDrop: toNumber(raw.maxVoltageDrop),
  };
}

export function validateMainFeederInputs(inputs, provider = prototypeReferenceProvider) {
  const errors = {};
  if (!PROTECTION_TYPES.includes(inputs.protectionType)) errors.protectionType = "Protection invalide.";
  if (!(inputs.rating > 0)) errors.rating = "Calibre requis (> 0 A).";
  if (!CONDUCTOR_MATERIALS.includes(inputs.material)) errors.material = "Matériau invalide.";
  if (!INSULATION_TYPES.includes(inputs.insulation)) errors.insulation = "Isolant invalide.";
  if (inputs.section !== AUTO_SECTION && !(inputs.section > 0)) errors.section = "Section invalide.";
  if (!(inputs.length > 0)) errors.length = "Longueur requise (> 0 m).";
  if (!provider.listInstallationMethods().some((method) => method.label === inputs.installationMethod)) errors.installationMethod = "Mode de pose invalide.";
  for (const key of ["k3", "k4", "k5"]) {
    const value = inputs.coefficients[key];
    if (!(value >= COEFFICIENT_BOUNDS.min && value <= COEFFICIENT_BOUNDS.max)) {
      errors[key] = `${key.toUpperCase()} doit être compris entre ${COEFFICIENT_BOUNDS.min} et ${COEFFICIENT_BOUNDS.max}.`;
    }
  }
  if (!(inputs.maxVoltageDrop > 0 && inputs.maxVoltageDrop <= 100)) errors.maxVoltageDrop = "ΔU maximale comprise entre 0 (exclu) et 100 %.";
  return errors;
}

// balance : totaux du bilan de puissance { totalCurrent, networkVoltage, phases, globalPowerFactor, demandPowerKw }
export function calculateMainFeeder(rawInputs, balance, provider = prototypeReferenceProvider) {
  const inputs = normalizeMainFeederInputs(rawInputs);
  const errors = validateMainFeederInputs(inputs, provider);
  const outcome = { inputs, errors, issues: [], ready: false, result: null, table: null };
  if (Object.keys(errors).length > 0) return outcome;

  const circuitType = balance.phases;
  const loadedConductors = circuitType === "Triphasé" ? 3 : 2;
  const current = balance.totalCurrent;
  const table = provider.findCurrentCapacityTable({
    material: inputs.material,
    insulation: inputs.insulation,
    installationMethod: inputs.installationMethod,
    loadedConductors,
  });
  outcome.table = table;
  if (!table) {
    outcome.issues.push({
      field: "material",
      message: `Aucune table de courants admissibles pour : ${inputs.material}, ${inputs.insulation}, ${inputs.installationMethod}, ${loadedConductors} conducteurs chargés.`,
    });
    return outcome;
  }

  const k = inputs.coefficients.k3 * inputs.coefficients.k4 * inputs.coefficients.k5;
  const izOf = (row) => row.iz * k;
  const propertiesOf = (row) => provider.getConductorElectricalProperties({ material: inputs.material, insulation: inputs.insulation, section: row.section });
  const dropOf = (row) => {
    const properties = propertiesOf(row);
    if (!properties) return null;
    const volts = voltageDropVolts({
      current,
      lengthM: inputs.length,
      rOhmPerKm: properties.rOhmPerKm,
      xOhmPerKm: properties.xOhmPerKm,
      powerFactor: balance.globalPowerFactor,
      circuitType,
    });
    return { volts, percent: voltageDropPercent(volts, balance.networkVoltage) };
  };

  let selected;
  if (inputs.section === AUTO_SECTION) {
    // Plus petite section telle que Iz ≥ max(In, Ib), puis section supérieure tant que la chute de tension dépasse la limite.
    const required = Math.max(inputs.rating, current);
    const startIndex = table.rows.findIndex((row) => izOf(row) >= required);
    if (startIndex < 0) {
      outcome.issues.push({ field: "section", message: `Aucune section de la table ne satisfait Iz ≥ ${required.toFixed(1)} A avec K = ${k.toFixed(2)}. Envisagez des câbles en parallèle.` });
      return outcome;
    }
    selected = table.rows[startIndex];
    for (const row of table.rows.slice(startIndex)) {
      const drop = dropOf(row);
      if (!drop) {
        outcome.issues.push({ field: "section", message: `Caractéristiques R/X absentes pour ${row.section} mm².` });
        return outcome;
      }
      if (drop.percent <= inputs.maxVoltageDrop) {
        selected = row;
        break;
      }
    }
  } else {
    selected = table.rows.find((row) => row.section === inputs.section);
    if (!selected) {
      outcome.issues.push({ field: "section", message: `La section ${inputs.section} mm² n'existe pas dans la table ${table.id}.` });
      return outcome;
    }
  }

  const drop = dropOf(selected);
  if (!drop) {
    outcome.issues.push({ field: "section", message: `Caractéristiques R/X absentes pour ${selected.section} mm².` });
    return outcome;
  }
  const correctedCapacity = izOf(selected);
  const checks = {
    ibLeIn: status(current <= inputs.rating),
    inLeIz: status(inputs.rating <= correctedCapacity),
    voltageDrop: status(drop.percent <= inputs.maxVoltageDrop),
  };

  outcome.ready = true;
  outcome.result = {
    designCurrent: current,
    rating: inputs.rating,
    section: selected.section,
    currentCapacityTable: selected.iz,
    k,
    correctedCurrentCapacity: correctedCapacity,
    voltageDropPercent: drop.percent,
    voltageDropVolts: drop.volts,
    voltageDropLimitPercent: inputs.maxVoltageDrop,
    networkVoltage: balance.networkVoltage,
    phases: balance.phases,
    powerFactor: balance.globalPowerFactor,
    demandPowerKw: balance.demandPowerKw,
    checks,
    globalStatus: Object.values(checks).every((value) => value === CHECK.COMPLIANT) ? CHECK.COMPLIANT : CHECK.NON_COMPLIANT,
  };
  return outcome;
}

export function toMainFeederPayload(outcome, basedOn) {
  const { inputs, result } = outcome;
  return {
    inputs: { ...inputs, section: String(inputs.section) },
    result,
    status: result.globalStatus,
    basedOn,
  };
}
