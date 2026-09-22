// Moteur de calcul d'un départ : Ib -> coefficients -> section (Iz >= Ib) -> ΔU -> pouvoir de coupure.
// Fonction pure : mêmes entrées, même résultat. Aucune dépendance à React, au réseau ou à la base.
// Les tables sont lues uniquement via le fournisseur de référence passé en paramètre.

import { AUTO_SECTION, CALCULATION_STATUS, CHECK_STATUS } from "./constants.js";
import {
  absorbedPowerKw,
  apparentPowerKva,
  availableVoltageDrop,
  designCurrent,
  loadedConductorCount,
  upstreamDropToPercent,
  voltageDropPercent,
  voltageDropVolts,
} from "./formulas.js";
import { normalizeInputs } from "./inputs.js";
import { prototypeReferenceProvider } from "./referenceProvider.js";
import { hasErrors, validateInputs } from "./validation.js";

export { applyInputChange, buildDefaultInputs, FORM_KEYS, mergeSavedInputs, normalizeInputs } from "./inputs.js";
export { prototypeReferenceProvider } from "./referenceProvider.js";
export { validateInputs, hasErrors } from "./validation.js";

const checkStatus = (conform) => (conform ? CHECK_STATUS.COMPLIANT : CHECK_STATUS.NON_COMPLIANT);

// Coefficients de correction : K = K3 × K4 × K5.
// Retourne aussi les valeurs proposées par les tables de référence (`reference`) pour les afficher
// à côté d'une saisie manuelle.
export function resolveCoefficients(inputs, provider = prototypeReferenceProvider) {
  const { cable, installation, coefficients } = inputs;
  const reference = provider.getCorrectionFactors({
    insulation: cable.insulation,
    installationMethod: cable.installationMethod,
    ambientTemperature: installation.ambientTemperature,
    groupedCircuits: installation.groupedCircuits,
    specialInstallation: installation.specialInstallation,
  });

  if (coefficients.mode === "manual") {
    const { k3, k4, k5 } = coefficients;
    return { mode: "manual", k3, k4, k5, k: k3 * k4 * k5, reference, missing: [] };
  }

  const missing = Object.entries(reference).filter(([, factor]) => factor.value === null);
  if (missing.length > 0) {
    return { mode: "auto", k3: null, k4: null, k5: null, k: null, reference, missing: missing.map(([key, factor]) => ({ key, reason: factor.reason })) };
  }
  const k3 = reference.k3.value;
  const k4 = reference.k4.value;
  const k5 = reference.k5.value;
  return { mode: "auto", k3, k4, k5, k: k3 * k4 * k5, reference, missing: [] };
}

function drop(inputs, current, cableProperties) {
  const { circuit, load } = inputs;
  const volts = voltageDropVolts({
    current,
    lengthM: load.cableLength,
    rOhmPerKm: cableProperties.rOhmPerKm,
    xOhmPerKm: cableProperties.xOhmPerKm,
    powerFactor: load.powerFactor,
    circuitType: circuit.circuitType,
  });
  return { volts, percent: voltageDropPercent(volts, circuit.nominalVoltage) };
}

// Point d'entrée. Retourne toujours un objet { errors, issues, ready, result, coefficients } :
//  - errors : erreurs de saisie par formulaire (voir validation.js)
//  - coefficients : K3, K4, K5 résolus (null tant que l'isolant, le mode de pose et les formulaires 4 et 5 sont invalides)
//  - table  : table Iz retenue pour le câble (null si non résolue)
//  - issues : blocages détectés pendant le calcul [{ form, message }] (table absente, aucune section...)
//  - ready  : true si `result` est complet et peut être enregistré
export function calculateFeeder(rawInputs, provider = prototypeReferenceProvider) {
  const inputs = normalizeInputs(rawInputs);
  const errors = validateInputs(inputs, provider);
  const outcome = { inputs, errors, issues: [], ready: false, result: null, coefficients: null, table: null };

  // Les coefficients ne dépendent que des formulaires 3 (isolant, mode de pose), 4 et 5 : on les résout dès que
  // ceux-ci sont valides, même si un autre formulaire est encore en erreur (formulaires indépendants).
  const coefficientInputsValid =
    Object.keys(errors.installation).length === 0 &&
    Object.keys(errors.coefficients).length === 0 &&
    !errors.cable.insulation &&
    !errors.cable.installationMethod;
  if (coefficientInputsValid) {
    outcome.coefficients = resolveCoefficients(inputs, provider);
    for (const { key, reason } of outcome.coefficients.missing) {
      outcome.issues.push({ form: "coefficients", field: key, message: reason });
    }
  }

  if (hasErrors(errors)) return outcome;

  const { circuit, load, cable, upstreamVoltageDrop, upstreamShortCircuit } = inputs;
  const loadedConductors = loadedConductorCount(circuit.circuitType);

  const current = designCurrent({
    power: load.power,
    powerUnit: load.powerUnit,
    nominalVoltage: circuit.nominalVoltage,
    circuitType: circuit.circuitType,
    powerFactor: load.powerFactor,
    efficiency: load.efficiency,
  });
  const apparent = apparentPowerKva({ current, nominalVoltage: circuit.nominalVoltage, circuitType: circuit.circuitType });
  const absorbed = absorbedPowerKw({ ...load, apparentPowerKva: apparent });

  const coefficients = outcome.coefficients;

  const table = provider.findCurrentCapacityTable({
    material: cable.material,
    insulation: cable.insulation,
    installationMethod: cable.installationMethod,
    loadedConductors,
  });
  outcome.table = table;
  if (!table) {
    outcome.issues.push({
      form: "cable",
      message: `Aucune table de courants admissibles pour : ${cable.material}, ${cable.insulation}, ${cable.installationMethod}, ${loadedConductors} conducteurs chargés. Renseignez-la dans la référence avant de calculer.`,
    });
  }
  if (outcome.issues.length > 0) return outcome;

  const upstreamPercent = upstreamDropToPercent({ ...upstreamVoltageDrop, nominalVoltage: circuit.nominalVoltage });
  const availablePercent = availableVoltageDrop(load.maxVoltageDrop, upstreamPercent);
  const k = coefficients.k;
  const izCorrected = (row) => row.iz * k;

  const propertiesFor = (row) =>
    provider.getConductorElectricalProperties({ material: cable.material, insulation: cable.insulation, section: row.section });

  let selectedRow;
  let thermalRow;
  let limitingCriterion;

  if (cable.section === AUTO_SECTION) {
    thermalRow = table.rows.find((row) => izCorrected(row) >= current);
    if (!thermalRow) {
      const maxRow = table.rows[table.rows.length - 1];
      outcome.issues.push({
        form: "cable",
        message: `Aucune section de la table ne satisfait Iz ≥ Ib (Ib = ${current.toFixed(1)} A, Iz max corrigé = ${izCorrected(maxRow).toFixed(1)} A pour ${maxRow.section} mm²). Envisagez des câbles en parallèle.`,
      });
      return outcome;
    }
    // La section retenue est la plus petite qui satisfait Iz ≥ Ib ; si la chute de tension n'est pas respectée,
    // on passe à la section supérieure jusqu'à la respecter (critère limitant : chute de tension).
    const startIndex = table.rows.indexOf(thermalRow);
    selectedRow = thermalRow;
    limitingCriterion = "thermal";
    for (const row of table.rows.slice(startIndex)) {
      const properties = propertiesFor(row);
      if (!properties) {
        outcome.issues.push({ form: "cable", message: `Caractéristiques R/X absentes pour ${row.section} mm² (${cable.material}, ${cable.insulation}).` });
        return outcome;
      }
      if (drop(inputs, current, properties).percent <= availablePercent) {
        selectedRow = row;
        limitingCriterion = row === thermalRow ? "thermal" : "voltageDrop";
        break;
      }
    }
  } else {
    selectedRow = table.rows.find((row) => row.section === cable.section);
    if (!selectedRow) {
      outcome.issues.push({ form: "cable", message: `La section ${cable.section} mm² n'existe pas dans la table ${table.id}.` });
      return outcome;
    }
    thermalRow = table.rows.find((row) => izCorrected(row) >= current) ?? null;
    limitingCriterion = "manual";
  }

  const cableProperties = propertiesFor(selectedRow);
  if (!cableProperties) {
    outcome.issues.push({ form: "cable", message: `Caractéristiques R/X absentes pour ${selectedRow.section} mm² (${cable.material}, ${cable.insulation}).` });
    return outcome;
  }

  const feederDrop = drop(inputs, current, cableProperties);
  const correctedCapacity = izCorrected(selectedRow);

  const checks = {
    thermal: checkStatus(correctedCapacity >= current),
    voltageDrop: checkStatus(feederDrop.percent <= availablePercent),
    breakingCapacity: checkStatus(upstreamShortCircuit.breakingCapacityKa >= upstreamShortCircuit.iccKa),
  };
  const allCompliant = Object.values(checks).every((status) => status === CHECK_STATUS.COMPLIANT);

  outcome.ready = true;
  outcome.result = {
    referenceProviderId: provider.id,
    designCurrent: current,
    absorbedPowerKw: absorbed,
    apparentPowerKva: apparent,
    loadedConductors,
    coefficients: { mode: coefficients.mode, k3: coefficients.k3, k4: coefficients.k4, k5: coefficients.k5, k },
    cable: {
      material: cable.material,
      insulation: cable.insulation,
      installationMethod: cable.installationMethod,
      recommendedSection: selectedRow.section,
      thermalSection: thermalRow?.section ?? null,
      limitingCriterion,
      currentCapacityTableId: table.id,
      currentCapacityTable: selectedRow.iz,
      correctedCurrentCapacity: correctedCapacity,
      resistanceOhmPerKm: cableProperties.rOhmPerKm,
      reactanceOhmPerKm: cableProperties.xOhmPerKm,
    },
    voltageDrop: {
      feederPercent: feederDrop.percent,
      feederVolts: feederDrop.volts,
      upstreamPercent,
      maxPercent: load.maxVoltageDrop,
      availablePercent,
    },
    shortCircuit: {
      iccKa: upstreamShortCircuit.iccKa,
      breakingCapacityKa: upstreamShortCircuit.breakingCapacityKa,
    },
    checks,
    globalStatus: allCompliant ? CALCULATION_STATUS.VALIDATED : CALCULATION_STATUS.NON_COMPLIANT,
  };
  return outcome;
}
