// Formatage des nombres à la française (virgule décimale).
export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

// Section : 6 -> "6 mm²", 2.5 -> "2,5 mm²"
export function formatSection(section) {
  if (section === null || section === undefined) return '—'
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(section)} mm²`
}
