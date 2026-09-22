import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import LoadState from '../components/ui/LoadState.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { dueState, formatDate } from '../domain/lifecycle/dates.js'
import { FREQUENCY_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'

const TONE = { overdue: 'error', soon: 'warn', ok: 'ok' }
const LABEL = { overdue: 'En retard', soon: 'Bientôt', ok: 'À jour' }

// Plans de maintenance préventive de tous les actifs, classés par prochaine échéance.
function Maintenance() {
  const loader = useCallback(() => api.maintenancePlans.list(), [])
  const state = useLoad(loader)
  return (
    <LoadState state={state}>
      <div className="flex w-full flex-col gap-space-lg pb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Maintenance</h1>
          <p className="font-body-md text-on-surface-variant">Échéances préventives de tous les actifs.</p>
        </div>
        <SectionCard icon="build" subtitle={`${state.data?.length ?? 0} plan(s)`} title="Plans de maintenance préventive">
          {state.data?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Aucun plan défini. Définissez la fréquence depuis la fiche d'un actif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm" data-testid="plans-table">
                <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <tr>{['Actif', 'Fréquence', 'Technicien', 'Prochaine date', 'Échéance', 'Interventions'].map((heading) => <th className="px-space-md py-space-sm" key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {state.data?.map((plan) => {
                    const due = dueState(plan.nextDate)
                    return (
                      <tr key={plan._id}>
                        <td className="px-space-md py-space-sm"><Link className="font-tech-data-md font-bold text-secondary hover:underline" to={`/assets/${plan.asset?.assetId}/maintenance`}>{plan.asset?.assetId}</Link></td>
                        <td className="px-space-md py-space-sm">{FREQUENCY_LABELS[plan.frequencyMonths]}</td>
                        <td className="px-space-md py-space-sm">{plan.technician}</td>
                        <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatDate(plan.nextDate)}</td>
                        <td className="px-space-md py-space-sm"><StatusPill tone={TONE[due.state]}>{LABEL[due.state]}</StatusPill></td>
                        <td className="px-space-md py-space-sm font-tech-data-md">{plan.interventions.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </LoadState>
  )
}

export default Maintenance
