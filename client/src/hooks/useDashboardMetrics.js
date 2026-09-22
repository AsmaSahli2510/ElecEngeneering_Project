import { useCallback } from 'react'
import { api } from '../lib/api.js'
import { useLoad } from './useLoad.js'

// Indicateurs agrégés du tableau de bord : un seul appel à un endpoint dédié (`GET /dashboard/metrics`) qui
// compte directement en base, plutôt que de charger et d'enrichir côté client des collections entières
// (ce que font GET /assets ou /tickets, pensés pour l'affichage détaillé) juste pour les dénombrer.
export function useDashboardMetrics() {
  const loader = useCallback(() => api.dashboard.metrics(), [])
  return useLoad(loader)
}
