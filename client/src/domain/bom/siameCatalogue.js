// Catalogue tarifaire réel du fournisseur SIAME (tarifs 2023, date d'effet 01/06/2023) : disjoncteurs modulaires,
// disjoncteurs différentiels, interrupteurs différentiels et interrupteurs-sectionneurs.
// Transcription fidèle du tarif fournisseur (PDF "DEVIS-DVT260375- STE ELECPOWER-09 MARS 26.pdf").
// Les montants sont imprimés en millimes dans le tarif fournisseur (1 TND = 1000 millimes) ; ils sont convertis
// ici en dinars tunisiens (TND) — ex. « 12 700 » au tarif devient 12.7 TND.
//
// Ce module est la source unique pour :
//  - la page de consultation du catalogue (Standards & Normes) ;
//  - la sélection automatique du matériel de protection dans la nomenclature (voir bom/catalogue.js).

export const SIAME_CATALOGUE_META = {
  supplier: "SIAME",
  documentTitle: "SIAME Tarifs 2023",
  effectiveDate: "2023-06-01",
  currency: "TND",
  note: "Prix unitaires HT, hors pose. Tarif fournisseur SIAME 2023 (montants imprimés en millimes, convertis ici en dinars tunisiens).",
};

export const POLE_WORDS = { 1: "Unipolaire", 2: "Bipolaire", 3: "Tripolaire", 4: "Tétrapolaire" };

// Une ligne de tarif : { poles, ratingsA: [calibres regroupés au même prix], priceC, priceAlt }
// `priceAlt` est la seconde colonne du tarif (courbe BD ou B) quand elle existe, sinon null.
function row(poles, ratingsA, priceC, priceAlt = null) {
  return { poles, ratingsA, priceC, priceAlt };
}

function family({ id, title, standard, icuKa, deviceLabel, labelStyle = "word", columns, rows }) {
  return { id, title, standard, icuKa, deviceLabel, labelStyle, columns, rows };
}

// ---------------------------------------------------------------------------------------------------------------
// DISJONCTEURS
// ---------------------------------------------------------------------------------------------------------------

const disjoncteurs = [
  family({
    id: "ep60-6-10ka",
    title: "Disjoncteur modulaire EP60 — 6 kA (EN 898) / 10 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 10,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(1, [6], 12.7, 14.5),
      row(2, [6], 25.3, 29.1),
      row(3, [6], 43.1, 49.3),
      row(4, [6], 61.5, 69.4),
      row(1, [10, 16, 20, 25], 10.3, 12.5),
      row(2, [10, 16, 20, 25], 20.2, 24.8),
      row(3, [10, 16, 20, 25], 36.7, 42.0),
      row(4, [10, 16, 20, 25], 51.1, 59.0),
      row(1, [32, 40], 13.2, 14.8),
      row(2, [32, 40], 26.4, 29.4),
      row(3, [32, 40], 43.7, 49.3),
      row(4, [32, 40], 62.4, 69.9),
      row(1, [50, 63], 23.9, 26.1),
      row(2, [50, 63], 48.8, 52.3),
      row(3, [50, 63], 71.4, 78.2),
      row(4, [50, 63], 95.2, 104.4),
    ],
  }),
  family({
    id: "ep100-10-15ka",
    title: "Disjoncteur modulaire EP100 — 10 kA (EN 898) / 15 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(1, [6], 16.6, 18.7),
      row(2, [6], 33.2, 37.1),
      row(3, [6], 56.0, 61.6),
      row(4, [6], 82.2, 90.9),
      row(1, [10, 16, 20, 25], 15.2, 16.6),
      row(2, [10, 16, 20, 25], 30.4, 33.2),
      row(3, [10, 16, 20, 25], 46.5, 54.4),
      row(4, [10, 16, 20, 25], 66.1, 74.5),
      row(1, [32, 40], 16.5, 18.2),
      row(2, [32, 40], 33.0, 36.3),
      row(3, [32, 40], 54.4, 59.8),
      row(4, [32, 40], 74.1, 81.6),
      row(1, [50, 63], 25.1, 27.4),
      row(2, [50, 63], 51.2, 54.9),
      row(3, [50, 63], 75.0, 82.1),
      row(4, [50, 63], 100.0, 109.6),
    ],
  }),
  family({
    id: "ep250-25ka",
    title: "Disjoncteur modulaire EP250 — 25 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 25,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(2, [6], 65.0),
      row(3, [6], 100.8),
      row(4, [6], 135.5),
      row(2, [10, 16], 49.8, 52.3),
      row(3, [10, 16], 85.6),
      row(4, [10, 16], 129.0, 135.4),
      row(2, [20], 53.1, 55.7),
      row(3, [20], 95.4),
      row(4, [20], 130.1),
      row(2, [25], 56.3, 59.1),
      row(3, [25], 100.8),
      row(4, [25], 132.3),
    ],
  }),
  family({
    id: "ep250-20ka",
    title: "Disjoncteur modulaire EP250 — 20 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 20,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C", "Courbes BD"],
    rows: [row(2, [32], 57.4, 60.2), row(4, [32], 157.2, 165.0), row(2, [40], 61.7), row(4, [40], 163.7, 172.0)],
  }),
  family({
    id: "ep250-15ka",
    title: "Disjoncteur modulaire EP250 — 15 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C", "Courbes BD"],
    rows: [row(2, [50], 107.3), row(4, [50], 234.3, 246.0), row(2, [63], 122.5), row(3, [63], 185.4), row(4, [63], 265.7)],
  }),
  family({
    id: "cp60",
    title: "Disjoncteur CP60 (1P+N, 1 module) — 6 kA (EN 898) / 7,5 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 7.5,
    deviceLabel: "Disjoncteur CP60 (1P+N)",
    labelStyle: "range",
    columns: ["Courbe C"],
    rows: [row(null, [6, 10, 16, 20, 25, 32], 17.0)],
  }),
  family({
    id: "dp60-30ma",
    title: "Disjoncteur différentiel monobloc DP60 — 30 mA — 6 kA (EN 898) / 10 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 10,
    deviceLabel: "Disjoncteur DP60 différentiel 30 mA",
    labelStyle: "range",
    columns: ["Courbe C"],
    rows: [row(null, [6, 10, 16, 20, 25, 32, 40], 84.7)],
  }),
  family({
    id: "dp60-300ma",
    title: "Disjoncteur différentiel monobloc DP60 — 300 mA — 6 kA (EN 898) / 10 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 10,
    deviceLabel: "Disjoncteur DP60 différentiel 300 mA",
    labelStyle: "range",
    columns: ["Courbe C"],
    rows: [row(null, [6, 10, 16, 20, 25, 32, 40], 77.6)],
  }),
  family({
    id: "ep60-diff-30ma",
    title: "Disjoncteur différentiel EP60 — 30 mA — 6 kA (EN 898) / 10 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 10,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(2, [6], 132.6, 146.5),
      row(4, [6], 180.4, 198.1),
      row(2, [10, 16, 20, 25], 123.1, 138.2),
      row(4, [10, 16, 20, 25], 171.0, 189.9),
      row(2, [32], 132.9, 146.9),
      row(4, [32], 178.8, 196.8),
      row(2, [40], 181.2, 200.4),
      row(4, [40], 227.0, 250.4),
      row(2, [50, 63], 184.2, 202.6),
      row(4, [50, 63], 236.1, 259.9),
    ],
  }),
  family({
    id: "ep100-diff-30ma",
    title: "Disjoncteur différentiel EP100 — 30 mA — 10 kA (EN 898) / 15 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(2, [6], 139.4, 153.0),
      row(4, [6], 192.6, 211.6),
      row(2, [10, 16, 20, 25], 129.9, 146.0),
      row(4, [10, 16, 20, 25], 183.0, 204.5),
      row(2, [32], 132.9, 146.4),
      row(2, [40], 176.4, 194.2),
      row(4, [32], 194.1, 205.3),
      row(4, [40], 229.9, 253.0),
      row(2, [50, 63], 181.6, 199.7),
      row(4, [50, 63], 242.0, 266.0),
    ],
  }),
  family({
    id: "ep250-diff-30ma-25ka",
    title: "Disjoncteur différentiel EP250 — 30 mA — 25 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 25,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [6], 175.6, 184.3), row(4, [6], 290.6, 304.8), row(2, [10, 16, 20, 25], 164.7, 172.9), row(4, [10, 16, 20, 25], 265.8, 279.2)],
  }),
  family({
    id: "ep250-diff-30ma-20ka",
    title: "Disjoncteur différentiel EP250 — 30 mA — 20 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 20,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [32], 167.4, 175.8), row(4, [32], 291.8, 306.4), row(2, [40], 172.8, 181.5), row(4, [40], 293.2, 307.8)],
  }),
  family({
    id: "ep250-diff-30ma-15ka",
    title: "Disjoncteur différentiel EP250 — 30 mA — 15 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [50], 227.0, 238.4), row(4, [50], 418.3, 439.2), row(2, [63], 241.8, 254.0), row(4, [63], 450.9, 473.5)],
  }),
  family({
    id: "ep60-diff-300ma",
    title: "Disjoncteur différentiel EP60 — 300 mA — 6 kA (EN 898) / 10 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 10,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(2, [6], 129.5, 144.1),
      row(4, [6], 173.8, 190.6),
      row(2, [10, 16, 20, 25], 120.8, 136.5),
      row(4, [10, 16, 20, 25], 165.0, 180.9),
      row(2, [32], 131.1, 145.1),
      row(4, [32], 175.2, 189.4),
      row(2, [40], 155.9, 171.4),
      row(4, [40], 203.2, 223.4),
      row(2, [50, 63], 165.1, 181.6),
      row(4, [50, 63], 233.5, 257.5),
    ],
  }),
  family({
    id: "ep100-diff-300ma",
    title: "Disjoncteur différentiel EP100 — 300 mA — 10 kA (EN 898) / 15 kA (CEI 947-2)",
    standard: "EN 898 · CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C", "Courbes BD"],
    rows: [
      row(2, [6], 132.7, 147.9),
      row(4, [6], 187.5, 206.0),
      row(2, [10, 16, 20, 25], 121.6, 136.5),
      row(4, [10, 16, 20, 25], 176.5, 179.2),
      row(2, [32], 131.1, 144.2),
      row(4, [32], 183.0, 192.6),
      row(2, [40], 154.8, 170.1),
      row(4, [40], 203.2, 227.7),
      row(2, [50, 63], 161.9, 179.4),
      row(4, [50, 63], 239.4, 263.2),
    ],
  }),
  family({
    id: "ep250-diff-300ma-25ka",
    title: "Disjoncteur différentiel EP250 — 300 mA — 25 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 25,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [6], 173.2, 181.8), row(4, [6], 277.0, 290.8), row(2, [10, 16, 20, 25], 161.9, 170.0), row(4, [10, 16, 20, 25], 257.9, 270.8)],
  }),
  family({
    id: "ep250-diff-300ma-20ka",
    title: "Disjoncteur différentiel EP250 — 300 mA — 20 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 20,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [32], 165.4, 173.6), row(4, [32], 283.8, 298.0), row(2, [40], 170.3, 178.9), row(4, [40], 285.2, 299.5)],
  }),
  family({
    id: "ep250-diff-300ma-15ka",
    title: "Disjoncteur différentiel EP250 — 300 mA — 15 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 15,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C", "Courbes B"],
    rows: [row(2, [50, 63], 237.9, 249.9), row(4, [50, 63], 440.3, 462.3)],
  }),
  family({
    id: "hti-16ka",
    title: "Disjoncteur modulaire Hti — 16 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 16,
    deviceLabel: "Disjoncteur",
    columns: ["Courbes C"],
    rows: [
      row(2, [80], 177.2),
      row(3, [80], 218.3),
      row(4, [80], 294.1),
      row(2, [100], 203.8),
      row(3, [100], 243.9),
      row(4, [100], 325.4),
      row(2, [125], 246.1),
      row(3, [125], 345.8),
      row(4, [125], 408.9),
    ],
  }),
  family({
    id: "hti-diff-30ma-16ka",
    title: "Disjoncteur différentiel Hti — 30 mA — 16 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 16,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C"],
    rows: [row(4, [80], 712.4), row(4, [100], 732.2)],
  }),
  family({
    id: "hti-diff-300ma-16ka",
    title: "Disjoncteur différentiel Hti — 300 mA — 16 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 16,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C"],
    rows: [row(4, [80], 683.6), row(4, [100], 704.1)],
  }),
  family({
    id: "hti-diff-30ma-25ka",
    title: "Disjoncteur différentiel Hti — 30 mA — 25 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 25,
    deviceLabel: "Disjoncteur différentiel 30 mA",
    columns: ["Courbes C"],
    rows: [row(4, [80], 748.2), row(4, [100], 754.2)],
  }),
  family({
    id: "hti-diff-300ma-25ka",
    title: "Disjoncteur différentiel Hti — 300 mA — 25 kA (CEI 947-2)",
    standard: "CEI 947-2",
    icuKa: 25,
    deviceLabel: "Disjoncteur différentiel 300 mA",
    columns: ["Courbes C"],
    rows: [row(4, [80], 720.0), row(4, [100], 725.0)],
  }),
];

// ---------------------------------------------------------------------------------------------------------------
// INTERRUPTEURS
// ---------------------------------------------------------------------------------------------------------------

const interrupteurs = [
  family({
    id: "interrupteur-diff-monobloc-30ma",
    title: "Interrupteur différentiel monobloc FP — 30 mA — EN 61008-1",
    standard: "EN 61008-1",
    icuKa: null,
    deviceLabel: "Interrupteur Diff. Monobloc",
    labelStyle: "P",
    columns: ["Prix unitaire HT"],
    rows: [
      row(2, [16, 20, 25], 95.7),
      row(2, [32, 40], 97.2),
      row(2, [80], 163.7),
      row(4, [25], 166.8),
      row(4, [40], 170.5),
      row(4, [63], 240.0),
    ],
  }),
  family({
    id: "interrupteur-diff-monobloc-300ma",
    title: "Interrupteur différentiel monobloc FP — 300 mA — EN 61008-1",
    standard: "EN 61008-1",
    icuKa: null,
    deviceLabel: "Interrupteur Diff. Monobloc",
    labelStyle: "P",
    columns: ["Prix unitaire HT"],
    rows: [
      row(2, [25], 89.5),
      row(2, [40], 89.5),
      row(2, [80], 163.2),
      row(4, [25], 165.2),
      row(4, [40], 173.5),
      row(4, [63], 238.6),
    ],
  }),
  family({
    id: "interrupteur-sectionneur",
    title: "Interrupteurs sectionneurs",
    standard: null,
    icuKa: null,
    deviceLabel: "Interrupteur Sectionneur",
    labelStyle: "x",
    columns: ["Prix unitaire HT"],
    rows: [
      row(2, [25], 31.5),
      row(2, [32], 35.3),
      row(2, [40], 34.7),
      row(2, [63], 34.7),
      row(2, [80], 55.3),
      row(2, [100], 55.3),
      row(4, [25], 61.3),
      row(4, [32], 61.3),
      row(4, [40], 68.4),
      row(4, [63], 77.0),
      row(4, [80], 100.9),
      row(4, [100], 100.9),
      row(4, [125], 100.9),
    ],
  }),
];

export const SIAME_SECTIONS = [
  { id: "disjoncteurs", title: "Disjoncteurs", families: disjoncteurs },
  { id: "interrupteurs", title: "Interrupteurs", families: interrupteurs },
];

export const SIAME_FAMILIES = [...disjoncteurs, ...interrupteurs];

// Libellé d'une ligne, dans le style de la désignation imprimée au tarif (ex. « Disjoncteur Bipolaire 10-16-20-25A »,
// « Interrupteur Diff. Monobloc 4P 25A », « Interrupteur Sectionneur 2x40A »).
export function siameRowLabel(fam, r) {
  const ratings = `${r.ratingsA.join("-")}A`;
  if (fam.labelStyle === "x") return `${fam.deviceLabel} ${r.poles}x${ratings}`;
  if (fam.labelStyle === "P") return `${fam.deviceLabel} ${r.poles}P ${ratings}`;
  if (fam.labelStyle === "range") return `${fam.deviceLabel} ${ratings}`;
  return `${fam.deviceLabel} ${POLE_WORDS[r.poles]} ${ratings}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Sélection automatique (nomenclature) : mise à plat des tables par calibre unitaire, pour un accès direct
// { poles, calibre } -> prix. Un même calibre couvert par une plage tarifaire (ex. « 10-16-20-25A ») partage le
// prix de la plage, exactement comme au tarif fournisseur.
// ---------------------------------------------------------------------------------------------------------------

function expandSkus(familyIds) {
  return SIAME_FAMILIES.filter((fam) => familyIds.includes(fam.id)).flatMap((fam) =>
    fam.rows.flatMap((r) => r.ratingsA.map((rating) => ({ icuKa: fam.icuKa, poles: r.poles, rating, priceC: r.priceC, priceAlt: r.priceAlt }))),
  );
}

// Disjoncteurs modulaires "standard" seulement : DP60/CP60 (monobloc 1P+N) et les versions différentielles
// intégrées sont des variantes spécifiques, pas des substituts d'un disjoncteur de départ classique.
const BREAKER_FAMILY_IDS = ["ep60-6-10ka", "ep100-10-15ka", "ep250-25ka", "ep250-20ka", "ep250-15ka", "hti-16ka"];
const BREAKER_SKUS = expandSkus(BREAKER_FAMILY_IDS);

// Calibre le moins cher parmi les familles dont le pouvoir de coupure (Icu) couvre l'Icc amont requis.
export function findBreakerPrice({ poles, rating, minIcuKa = 0 }) {
  const candidates = BREAKER_SKUS.filter((sku) => sku.poles === poles && sku.rating === rating && sku.icuKa >= minIcuKa);
  if (candidates.length === 0) return null;
  return candidates.reduce((cheapest, sku) => (sku.priceC < cheapest.priceC ? sku : cheapest));
}

const SWITCH_SKUS = expandSkus(["interrupteur-sectionneur"]);
export function findSwitchDisconnectorPrice({ poles, rating }) {
  const sku = SWITCH_SKUS.find((s) => s.poles === poles && s.rating === rating);
  return sku ? { price: sku.priceC } : null;
}

const RCD_SKUS = expandSkus(["interrupteur-diff-monobloc-30ma"]);
export function findRcdPrice({ poles, rating }) {
  const sku = RCD_SKUS.find((s) => s.poles === poles && s.rating === rating);
  return sku ? { price: sku.priceC } : null;
}

// Calibres réellement au catalogue pour l'interrupteur différentiel monobloc 30 mA, par nombre de pôles
// (2P : circuit monophasé + neutre ; 4P : circuit triphasé + neutre) — pour choisir un calibre normalisé
// qui a effectivement un prix, plutôt que la série générique de calibres de disjoncteurs.
export const RCD_RATINGS_A = { 2: [16, 20, 25, 32, 40, 80], 4: [25, 40, 63] };
