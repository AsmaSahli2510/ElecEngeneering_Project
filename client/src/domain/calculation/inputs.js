// Structure des données d'entrée d'un calcul de départ : une tranche par formulaire.
//
//   circuit                 -> formulaire 1
//   load                    -> formulaire 2   (contient aussi maxVoltageDrop, partagé avec le formulaire 6)
//   cable                   -> formulaire 3
//   installation            -> formulaire 4
//   coefficients            -> formulaire 5
//   upstreamVoltageDrop     -> formulaire 6
//   upstreamShortCircuit    -> formulaire 7

import { AUTO_SECTION } from "./constants.js";
import { LOAD_TYPE_DEFAULTS, TEST_COEFFICIENTS } from "./referenceData.js";
import { toNumber } from "./formulas.js";

export const FORM_KEYS = ["circuit", "load", "cable", "installation", "coefficients", "upstreamVoltageDrop", "upstreamShortCircuit"];

// Valeurs initiales d'un calcul : reprises de l'armoire et du départ, complétées par les valeurs de test
// du prototype (conditions d'installation, coefficients, ΔU amont, Icc) qui restent modifiables.
export function buildDefaultInputs({ cabinet, feeder }) {
  const loadType = feeder.loadType ?? "Autre";
  const loadDefaults = LOAD_TYPE_DEFAULTS[loadType] ?? LOAD_TYPE_DEFAULTS.Autre;
  return {
    circuit: {
      nominalVoltage: feeder.voltage ?? 400,
      circuitType: "Triphasé",
      neutralSystem: cabinet?.neutralSystem ?? "TN-S",
    },
    load: {
      power: feeder.power ?? "",
      powerUnit: feeder.powerUnit ?? "kW",
      loadType,
      powerFactor: loadDefaults.powerFactor,
      efficiency: loadDefaults.efficiency,
      cableLength: feeder.cableLength ?? "",
      maxVoltageDrop: 3,
    },
    cable: {
      material: "Cuivre",
      insulation: "PVC",
      conductorCount: 4,
      installationMethod: "Chemin de câbles",
      section: AUTO_SECTION,
    },
    installation: {
      ambientTemperature: 30,
      groupedCircuits: 3,
      specialInstallation: false,
    },
    coefficients: { mode: "manual", ...TEST_COEFFICIENTS },
    upstreamVoltageDrop: { value: 1, unit: "%" },
    upstreamShortCircuit: { iccKa: 10, breakingCapacityKa: 15 },
  };
}

// Convertit les valeurs du formulaire (chaînes ou nombres) en valeurs typées pour le moteur.
export function normalizeInputs(raw) {
  const { circuit, load, cable, installation, coefficients, upstreamVoltageDrop, upstreamShortCircuit } = raw;
  return {
    circuit: {
      nominalVoltage: toNumber(circuit.nominalVoltage),
      circuitType: circuit.circuitType,
      neutralSystem: circuit.neutralSystem,
    },
    load: {
      power: toNumber(load.power),
      powerUnit: load.powerUnit,
      loadType: load.loadType,
      powerFactor: toNumber(load.powerFactor),
      efficiency: toNumber(load.efficiency),
      cableLength: toNumber(load.cableLength),
      maxVoltageDrop: toNumber(load.maxVoltageDrop),
    },
    cable: {
      material: cable.material,
      insulation: cable.insulation,
      conductorCount: toNumber(cable.conductorCount),
      installationMethod: cable.installationMethod,
      section: String(cable.section) === AUTO_SECTION ? AUTO_SECTION : toNumber(cable.section),
    },
    installation: {
      ambientTemperature: toNumber(installation.ambientTemperature),
      groupedCircuits: toNumber(installation.groupedCircuits),
      specialInstallation: installation.specialInstallation === true || installation.specialInstallation === "true",
    },
    coefficients: {
      mode: coefficients.mode,
      k3: toNumber(coefficients.k3),
      k4: toNumber(coefficients.k4),
      k5: toNumber(coefficients.k5),
    },
    upstreamVoltageDrop: {
      value: toNumber(upstreamVoltageDrop.value),
      unit: upstreamVoltageDrop.unit,
    },
    upstreamShortCircuit: {
      iccKa: toNumber(upstreamShortCircuit.iccKa),
      breakingCapacityKa: toNumber(upstreamShortCircuit.breakingCapacityKa),
    },
  };
}

// Applique la modification d'un champ à l'état des formulaires (sans muter l'état précédent).
// Changer le type de charge remplace cos φ et η par les valeurs par défaut du nouveau type,
// sauf si l'utilisateur les avait déjà modifiés.
export function applyInputChange(inputs, formKey, patch) {
  const next = { ...inputs, [formKey]: { ...inputs[formKey], ...patch } };
  if (formKey === "load" && patch.loadType && patch.loadType !== inputs.load.loadType) {
    const previous = LOAD_TYPE_DEFAULTS[inputs.load.loadType];
    const target = LOAD_TYPE_DEFAULTS[patch.loadType];
    const untouched =
      previous &&
      toNumber(inputs.load.powerFactor) === previous.powerFactor &&
      toNumber(inputs.load.efficiency) === previous.efficiency;
    if (untouched && target) {
      next.load = { ...next.load, powerFactor: target.powerFactor, efficiency: target.efficiency };
    }
  }
  return next;
}

// Reprend les entrées d'un calcul enregistré ; les tranches absentes retombent sur les valeurs par défaut.
export function mergeSavedInputs(defaults, saved) {
  return Object.fromEntries(FORM_KEYS.map((key) => [key, { ...defaults[key], ...(saved?.[key] ?? {}) }]));
}
