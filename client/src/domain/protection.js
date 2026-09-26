// Protections : types proposés et série de calibres normalisés.
// La série ci-dessous est une série de calibres usuels de PROTOTYPE (à confirmer avec le catalogue retenu).

export const PROTECTION_TYPES = ["Disjoncteur", "Interrupteur-sectionneur avec fusibles"];

export const STANDARD_RATINGS_A = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630];

// Plus petit calibre >= courant d'emploi (null si le courant dépasse la série).
export function suggestRating(current, ratings = STANDARD_RATINGS_A) {
  if (!Number.isFinite(current) || current <= 0) return null;
  return ratings.find((rating) => rating >= current) ?? null;
}

// Une prise de courant doit être protégée au moins au calibre de la prise elle-même (16 A, la plus courante),
// pas seulement au courant de l'appareil qui y est branché aujourd'hui : n'importe quel appareil dans la limite
// du calibre de la prise peut y être raccordé plus tard.
export const SOCKET_OUTLET_MIN_RATING_A = 16;

// Comme suggestRating, mais applique le calibre minimal d'une prise de courant quand loadType === "Prises".
export function suggestBreakerRating(current, loadType, ratings = STANDARD_RATINGS_A) {
  const rating = suggestRating(current, ratings);
  if (rating === null) return null;
  return loadType === "Prises" ? Math.max(rating, SOCKET_OUTLET_MIN_RATING_A) : rating;
}
