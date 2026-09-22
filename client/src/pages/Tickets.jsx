import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadState from '../components/ui/LoadState.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { formatDate } from '../domain/lifecycle/dates.js'
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'

const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warn', critical: 'error' }

// Tickets de tous les actifs. La création et le traitement se font depuis la fiche d'un actif.
function Tickets() {
  const [status, setStatus] = useState('')
  const loader = useCallback(() => api.tickets.list(status), [status])
  const state = useLoad(loader)
  return (
    <LoadState state={state}>
      <div className="flex w-full flex-col gap-space-lg pb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Tickets</h1>
          <p className="font-body-md text-on-surface-variant">Maintenance corrective de l'ensemble des actifs.</p>
        </div>
        <SectionCard
          actions={
            <select aria-label="Filtrer par statut" className="h-9 rounded-lg bg-surface-container-low px-space-sm font-body-sm" onChange={(e) => setStatus(e.target.value)} value={status}>
              <option value="">Tous les statuts</option>
              {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          }
          icon="confirmation_number"
          subtitle={`${state.data?.length ?? 0} ticket(s)`}
          title="Tous les tickets">
          {state.data?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Aucun ticket.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm" data-testid="all-tickets-table">
                <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <tr>{['N°', 'Actif', 'Titre', 'Priorité', 'Statut', 'Signalé le', 'Technicien'].map((heading) => <th className="px-space-md py-space-sm" key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {state.data?.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="px-space-md py-space-sm font-tech-data-md font-bold">{ticket.number}</td>
                      <td className="px-space-md py-space-sm"><Link className="font-tech-data-md font-bold text-secondary hover:underline" to={`/assets/${ticket.asset?.assetId}/tickets`}>{ticket.asset?.assetId}</Link></td>
                      <td className="px-space-md py-space-sm font-semibold">{ticket.title}</td>
                      <td className="px-space-md py-space-sm"><StatusPill tone={PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABELS[ticket.priority]}</StatusPill></td>
                      <td className="px-space-md py-space-sm"><StatusPill tone="info">{TICKET_STATUS_LABELS[ticket.status]}</StatusPill></td>
                      <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatDate(ticket.reportedAt)}</td>
                      <td className="px-space-md py-space-sm">{ticket.technician || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </LoadState>
  )
}

export default Tickets
