// Arithmétique de dates en UTC (les dates métier sont des jours, pas des instants).

// Ajoute `months` mois à une date en conservant le jour, ramené au dernier jour du mois si nécessaire
// (31/08 + 6 mois = 28/02, ou 29/02 en année bissextile).
function addMonths(value, months) {
  const date = new Date(value);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

// Début de la journée courante (UTC), pour comparer des dates sans heure.
function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

module.exports = { addMonths, addDays, today };
