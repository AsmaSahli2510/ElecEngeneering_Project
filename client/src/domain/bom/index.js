// Nomenclature (BOM) : génération automatique depuis les départs calculés et le départ général,
// fusion avec les retouches de l'utilisateur, et totaux. Fonctions pures.
//
// Règles de génération (prototype, modifiables ici) :
//  - Départ général : protection générale (disjoncteur, ou interrupteur-sectionneur + fusibles) + câble.
//  - Chaque départ : disjoncteur (plus petit calibre normalisé >= Ib), câble (section calculée × longueur), bornier.
//      Moteur    : + contacteur, relais thermique, kit de commande marche/arrêt
//      Éclairage : + contacteur
//      Prises    : + différentiel 30 mA
//      Chauffage : + contacteur
//  - Armoire : rail DIN, bornes de terre (une par départ + une), kit d'accessoires.

import { suggestRating } from "../protection.js";
import { catalogue, DEFAULT_BREAKING_CAPACITY_KA, DEVICES_PER_DIN_RAIL, RCD_RATINGS_A } from "./catalogue.js";

export const BOM_CATEGORIES = ["Protection", "Câble", "Disjoncteur", "Interrupteur", "Contacteur", "Bornier", "Rail DIN", "Accessoire", "Composant de commande"];

const round2 = (value) => Math.round(value * 100) / 100;
export const lineTotal = (line) => round2(Number(line.quantity) * Number(line.unitPrice));
export const bomTotal = (items) => round2(items.reduce((sum, line) => sum + lineTotal(line), 0));

function line({ autoKey, sourceRef, reference, designation, category, quantity, unit = "u", price }) {
  return { autoKey, sourceRef, reference, designation, category, quantity, unit, unitPrice: price.unitPrice, priceMissing: price.priceMissing, source: "auto", edited: false };
}

const conductorLabel = (circuitType, count) => `${count ?? (circuitType === "Triphasé" ? 4 : 3)}G`;
const materialCode = (material) => (material === "Cuivre" ? "CU" : "AL");
const sectionLabel = (section) => String(section).replace(".", ",");

function cableLine({ autoKey, sourceRef, material, insulation, section, conductors, lengthM, prefix }) {
  return line({
    autoKey,
    sourceRef,
    reference: `CAB-${materialCode(material)}-${insulation.replace("/", "")}-${conductors}${section}`,
    designation: `${prefix}Câble ${material.toLowerCase()} ${insulation} ${conductors}${sectionLabel(section)} mm²`,
    category: "Câble",
    quantity: lengthM,
    unit: "m",
    price: catalogue.cablePerMetre(material, insulation, section),
  });
}

// mainFeeder : document MainFeeder enregistré (ou null) ; calculations : documents CableCalculation.
export function generateBom({ feeders, calculations, mainFeeder }) {
  const calculationByFeeder = new Map(calculations.map((calculation) => [String(calculation.feederId), calculation]));
  const lines = [];
  const warnings = [];

  if (mainFeeder) {
    const { inputs, result } = mainFeeder;
    const poles = result.phases === "Triphasé" ? 3 : 2;
    if (inputs.protectionType === "Disjoncteur") {
      lines.push(line({ autoKey: "main:protection", sourceRef: "Départ général", reference: `DJG-${inputs.rating}A-${poles}P`, designation: `Disjoncteur général ${inputs.rating} A ${poles}P`, category: "Disjoncteur", quantity: 1, price: catalogue.breaker(inputs.rating, poles, DEFAULT_BREAKING_CAPACITY_KA) }));
    } else {
      // L'interrupteur-sectionneur SIAME n'existe qu'en 2 ou 4 pôles (avec neutre) : un triphasé prend la version 4P.
      const switchPoles = result.phases === "Triphasé" ? 4 : 2;
      lines.push(line({ autoKey: "main:protection", sourceRef: "Départ général", reference: `ISG-${inputs.rating}A-${switchPoles}P`, designation: `Interrupteur-sectionneur général ${inputs.rating} A ${switchPoles}P`, category: "Interrupteur", quantity: 1, price: catalogue.switchDisconnector(inputs.rating, switchPoles) }));
      lines.push(line({ autoKey: "main:fuses", sourceRef: "Départ général", reference: `FUS-${inputs.rating}A`, designation: `Fusible ${inputs.rating} A`, category: "Protection", quantity: poles, price: catalogue.fuse(inputs.rating) }));
    }
    lines.push(cableLine({ autoKey: "main:cable", sourceRef: "Départ général", material: inputs.material, insulation: inputs.insulation, section: result.section, conductors: conductorLabel(result.phases, result.phases === "Triphasé" ? 4 : 3), lengthM: inputs.length, prefix: "Départ général — " }));
  }

  for (const feeder of feeders) {
    const calculation = calculationByFeeder.get(String(feeder._id));
    if (!calculation) {
      warnings.push(`${feeder.reference} : aucun calcul enregistré, départ ignoré.`);
      continue;
    }
    const { inputs, result } = calculation;
    const ref = feeder.reference;
    const current = result.designCurrent;
    const poles = inputs.circuit.circuitType === "Triphasé" ? 3 : 2;
    const rating = suggestRating(current);
    const requiredIcuKa = Number.isFinite(result.shortCircuit?.breakingCapacityKa) ? result.shortCircuit.breakingCapacityKa : DEFAULT_BREAKING_CAPACITY_KA;
    const tag = `${ref} — `;

    if (rating === null) {
      warnings.push(`${ref} : courant d'emploi ${current.toFixed(1)} A hors de la série de calibres, protection à définir manuellement.`);
    } else {
      if (rating > result.cable.correctedCurrentCapacity) {
        warnings.push(`${ref} : calibre normalisé ${rating} A supérieur à Iz (${result.cable.correctedCurrentCapacity.toFixed(1)} A), à vérifier.`);
      }
      lines.push(line({ autoKey: `${ref}:breaker`, sourceRef: ref, reference: `DJ-${rating}A-${poles}P`, designation: `${tag}Disjoncteur ${rating} A ${poles}P`, category: "Disjoncteur", quantity: 1, price: catalogue.breaker(rating, poles, requiredIcuKa) }));
    }
    lines.push(cableLine({ autoKey: `${ref}:cable`, sourceRef: ref, material: result.cable.material, insulation: result.cable.insulation, section: result.cable.recommendedSection, conductors: conductorLabel(inputs.circuit.circuitType, inputs.cable.conductorCount), lengthM: inputs.load.cableLength, prefix: tag }));
    lines.push(line({ autoKey: `${ref}:terminal`, sourceRef: ref, reference: `BRN-${sectionLabel(result.cable.recommendedSection)}`, designation: `${tag}Bornier de raccordement ${sectionLabel(result.cable.recommendedSection)} mm²`, category: "Bornier", quantity: 1, price: catalogue.terminalBlock(result.cable.recommendedSection) }));

    const loadType = inputs.load.loadType;
    if (loadType === "Moteur" || loadType === "Éclairage" || loadType === "Chauffage") {
      const contactorPrice = catalogue.contactor(current);
      lines.push(line({ autoKey: `${ref}:contactor`, sourceRef: ref, reference: `CT-${Math.ceil(current)}A`, designation: `${tag}Contacteur (courant d'emploi ${current.toFixed(1)} A)`, category: "Contacteur", quantity: 1, price: contactorPrice }));
    }
    if (loadType === "Moteur") {
      lines.push(line({ autoKey: `${ref}:relay`, sourceRef: ref, reference: `RT-${Math.ceil(current)}A`, designation: `${tag}Relais thermique (plage incluant ${current.toFixed(1)} A)`, category: "Protection", quantity: 1, price: catalogue.thermalRelay(current) }));
      lines.push(line({ autoKey: `${ref}:pushbutton`, sourceRef: ref, reference: "CMD-MA", designation: `${tag}Kit de commande marche/arrêt`, category: "Composant de commande", quantity: 1, price: catalogue.pushButtonKit() }));
    }
    if (loadType === "Prises") {
      const rcdPoles = inputs.circuit.circuitType === "Triphasé" ? 4 : 2;
      const rcdRating = suggestRating(current, RCD_RATINGS_A[rcdPoles]);
      lines.push(line({ autoKey: `${ref}:rcd`, sourceRef: ref, reference: `DDR-${rcdRating ?? "X"}A-30MA-${rcdPoles}P`, designation: `${tag}Interrupteur différentiel ${rcdRating ?? "?"} A 30 mA ${rcdPoles}P`, category: "Protection", quantity: 1, price: rcdRating ? catalogue.rcd(rcdRating, rcdPoles) : { unitPrice: 0, priceMissing: true } }));
    }
  }

  const devices = lines
    .filter((generated) => ["Disjoncteur", "Interrupteur", "Contacteur", "Protection"].includes(generated.category))
    .reduce((sum, generated) => sum + generated.quantity, 0);
  if (lines.length > 0) {
    lines.push(line({ autoKey: "cabinet:din-rail", sourceRef: "Armoire", reference: "RAIL-DIN-35", designation: "Rail DIN 35 mm (1 m)", category: "Rail DIN", quantity: Math.max(1, Math.ceil(devices / DEVICES_PER_DIN_RAIL)), unit: "m", price: catalogue.dinRailMetre() }));
    lines.push(line({ autoKey: "cabinet:earth", sourceRef: "Armoire", reference: "BRN-PE", designation: "Borne de terre (PE)", category: "Bornier", quantity: feeders.length + 1, price: catalogue.earthTerminal() }));
    lines.push(line({ autoKey: "cabinet:accessories", sourceRef: "Armoire", reference: "ACC-KIT", designation: "Kit d'accessoires (repérage, peignes d'alimentation, obturateurs)", category: "Accessoire", quantity: 1, price: catalogue.accessoryKit() }));
  }
  return { lines, warnings };
}

// Fusionne la nomenclature existante avec une génération fraîche :
//  - lignes manuelles et lignes automatiques retouchées (edited) : conservées telles quelles ;
//  - lignes automatiques non retouchées : remplacées par la version régénérée, ou supprimées si le besoin a disparu ;
//  - nouveaux besoins : ajoutés en fin de liste.
export function mergeBom(existing, generated) {
  const generatedByKey = new Map(generated.map((generatedLine) => [generatedLine.autoKey, generatedLine]));
  const seen = new Set();
  const items = [];
  const stats = { added: 0, updated: 0, removed: 0, keptEdited: 0 };

  for (const item of existing) {
    if (item.source !== "auto" || !item.autoKey) {
      items.push(item);
    } else if (item.edited) {
      items.push(item);
      seen.add(item.autoKey);
      stats.keptEdited += 1;
    } else if (generatedByKey.has(item.autoKey)) {
      items.push(generatedByKey.get(item.autoKey));
      seen.add(item.autoKey);
      stats.updated += 1;
    } else {
      stats.removed += 1;
    }
  }
  for (const generatedLine of generated) {
    if (!seen.has(generatedLine.autoKey)) {
      items.push(generatedLine);
      stats.added += 1;
    }
  }
  return { items, stats };
}

// Champs envoyés à l'API pour chaque ligne.
export function toBomPayload(items) {
  return items.map(({ reference, designation, category, unit, quantity, unitPrice, priceMissing, source, autoKey, sourceRef, edited }) => ({
    reference, designation, category, unit, quantity: Number(quantity), unitPrice: Number(unitPrice), priceMissing: Boolean(priceMissing), source, autoKey, sourceRef, edited: Boolean(edited),
  }));
}
