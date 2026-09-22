// Énumérations partagées par l'interface, le moteur de calcul et (en miroir) le modèle serveur.
// Les libellés sont ceux affichés à l'utilisateur ; les codes de statut sont ceux stockés en base.

export const LOAD_TYPES = ["Moteur", "Éclairage", "Prises", "Chauffage", "Autre"];
export const POWER_UNITS = ["kW", "W", "kVA"];
export const CIRCUIT_TYPES = ["Triphasé", "Monophasé"];
export const NEUTRAL_SYSTEMS = ["TT", "TN-S", "TN-C", "IT"];
export const CONDUCTOR_MATERIALS = ["Cuivre", "Aluminium"];
export const INSULATION_TYPES = ["PVC", "PR/EPR"];
export const VOLTAGE_DROP_UNITS = ["%", "V"];
export const COEFFICIENT_MODES = ["auto", "manual"];

export const CHECK_STATUS = { COMPLIANT: "compliant", NON_COMPLIANT: "non_compliant" };
export const CALCULATION_STATUS = { VALIDATED: "validated", NON_COMPLIANT: "non_compliant" };
export const FEEDER_STATUS = { DRAFT: "draft", CALCULATED: "calculated", NON_COMPLIANT: "non_compliant" };

export const CHECK_STATUS_LABELS = {
  [CHECK_STATUS.COMPLIANT]: "Conforme",
  [CHECK_STATUS.NON_COMPLIANT]: "Non conforme",
};

export const CALCULATION_STATUS_LABELS = {
  [CALCULATION_STATUS.VALIDATED]: "Calcul validé",
  [CALCULATION_STATUS.NON_COMPLIANT]: "Calcul non conforme",
};

export const FEEDER_STATUS_LABELS = {
  [FEEDER_STATUS.DRAFT]: "À calculer",
  [FEEDER_STATUS.CALCULATED]: "Calculé ✓",
  [FEEDER_STATUS.NON_COMPLIANT]: "Non conforme ✗",
};

export const AUTO_SECTION = "auto";
