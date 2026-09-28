import { FEEDER_EXAMPLES } from "../../data/feederExamples.js";
import { computeBalance } from "../../domain/balance/index.js";
import { generateBom } from "../../domain/bom/index.js";
import { buildDefaultInputs, calculateFeeder } from "../../domain/calculation/index.js";
import { suggestRating } from "../../domain/protection.js";
import { computeQuotationTotals, linesFromBom, QUOTATION_DEFAULTS } from "../../domain/quotation/index.js";

// Projet d'exemple du guide. Les valeurs affichées dans les animations ne sont pas inventées : elles sortent
// des vrais moteurs de calcul (départ, bilan, nomenclature, devis) appliqués aux départs d'exemple.
const year = new Date().getFullYear();
const cabinet = { reference: "AR-01", powerSupplyPoint: "TGBT-01", distanceToTGBT: 25, neutralSystem: "TN-S" };
const feeders = FEEDER_EXAMPLES.map((feeder) => ({ ...feeder, _id: feeder.reference }));

const calculations = feeders.map((feeder) => {
  const inputs = buildDefaultInputs({ cabinet, feeder });
  const { result } = calculateFeeder(inputs);
  return { feederId: feeder._id, inputs, result, status: result?.globalStatus, updatedAt: new Date(0).toISOString() };
});

const balance = computeBalance({ feeders, calculations });
const bom = generateBom({ feeders, calculations, mainFeeder: null }).lines;
const totals = computeQuotationTotals(linesFromBom(bom), QUOTATION_DEFAULTS.discountPercent, QUOTATION_DEFAULTS.vatPercent);

const first = calculations[0];

export const DEMO = {
  year,
  projectRef: `PROJ-${year}-001`,
  quotationRef: `DEV-${year}-001`,
  assetRef: `ACT-${year}-001`,
  ticketRef: `TKT-${year}-001`,
  cabinet,
  feeders,
  calculation: {
    feeder: feeders[0],
    inputs: first.inputs,
    result: first.result,
  },
  balance: {
    lines: balance.lines,
    totals: balance.totals,
    status: balance.status,
    mainRating: balance.totals ? suggestRating(balance.totals.totalCurrent) : null,
  },
  bom,
  quotation: { ...totals, vatPercent: QUOTATION_DEFAULTS.vatPercent },
};
