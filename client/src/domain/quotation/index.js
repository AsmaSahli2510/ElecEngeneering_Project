// Devis : lignes reprises de la nomenclature et totaux. Calcul en centimes entiers (pas d'erreur d'arrondi flottant).
// Le serveur applique le même algorithme (server/utils/money.js) et recalcule toujours les montants.

// Valeurs proposées par défaut, toutes modifiables dans le formulaire du devis.
// TVA : taux standard tunisien ; remise : aucune. Devise : dinar tunisien (TND).
export const QUOTATION_DEFAULTS = { validityDays: 30, discountPercent: 0, vatPercent: 19, currency: "TND" };

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => cents / 100;

export function linesFromBom(items) {
  return items.map(({ reference, designation, category, unit, quantity, unitPrice }) => ({ reference, designation, category, unit, quantity: Number(quantity), unitPrice: Number(unitPrice) }));
}

export function computeQuotationTotals(lines, discountPercent, vatPercent) {
  const pricedLines = lines.map((line) => ({ ...line, total: fromCents(Math.round(Number(line.quantity) * toCents(line.unitPrice))) }));
  const subtotal = pricedLines.reduce((sum, line) => sum + toCents(line.total), 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const totalHT = subtotal - discount;
  const vat = Math.round((totalHT * vatPercent) / 100);
  return {
    lines: pricedLines,
    subtotalHT: fromCents(subtotal),
    discountAmount: fromCents(discount),
    totalHT: fromCents(totalHT),
    vatAmount: fromCents(vat),
    totalTTC: fromCents(totalHT + vat),
  };
}

export function validateQuotation({ reference, date, validityDays, discountPercent, vatPercent }) {
  const errors = {};
  if (!String(reference ?? "").trim()) errors.reference = "Référence requise.";
  if (!date) errors.date = "Date requise.";
  if (!(Number(validityDays) >= 0) || validityDays === "") errors.validityDays = "Validité en jours (≥ 0).";
  if (!(Number(discountPercent) >= 0 && Number(discountPercent) <= 100) || discountPercent === "") errors.discountPercent = "Remise entre 0 et 100 %.";
  if (!(Number(vatPercent) >= 0 && Number(vatPercent) <= 100) || vatPercent === "") errors.vatPercent = "TVA entre 0 et 100 %.";
  return errors;
}

export function formatMoney(value, currency = "TND") {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}
