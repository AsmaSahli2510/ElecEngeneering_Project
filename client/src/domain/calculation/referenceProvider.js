// Fournisseur de données de référence.
//
// Le moteur de calcul (index.js) dépend uniquement de cette interface :
//
//   listInstallationMethods()                       -> [{ label, iecMethod, description }]
//   listSections()                                  -> [section mm²] (sections proposées en saisie manuelle)
//   findCurrentCapacityTable({ material, insulation, installationMethod, loadedConductors })
//                                                   -> { id, source, status, rows: [{ section, iz }] } | null
//   getConductorElectricalProperties({ material, insulation, section })
//                                                   -> { rOhmPerKm, xOhmPerKm, operatingTemperatureC, source, status } | null
//   getCorrectionFactors({ insulation, installationMethod, ambientTemperature, groupedCircuits, specialInstallation })
//                                                   -> { k3, k4, k5 } où chacun vaut { value, source, status } | { value: null, reason }
//
// Pour brancher d'autres tables (base de données, autre norme...), fournir un objet respectant cette
// interface à calculateFeeder(inputs, provider).

import {
  CABLE_REACTANCE_OHM_PER_KM,
  CABLE_SECTIONS_MM2,
  CONDUCTOR_ELECTRICAL_DATA,
  CURRENT_CAPACITY_TABLES,
  INSTALLATION_METHODS,
  K3_TEMPERATURE_TABLES,
  K4_GROUPING_TABLES,
  K5_SPECIAL_INSTALLATION,
  OPERATING_TEMPERATURE_C,
} from "./referenceData.js";

// Première ligne dont la clé est >= à la valeur cherchée (choix conservatif pour K3 et K4).
// Retourne null si la valeur dépasse la dernière ligne et que `clampAbove` est faux.
function lookupUpward(points, key, { clampAbove = false } = {}) {
  const point = points.find(([tableKey]) => tableKey >= key);
  if (point) return point[1];
  return clampAbove ? points[points.length - 1][1] : null;
}

function resolveK3({ insulation, ambientTemperature }) {
  const table = K3_TEMPERATURE_TABLES[insulation];
  if (!table) return { value: null, reason: `Pas de table K3 pour l'isolant « ${insulation} ».` };
  const [minTemperature] = table.points[0];
  const [maxTemperature] = table.points[table.points.length - 1];
  if (ambientTemperature < minTemperature) {
    return { value: table.points[0][1], source: `${table.source} (température inférieure à ${minTemperature} °C : valeur de ${minTemperature} °C)`, status: table.status };
  }
  const value = lookupUpward(table.points, ambientTemperature);
  if (value === null) return { value: null, reason: `Température ambiante supérieure à ${maxTemperature} °C : hors table K3, saisir K3 manuellement.` };
  return { value, source: table.source, status: table.status };
}

function resolveK4({ installationMethod, groupedCircuits }) {
  const table = K4_GROUPING_TABLES[installationMethod];
  if (!table) return { value: null, reason: `Pas de table K4 pour le mode de pose « ${installationMethod} ».` };
  const value = lookupUpward(table.points, groupedCircuits, { clampAbove: true });
  return { value, source: table.source, status: table.status };
}

function resolveK5({ specialInstallation }) {
  if (specialInstallation) {
    return { value: null, reason: "Installation particulière : aucune valeur tabulée dans le prototype, saisir K5 manuellement." };
  }
  return { ...K5_SPECIAL_INSTALLATION.none };
}

export const prototypeReferenceProvider = {
  id: "prototype-cei-60364-5-52",
  label: "Tables de prototype (CEI 60364-5-52) — non normatives",

  listInstallationMethods() {
    return INSTALLATION_METHODS;
  },

  listSections() {
    return CABLE_SECTIONS_MM2;
  },

  findCurrentCapacityTable({ material, insulation, installationMethod, loadedConductors }) {
    return (
      CURRENT_CAPACITY_TABLES.find(
        (table) =>
          table.material === material &&
          table.insulation === insulation &&
          table.installationMethod === installationMethod &&
          table.loadedConductors === loadedConductors,
      ) ?? null
    );
  },

  getConductorElectricalProperties({ material, insulation, section }) {
    const data = CONDUCTOR_ELECTRICAL_DATA[material];
    const operatingTemperatureC = OPERATING_TEMPERATURE_C[insulation];
    const r20 = data?.r20OhmPerKm[section];
    if (r20 === undefined || operatingTemperatureC === undefined) return null;
    const rOhmPerKm = r20 * (1 + data.alphaPerKelvin * (operatingTemperatureC - 20));
    return {
      rOhmPerKm,
      xOhmPerKm: CABLE_REACTANCE_OHM_PER_KM.value,
      operatingTemperatureC,
      source: `${data.source} ; R ramenée à ${operatingTemperatureC} °C ; ${CABLE_REACTANCE_OHM_PER_KM.source}`,
      status: "prototype",
    };
  },

  getCorrectionFactors(conditions) {
    return { k3: resolveK3(conditions), k4: resolveK4(conditions), k5: resolveK5(conditions) };
  },
};
