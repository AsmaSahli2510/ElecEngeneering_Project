// Formules de base : fonctions pures, sans dépendance aux tables de référence.

export const SQRT3 = Math.sqrt(3);

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  if (typeof value === "number") return value;
  return Number(String(value).trim().replace(",", "."));
}

// Nombre de conducteurs chargés (pour choisir la colonne de la table Iz).
// Un neutre non chargé (charge équilibrée) n'est pas compté ; un circuit 4 conducteurs triphasé reste donc à 3.
export function loadedConductorCount(circuitType) {
  return circuitType === "Triphasé" ? 3 : 2;
}

export function powerToKw(power, powerUnit) {
  return powerUnit === "W" ? power / 1000 : power;
}

// Ib = P / (√3 × U × cosφ × η) en triphasé, P / (U × cosφ × η) en monophasé.
// Pour une puissance apparente (kVA), cos φ et η sont déjà inclus : Ib = S / (√3 × U).
export function designCurrent({ power, powerUnit, nominalVoltage, circuitType, powerFactor, efficiency }) {
  const voltageFactor = circuitType === "Triphasé" ? SQRT3 * nominalVoltage : nominalVoltage;
  if (powerUnit === "kVA") return (power * 1000) / voltageFactor;
  return (powerToKw(power, powerUnit) * 1000) / (voltageFactor * powerFactor * efficiency);
}

// Puissance absorbée au réseau (kW) et puissance apparente (kVA) : données utiles au futur bilan de puissance.
export function absorbedPowerKw({ power, powerUnit, powerFactor, efficiency, apparentPowerKva }) {
  if (powerUnit === "kVA") return apparentPowerKva * powerFactor;
  return powerToKw(power, powerUnit) / efficiency;
}

export function apparentPowerKva({ current, nominalVoltage, circuitType }) {
  const voltageFactor = circuitType === "Triphasé" ? SQRT3 * nominalVoltage : nominalVoltage;
  return (current * voltageFactor) / 1000;
}

// ΔU = b × I × L × (R cosφ + X sinφ), avec b = √3 (triphasé) ou 2 (monophasé), L en km, R et X en Ω/km.
export function voltageDropVolts({ current, lengthM, rOhmPerKm, xOhmPerKm, powerFactor, circuitType }) {
  const b = circuitType === "Triphasé" ? SQRT3 : 2;
  const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor * powerFactor));
  const lengthKm = lengthM / 1000;
  return b * current * lengthKm * (rOhmPerKm * powerFactor + xOhmPerKm * sinPhi);
}

// ΔU% = ΔU / U × 100.
export function voltageDropPercent(volts, nominalVoltage) {
  return (volts / nominalVoltage) * 100;
}

// ΔU amont converti en % de la tension nominale (l'utilisateur peut le saisir en V).
export function upstreamDropToPercent({ value, unit, nominalVoltage }) {
  return unit === "V" ? (value / nominalVoltage) * 100 : value;
}

// ΔU disponible = ΔU max − ΔU amont.
export function availableVoltageDrop(maxPercent, upstreamPercent) {
  return maxPercent - upstreamPercent;
}
