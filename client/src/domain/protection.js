// Protections : types proposés et série de calibres normalisés.
// La série ci-dessous est une série de calibres usuels de PROTOTYPE (à confirmer avec le catalogue retenu).

export const PROTECTION_TYPES = ["Disjoncteur", "Interrupteur-sectionneur avec fusibles"];

export const STANDARD_RATINGS_A = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];

// Plus petit calibre >= courant d'emploi (null si le courant dépasse la série).
export function suggestRating(current, ratings = STANDARD_RATINGS_A) {
  if (!Number.isFinite(current) || current <= 0) return null;
  return ratings.find((rating) => rating >= current) ?? null;
}
