// Adresse encodée dans le QR code d'un actif : elle contient l'identifiant unique de l'actif (ACT-2026-001) et ouvre
// directement la page « Détails de l'actif » quand le QR est scanné. Le QR ne crée aucune donnée.
// VITE_PUBLIC_URL permet de fixer l'adresse publique de l'application (sinon l'origine courante est utilisée).
export function assetDetailsUrl(assetId) {
  const origin = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  return `${origin.replace(/\/$/, '')}/assets/${assetId}/details`
}
