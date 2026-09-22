// Catalogue de prix de la nomenclature. Disjoncteurs, interrupteurs-sectionneurs et différentiels 30 mA :
// tarif réel du fournisseur SIAME 2023, en TND (voir siameCatalogue.js et la page Standards & Normes pour le
// détail complet). Câbles, contacteurs, relais thermiques, borniers et accessoires : ce fournisseur ne les liste
// pas dans ce tarif, les valeurs ci-dessous restent des estimations de prototype, à remplacer par un vrai catalogue.
//
// Convention : un prix absent renvoie { unitPrice: 0, priceMissing: true } — jamais un prix inventé à la volée.

import { findBreakerPrice, findRcdPrice, findSwitchDisconnectorPrice, RCD_RATINGS_A, SIAME_CATALOGUE_META } from "./siameCatalogue.js";

export const CATALOGUE = {
  status: "partial",
  currency: SIAME_CATALOGUE_META.currency,
  note: "Disjoncteurs, interrupteurs-sectionneurs et différentiels 30 mA : tarif SIAME 2023 (page Standards & Normes). Câbles, contacteurs, relais, borniers et accessoires : valeurs indicatives de prototype.",
};

// Pouvoir de coupure (Icu) retenu par défaut tant que l'Icc amont n'a pas encore été saisi pour le départ
// (formulaire « Icc amont » de la note de calcul) — correspond au bas de la gamme EP60 (10 kA, CEI 947-2).
export const DEFAULT_BREAKING_CAPACITY_KA = 10;

// Interrupteur-sectionneur et fusible (par calibre, A) — fusible : pas de tarif SIAME 2023, prototype.
const FUSE_PRICE = { 6: 3, 10: 3, 16: 3.5, 20: 4, 25: 4.5, 32: 5, 40: 6, 50: 8, 63: 10, 80: 16, 100: 19, 125: 24, 160: 34, 200: 42, 250: 55, 315: 70, 400: 88, 500: 110, 630: 135 };
// Câble multiconducteur cuivre PVC, TND/m par section (mm²) — prototype.
const CABLE_PRICE_PER_M = { "Cuivre|PVC": { 1.5: 1.1, 2.5: 1.6, 4: 2.5, 6: 3.6, 10: 5.9, 16: 9.2, 25: 14.5, 35: 20, 50: 28, 70: 39, 95: 53, 120: 67, 150: 83, 185: 103, 240: 135, 300: 170 } };
// Contacteur : [courant AC-3 max (A), prix]. Relais thermique : [courant max (A), prix] — prototype.
const CONTACTOR_PRICE = [[9, 32], [12, 38], [18, 49], [25, 68], [32, 92], [40, 135], [50, 170], [65, 230], [80, 290], [95, 340]];
const THERMAL_RELAY_PRICE = [[9, 48], [18, 55], [25, 62], [40, 88], [65, 120], [95, 165]];
// Bornier de raccordement : [section max (mm²), prix] — prototype.
const TERMINAL_PRICE = [[6, 6.5], [16, 14], [35, 28], [70, 55]];

const missing = { unitPrice: 0, priceMissing: true };
const priced = (unitPrice) => ({ unitPrice, priceMissing: false });
const fromTable = (table, key) => (table[key] !== undefined ? priced(table[key]) : missing);
const fromRanges = (ranges, value) => {
  const range = ranges.find(([max]) => value <= max);
  return range ? priced(range[1]) : missing;
};

export const catalogue = {
  // poles : 1/2/3/4 (Unipolaire…Tétrapolaire). minIcuKa : pouvoir de coupure requis (Icc amont) ; la famille la
  // moins chère qui le couvre pour ce calibre et ce nombre de pôles est retenue (EP60 < EP100 < EP250 < Hti).
  breaker: (rating, poles = 3, minIcuKa = DEFAULT_BREAKING_CAPACITY_KA) => {
    const sku = findBreakerPrice({ poles, rating, minIcuKa });
    return sku ? priced(sku.priceC) : missing;
  },
  // L'interrupteur-sectionneur SIAME n'existe qu'en 2 ou 4 pôles (avec neutre) : un besoin 3 pôles (triphasé sans
  // neutre) est servi par la version 4 pôles, la plus proche disponible au catalogue.
  switchDisconnector: (rating, poles = 4) => {
    const sku = findSwitchDisconnectorPrice({ poles: poles === 3 ? 4 : poles, rating });
    return sku ? priced(sku.price) : missing;
  },
  fuse: (rating) => fromTable(FUSE_PRICE, rating),
  cablePerMetre: (material, insulation, section) => {
    const table = CABLE_PRICE_PER_M[`${material}|${insulation}`];
    return table ? fromTable(table, section) : missing;
  },
  contactor: (current) => fromRanges(CONTACTOR_PRICE, current),
  thermalRelay: (current) => fromRanges(THERMAL_RELAY_PRICE, current),
  terminalBlock: (section) => fromRanges(TERMINAL_PRICE, section),
  // Interrupteur différentiel monobloc 30 mA : 2P (monophasé + neutre) ou 4P (triphasé + neutre).
  rcd: (rating, poles = 4) => {
    const sku = findRcdPrice({ poles, rating });
    return sku ? priced(sku.price) : missing;
  },
  dinRailMetre: () => priced(4.8),
  earthTerminal: () => priced(3.2),
  accessoryKit: () => priced(45),
  pushButtonKit: () => priced(28),
};

export { RCD_RATINGS_A };

// Nombre d'appareils modulaires supportés par un mètre de rail DIN (règle de prototype).
export const DEVICES_PER_DIN_RAIL = 8;
