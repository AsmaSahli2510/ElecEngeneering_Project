// Bilan de puissance d'une armoire, calculé à partir des calculs de départs enregistrés.
// Fonction pure : aucune ressaisie, tout provient des `calculations` (inputs + result) de chaque départ.
//
// Modèle (documenté, sans valeur normative) :
//   Pinstallée = Σ Pi                       (puissances nominales des départs, en kW)
//   Pdemandée  = Ks × Σ (Kui × Pi)          (Ks : simultanéité globale, Kui : utilisation du départ i)
//   Courant    : somme vectorielle des puissances absorbées pondérées (Ku puis Ks) :
//                P = Ks Σ Kui·Pabs,i   Q = Ks Σ Kui·Qi   S = √(P² + Q²)   Ib = S / (√3·U)
//                cos φ global = P / S
// Ks et les Ku sont des paramètres configurables ; leur valeur par défaut (1,00) n'ajoute aucune hypothèse.

import { powerToKw, SQRT3 } from "../calculation/formulas.js";

export const BALANCE_DEFAULTS = { simultaneityFactor: 1, utilizationFactor: 1 };

// Puissance nominale du départ en kW (kVA : S × cos φ).
export function nominalPowerKw(calculation) {
  const { power, powerUnit, powerFactor } = calculation.inputs.load;
  return powerUnit === "kVA" ? power * powerFactor : powerToKw(power, powerUnit);
}

const inRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

// feeders      : [{ _id, reference, designation, loadType }]
// calculations : documents CableCalculation (avec feederId, inputs, result, status, updatedAt)
// parameters   : { simultaneityFactor, utilizationFactors: { [feederId]: ku } }
export function computeBalance({ feeders, calculations, parameters = {} }) {
  const ks = Number(parameters.simultaneityFactor ?? BALANCE_DEFAULTS.simultaneityFactor);
  const kuById = parameters.utilizationFactors ?? {};
  const calculationByFeeder = new Map(calculations.map((calculation) => [String(calculation.feederId), calculation]));

  const errors = { simultaneityFactor: null, utilizationFactors: {} };
  if (!(ks > 0 && ks <= 1)) errors.simultaneityFactor = "Ks doit être compris entre 0 (exclu) et 1.";

  const missing = [];
  const lines = [];
  for (const feeder of feeders) {
    const calculation = calculationByFeeder.get(String(feeder._id));
    if (!calculation) {
      missing.push(feeder.reference);
      continue;
    }
    const ku = Number(kuById[feeder._id] ?? BALANCE_DEFAULTS.utilizationFactor);
    if (!inRange(ku, 0, 1)) errors.utilizationFactors[feeder._id] = "Ku doit être compris entre 0 et 1.";
    const { inputs, result } = calculation;
    lines.push({
      feederId: feeder._id,
      reference: feeder.reference,
      designation: feeder.designation,
      loadType: feeder.loadType,
      circuitType: inputs.circuit.circuitType,
      nominalVoltage: inputs.circuit.nominalVoltage,
      powerKw: nominalPowerKw(calculation),
      ku,
      powerFactor: inputs.load.powerFactor,
      designCurrent: result.designCurrent,
      absorbedKw: result.absorbedPowerKw,
      apparentKva: result.apparentPowerKva,
      reactiveKvar: Math.sqrt(Math.max(0, result.apparentPowerKva ** 2 - result.absorbedPowerKw ** 2)),
      section: result.cable.recommendedSection,
      status: calculation.status,
    });
  }

  const hasErrors = errors.simultaneityFactor !== null || Object.keys(errors.utilizationFactors).length > 0;
  const ready = feeders.length > 0 && missing.length === 0 && !hasErrors;
  const basedOn = calculations.length
    ? new Date(Math.max(...calculations.map((calculation) => new Date(calculation.updatedAt).getTime()))).toISOString()
    : null;
  const outcome = { ready, errors, missing, lines, totals: null, status: "incomplete", warnings: [], basedOn };
  if (!ready) return outcome;

  const sum = (pick) => lines.reduce((total, line) => total + pick(line), 0);
  const installedPowerKw = sum((line) => line.powerKw);
  const demandPowerKw = ks * sum((line) => line.ku * line.powerKw);
  const absorbedPowerKw = ks * sum((line) => line.ku * line.absorbedKw);
  const reactivePowerKvar = ks * sum((line) => line.ku * line.reactiveKvar);
  const apparentPowerKva = Math.hypot(absorbedPowerKw, reactivePowerKvar);

  const threePhase = lines.some((line) => line.circuitType === "Triphasé");
  const networkVoltage = Math.max(...lines.map((line) => line.nominalVoltage));
  const totalCurrent = apparentPowerKva > 0 ? (apparentPowerKva * 1000) / (threePhase ? SQRT3 * networkVoltage : networkVoltage) : 0;

  if (lines.some((line) => line.circuitType === "Monophasé") && threePhase) {
    outcome.warnings.push("Circuits monophasés additionnés aux circuits triphasés : répartition équilibrée des phases supposée.");
  }
  if (new Set(lines.map((line) => line.nominalVoltage)).size > 1) {
    outcome.warnings.push(`Tensions différentes selon les départs : le courant est calculé sous ${networkVoltage} V (tension la plus élevée).`);
  }

  outcome.totals = {
    feederCount: lines.length,
    installedPowerKw,
    demandPowerKw,
    absorbedPowerKw,
    apparentPowerKva,
    reactivePowerKvar,
    totalCurrent,
    globalPowerFactor: apparentPowerKva > 0 ? absorbedPowerKw / apparentPowerKva : 1,
    networkVoltage,
    phases: threePhase ? "Triphasé" : "Monophasé",
  };
  outcome.status = lines.every((line) => line.status === "validated") ? "validated" : "attention";
  return outcome;
}

// Forme envoyée à l'API pour enregistrer le bilan.
export function toBalancePayload(outcome, parameters) {
  return {
    parameters: {
      simultaneityFactor: Number(parameters.simultaneityFactor),
      utilizationFactors: outcome.lines.map((line) => ({ feederId: line.feederId, ku: line.ku })),
    },
    result: outcome.totals,
    lines: outcome.lines.map(({ feederId, reference, designation, loadType, powerKw, ku, powerFactor, designCurrent, section, status }) => ({
      feederId, reference, designation, loadType, powerKw, ku, powerFactor, designCurrent, section, status,
    })),
    status: outcome.status,
    basedOn: outcome.basedOn,
  };
}
