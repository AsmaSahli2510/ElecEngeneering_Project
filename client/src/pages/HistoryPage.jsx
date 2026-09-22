import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { formatDate } from '../domain/lifecycle/dates.js'
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'

const STATUS_TONE = { completed: 'ok', resolved: 'ok', closed: 'neutral', planned: 'info', in_progress: 'info', assigned: 'info', reported: 'warn', non_compliant: 'error' }

function HistoryPage() {
  const { projectId } = useParams()
  const loader = useCallback(() => api.projects.history(projectId), [projectId])
  const state = useLoad(loader)
  const [filter, setFilter] = useState('')

  return (
    <LoadState backLabel="Retour au projet" backTo={`/projects/${projectId}`} state={state}>
      {state.data && (
        <WorkflowStepPage
          current="history"
          description="Journal alimenté automatiquement par les événements du système : aucune saisie manuelle."
          eyebrow={state.data.asset ? `Actif ${state.data.asset.assetId} • Historique` : 'Historique'}
          icon="history"
          layout="wide"
          projectId={projectId}
          title="Historique">
          <SectionCard
            actions={
              <select aria-label="Filtrer par type" className="h-9 rounded-lg bg-surface-container-low px-space-sm font-body-sm" onChange={(e) => setFilter(e.target.value)} value={filter}>
                <option value="">Tous les types</option>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            }
            icon="history"
            subtitle={`${state.data.events.length} événement(s)`}
            title={state.data.project.name}>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm" data-testid="history-table">
                <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <tr>{['Date', 'Événement', 'Type', 'Statut'].map((heading) => <th className="px-space-md py-space-sm" key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {state.data.events.filter((event) => !filter || event.type === filter).map((event) => (
                    <tr data-event-type={event.type} data-event-status={event.status} key={event._id}>
                      <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatDate(event.date)}</td>
                      <td className="px-space-md py-space-sm font-semibold">{event.title}</td>
                      <td className="px-space-md py-space-sm">{EVENT_TYPE_LABELS[event.type] ?? event.type}</td>
                      <td className="px-space-md py-space-sm"><StatusPill tone={STATUS_TONE[event.status] ?? 'neutral'}>{EVENT_STATUS_LABELS[event.status] ?? event.status}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {state.data.asset && (
              <p className="font-tech-unit text-tech-unit text-on-surface-variant">
                Actif : <Link className="font-bold text-secondary hover:underline" to={`/assets/${state.data.asset.assetId}`}>{state.data.asset.assetId}</Link>
              </p>
            )}
          </SectionCard>
        </WorkflowStepPage>
      )}
    </LoadState>
  )
}

export default HistoryPage
