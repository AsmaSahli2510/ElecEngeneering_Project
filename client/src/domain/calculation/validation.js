// Validation des données d'entrée, formulaire par formulaire (indépendante de React).
// Prend des entrées déjà normalisées (voir inputs.js) et retourne { [formKey]: { [champ]: message } }.
// Un formulaire est valide si son objet d'erreurs est vide.

import {
  CIRCUIT_TYPES,
  COEFFICIENT_MODES,
  CONDUCTOR_MATERIALS,
  INSULATION_TYPES,
  LOAD_TYPES,
  NEUTRAL_SYSTEMS,
  POWER_UNITS,
  VOLTAGE_DROP_UNITS,
  AUTO_SECTION,
} from "./constants.js";
import { COEFFICIENT_BOUNDS } from "./referenceData.js";
import { loadedConductorCount } from "./formulas.js";
import { FORM_KEYS } from "./inputs.js";

const isPositive = (value) => Number.isFinite(value) && value > 0;
const isNonNegative = (value) => Number.isFinite(value) && value >= 0;

export function validateInputs(inputs, provider) {
  const errors = Object.fromEntries(FORM_KEYS.map((key) => [key, {}]));
  const { circuit, load, cable, installation, coefficients, upstreamVoltageDrop, upstreamShortCircuit } = inputs;

  if (!isPositive(circuit.nominalVoltage)) errors.circuit.nominalVoltage = "Tension nominale requise (> 0 V).";
  if (!CIRCUIT_TYPES.includes(circuit.circuitType)) errors.circuit.circuitType = "Type de circuit invalide.";
  if (!NEUTRAL_SYSTEMS.includes(circuit.neutralSystem)) errors.circuit.neutralSystem = "Régime de neutre invalide.";

  if (!isPositive(load.power)) errors.load.power = "Puissance requise (> 0).";
  if (!POWER_UNITS.includes(load.powerUnit)) errors.load.powerUnit = "Unité invalide.";
  if (!LOAD_TYPES.includes(load.loadType)) errors.load.loadType = "Type de charge invalide.";
  if (!(load.powerFactor > 0 && load.powerFactor <= 1)) errors.load.powerFactor = "cos φ doit être compris entre 0 (exclu) et 1.";
  if (!(load.efficiency > 0 && load.efficiency <= 1)) errors.load.efficiency = "η doit être compris entre 0 (exclu) et 1.";
  if (!isPositive(load.cableLength)) errors.load.cableLength = "Longueur requise (> 0 m).";
  if (!(load.maxVoltageDrop > 0 && load.maxVoltageDrop <= 100)) errors.load.maxVoltageDrop = "ΔU maximale comprise entre 0 (exclu) et 100 %.";

  const loadedConductors = loadedConductorCount(circuit.circuitType);
  if (!CONDUCTOR_MATERIALS.includes(cable.material)) errors.cable.material = "Matériau invalide.";
  if (!INSULATION_TYPES.includes(cable.insulation)) errors.cable.insulation = "Isolant invalide.";
  if (!Number.isInteger(cable.conductorCount) || cable.conductorCount < loadedConductors || cable.conductorCount > 5) {
    errors.cable.conductorCount = `Entier entre ${loadedConductors} et 5 (${loadedConductors} conducteurs chargés minimum).`;
  }
  if (!provider.listInstallationMethods().some((method) => method.label === cable.installationMethod)) {
    errors.cable.installationMethod = "Mode de pose invalide.";
  }
  if (cable.section !== AUTO_SECTION && !isPositive(cable.section)) errors.cable.section = "Section invalide.";

  if (!(installation.ambientTemperature >= -20 && installation.ambientTemperature <= 100)) {
    errors.installation.ambientTemperature = "Température comprise entre -20 et 100 °C.";
  }
  if (!Number.isInteger(installation.groupedCircuits) || installation.groupedCircuits < 1) {
    errors.installation.groupedCircuits = "Nombre entier de circuits ≥ 1.";
  }

  if (!COEFFICIENT_MODES.includes(coefficients.mode)) errors.coefficients.mode = "Mode invalide.";
  if (coefficients.mode === "manual") {
    for (const key of ["k3", "k4", "k5"]) {
      const value = coefficients[key];
      if (!(value >= COEFFICIENT_BOUNDS.min && value <= COEFFICIENT_BOUNDS.max)) {
        errors.coefficients[key] = `${key.toUpperCase()} doit être compris entre ${COEFFICIENT_BOUNDS.min} et ${COEFFICIENT_BOUNDS.max}.`;
      }
    }
  }

  if (!isNonNegative(upstreamVoltageDrop.value)) errors.upstreamVoltageDrop.value = "ΔU amont requis (≥ 0).";
  if (!VOLTAGE_DROP_UNITS.includes(upstreamVoltageDrop.unit)) errors.upstreamVoltageDrop.unit = "Unité invalide.";

  if (!isNonNegative(upstreamShortCircuit.iccKa)) errors.upstreamShortCircuit.iccKa = "Icc amont requis (≥ 0 kA).";
  if (!isPositive(upstreamShortCircuit.breakingCapacityKa)) errors.upstreamShortCircuit.breakingCapacityKa = "Pouvoir de coupure requis (> 0 kA).";

  return errors;
}

export function hasErrors(errors) {
  return Object.values(errors).some((formErrors) => Object.keys(formErrors).length > 0);
}
