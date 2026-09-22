// Sérialisation canonique (clés triées) : deux objets de même contenu donnent la même chaîne,
// quel que soit l'ordre des clés (utile pour détecter des modifications non enregistrées).
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
