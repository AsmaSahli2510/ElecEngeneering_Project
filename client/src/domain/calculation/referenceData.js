// Données de référence du prototype.
//
// IMPORTANT : ces valeurs sont un jeu de données de PROTOTYPE, saisi à partir de la CEI 60364-5-52
// (tableaux B.52.4, B.52.14, B.52.17) et de la CEI 60228. Elles n'ont pas été recoupées avec la table
// officielle utilisée par le projet et ne doivent pas être considérées comme normatives.
// Chaque table porte un champ `status: "prototype"` et un champ `source` : pour les remplacer, il suffit
// de modifier ce fichier (ou de fournir un autre fournisseur de référence, voir referenceProvider.js).
// Le moteur de calcul ne lit jamais ces constantes directement : il passe par le fournisseur.

export const CABLE_SECTIONS_MM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

// Modes de pose proposés à l'utilisateur, avec la méthode de référence CEI correspondante.
// Un mode de pose n'apparaît ici que si au moins une table Iz existe pour lui.
export const INSTALLATION_METHODS = [
  { label: "Conduit", iecMethod: "B2", description: "Câble multiconducteur en conduit apparent sur paroi" },
  { label: "Fixé sur paroi", iecMethod: "C", description: "Câble multiconducteur fixé directement sur paroi" },
  { label: "Chemin de câbles", iecMethod: "E", description: "Câble multiconducteur sur chemin de câbles perforé" },
];

const rows = (values) => CABLE_SECTIONS_MM2.map((section, index) => ({ section, iz: values[index] }));

// Courants admissibles Iz_table (A) par section.
// Clé de sélection d'une table : matériau + isolant + mode de pose + nombre de conducteurs chargés.
// Pour ajouter une table (aluminium, PR/EPR, conducteurs chargés = 2...) : ajouter un objet à ce tableau.
export const CURRENT_CAPACITY_TABLES = [
  {
    id: "CU-PVC-B2-3",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Conduit",
    loadedConductors: 3,
    source: "CEI 60364-5-52, tableau B.52.4, méthode B2, PVC, cuivre, 3 conducteurs chargés",
    status: "prototype",
    rows: rows([15, 20, 27, 34, 46, 62, 80, 99, 118, 149, 179, 206, 225, 255, 297, 339]),
  },
  {
    id: "CU-PVC-C-3",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Fixé sur paroi",
    loadedConductors: 3,
    source: "CEI 60364-5-52, tableau B.52.4, méthode C, PVC, cuivre, 3 conducteurs chargés",
    status: "prototype",
    rows: rows([17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403, 464]),
  },
  {
    id: "CU-PVC-E-3",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Chemin de câbles",
    loadedConductors: 3,
    source: "CEI 60364-5-52, tableau B.52.4, méthode E, PVC, cuivre, 3 conducteurs chargés",
    status: "prototype",
    rows: rows([18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430, 497]),
  },
  {
    id: "CU-PVC-B2-2",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Conduit",
    loadedConductors: 2,
    source: "CEI 60364-5-52, tableau B.52.4, méthode B2, PVC, cuivre, 2 conducteurs chargés",
    status: "prototype",
    rows: rows([16.5, 23, 30, 38, 52, 69, 90, 111, 133, 168, 201, 232, 258, 294, 344, 394]),
  },
  {
    id: "CU-PVC-C-2",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Fixé sur paroi",
    loadedConductors: 2,
    source: "CEI 60364-5-52, tableau B.52.4, méthode C, PVC, cuivre, 2 conducteurs chargés",
    status: "prototype",
    rows: rows([19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461, 530]),
  },
  {
    id: "CU-PVC-E-2",
    material: "Cuivre",
    insulation: "PVC",
    installationMethod: "Chemin de câbles",
    loadedConductors: 2,
    source: "CEI 60364-5-52, tableau B.52.4, méthode E, PVC, cuivre, 2 conducteurs chargés",
    status: "prototype",
    rows: rows([22, 30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328, 379, 434, 514, 593]),
  },
];

// Caractéristiques électriques des âmes : R20 (Ω/km, CEI 60228 classe 2) et coefficient de température.
// La résistance est ramenée à la température de service de l'isolant : R = R20 × (1 + α (θ − 20)).
// R et X sont donc propres au câble choisi (matériau, isolant, section), jamais saisis à la main.
export const CONDUCTOR_ELECTRICAL_DATA = {
  Cuivre: {
    alphaPerKelvin: 0.00393,
    r20OhmPerKm: rowsByKey([12.1, 7.41, 4.61, 3.08, 1.83, 1.15, 0.727, 0.524, 0.387, 0.268, 0.193, 0.153, 0.124, 0.0991, 0.0754, 0.0601]),
    source: "CEI 60228 (R20, classe 2) ; α cuivre = 0,00393 /K",
    status: "prototype",
  },
  // Aluminium : volontairement absent tant qu'aucune table Iz aluminium n'est renseignée.
};

function rowsByKey(values) {
  return Object.fromEntries(CABLE_SECTIONS_MM2.map((section, index) => [section, values[index]]));
}

// Température maximale de service de l'âme selon l'isolant (°C).
export const OPERATING_TEMPERATURE_C = { PVC: 70, "PR/EPR": 90 };

// Réactance linéique (Ω/km) d'un câble multiconducteur. Valeur unique de prototype (~0,08 Ω/km).
export const CABLE_REACTANCE_OHM_PER_KM = { value: 0.08, source: "Valeur usuelle câble multiconducteur (prototype)", status: "prototype" };

// K3 — température ambiante (air, référence 30 °C). Couples [température °C, coefficient], CEI 60364-5-52 B.52.14.
export const K3_TEMPERATURE_TABLES = {
  PVC: {
    source: "CEI 60364-5-52, tableau B.52.14 (PVC)",
    status: "prototype",
    points: [[10, 1.22], [15, 1.17], [20, 1.12], [25, 1.06], [30, 1.0], [35, 0.94], [40, 0.87], [45, 0.79], [50, 0.71], [55, 0.61], [60, 0.5]],
  },
  "PR/EPR": {
    source: "CEI 60364-5-52, tableau B.52.14 (PR/EPR)",
    status: "prototype",
    points: [[10, 1.15], [15, 1.12], [20, 1.08], [25, 1.04], [30, 1.0], [35, 0.96], [40, 0.91], [45, 0.87], [50, 0.82], [55, 0.76], [60, 0.71], [65, 0.65], [70, 0.58], [75, 0.5], [80, 0.41]],
  },
};

// K4 — groupement de circuits. Couples [nombre de circuits, coefficient], CEI 60364-5-52 B.52.17.
// Pour un nombre de circuits intermédiaire on retient la ligne supérieure (plus défavorable).
export const K4_GROUPING_TABLES = {
  Conduit: {
    source: "CEI 60364-5-52, tableau B.52.17, ligne 1 (câbles jointifs)",
    status: "prototype",
    points: [[1, 1.0], [2, 0.8], [3, 0.7], [4, 0.65], [5, 0.6], [6, 0.57], [7, 0.54], [8, 0.52], [9, 0.5], [12, 0.45], [16, 0.41], [20, 0.38]],
  },
  "Fixé sur paroi": {
    source: "CEI 60364-5-52, tableau B.52.17, ligne 2 (une couche sur paroi)",
    status: "prototype",
    points: [[1, 1.0], [2, 0.85], [3, 0.79], [4, 0.75], [5, 0.73], [6, 0.72], [7, 0.72], [8, 0.71], [9, 0.7]],
  },
  "Chemin de câbles": {
    source: "CEI 60364-5-52, tableau B.52.17, ligne 4 (une couche sur chemin de câbles perforé)",
    status: "prototype",
    points: [[1, 1.0], [2, 0.88], [3, 0.82], [4, 0.77], [5, 0.75], [6, 0.73], [7, 0.73], [8, 0.72], [9, 0.72]],
  },
};

// K5 — installation particulière. Aucune valeur tabulée dans le prototype hormis "sans particularité" = 1,00.
export const K5_SPECIAL_INSTALLATION = {
  none: { value: 1.0, source: "Aucune condition particulière", status: "prototype" },
};

// Valeurs de test du prototype pour les coefficients (saisie contrôlée par défaut). Non normatives.
export const TEST_COEFFICIENTS = { k3: 1.0, k4: 0.8, k5: 1.0 };

// Plage acceptée pour une saisie manuelle de K3, K4 ou K5.
export const COEFFICIENT_BOUNDS = { min: 0.1, max: 1.5 };

// Valeurs par défaut de cos φ et η selon le type de charge (prototype, modifiables dans le formulaire 2).
export const LOAD_TYPE_DEFAULTS = {
  Moteur: { powerFactor: 0.85, efficiency: 0.9 },
  Éclairage: { powerFactor: 0.95, efficiency: 1 },
  Prises: { powerFactor: 0.9, efficiency: 1 },
  Chauffage: { powerFactor: 1, efficiency: 1 },
  Autre: { powerFactor: 0.9, efficiency: 1 },
};
