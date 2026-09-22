// Dates métier : des jours calendaires, manipulés en chaînes ISO « AAAA-MM-JJ » (UTC, sans fuseau).
// Aucune date de garantie ou de maintenance n'est écrite en dur : tout est dérivé de la date d'installation.

export const isoDay = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

// Ajoute des mois en conservant le jour (ramené au dernier jour du mois si nécessaire : 31/08 + 6 mois = 28/02).
export function addMonths(iso, months) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso.slice(0, 10)}T00:00:00Z`) - new Date(`${fromIso.slice(0, 10)}T00:00:00Z`)) / 86400000);
}

export function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = isoDay(value).split("-");
  return `${day}/${month}/${year}`;
}

// Prochaine maintenance = dernière intervention (sinon date d'installation) + fréquence en mois.
export function nextMaintenanceDate({ installationDate, interventionDates = [], frequencyMonths }) {
  const last = interventionDates.length ? interventionDates.map(isoDay).sort().at(-1) : isoDay(installationDate);
  return addMonths(last, frequencyMonths);
}

// Garantie : « active » tant qu'au moins une couverture (pièces / main-d'œuvre) court, « à venir » avant le début,
// « expirée » ensuite. Chaque couverture est aussi évaluée séparément.
export function warrantyStatus(warranty, today = todayIso()) {
  if (!warranty?.start) return { status: "unknown", parts: "unknown", labor: "unknown" };
  const cover = (end) => (today < isoDay(warranty.start) ? "upcoming" : today <= isoDay(end) ? "active" : "expired");
  const parts = cover(warranty.partsEnd);
  const labor = cover(warranty.laborEnd);
  const status = parts === "active" || labor === "active" ? "active" : parts === "upcoming" ? "upcoming" : "expired";
  return { status, parts, labor };
}

// État d'une échéance : en retard, proche (≤ 30 jours) ou à jour.
export function dueState(nextDate, today = todayIso(), soonDays = 30) {
  const days = daysBetween(today, isoDay(nextDate));
  return { days, state: days < 0 ? "overdue" : days <= soonDays ? "soon" : "ok" };
}
