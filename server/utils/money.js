// Montants du devis calculés en centimes entiers pour éviter les erreurs d'arrondi flottant.
// Même algorithme que client/src/domain/quotation (mêmes vecteurs de test).

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => cents / 100;

function computeQuotationTotals(lines, discountPercent, vatPercent) {
  const pricedLines = lines.map((line) => ({
    ...line,
    total: fromCents(Math.round(Number(line.quantity) * toCents(line.unitPrice))),
  }));
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

module.exports = { computeQuotationTotals };
