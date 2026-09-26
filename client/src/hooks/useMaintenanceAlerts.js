import { useCallback } from 'react'
import { isoDay, todayIso } from '../domain/lifecycle/dates.js'
import { api } from '../lib/api.js'
import { useLoad } from './useLoad.js'

// Alertes de maintenance pour la cloche de notifications : plans dont l'échéance
// tombe aujourd'hui, ou déjà dépassée (l'utilisateur doit aussi les voir).
export function useMaintenanceAlerts() {
  const loader = useCallback(async () => {
    const plans = await api.maintenancePlans.list()
    const today = todayIso()
    return plans
      .map((plan) => ({
        ...plan,
        isToday: isoDay(plan.nextDate) === today,
        isOverdue: isoDay(plan.nextDate) < today,
      }))
      .filter((plan) => plan.isToday || plan.isOverdue)
      .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1))
  }, [])
  const { status, data, error } = useLoad(loader)
  return { status, alerts: data ?? [], error }
}
