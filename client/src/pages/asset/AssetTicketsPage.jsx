import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import WorkflowStepPage from '../../components/projects/WorkflowStepPage.jsx'
import { Button } from '../../components/ui/buttons.jsx'
import { SelectField } from '../../components/ui/fields.jsx'
import FormField, { formInputClass } from '../../components/ui/FormField.jsx'
import LoadState from '../../components/ui/LoadState.jsx'
import Notice from '../../components/ui/Notice.jsx'
import SectionCard from '../../components/ui/SectionCard.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { formatDate, isoDay, todayIso } from '../../domain/lifecycle/dates.js'
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import { useLoad } from '../../hooks/useLoad.js'
import { api } from '../../lib/api.js'

const options = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }))
const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warn', critical: 'error' }
const STATUS_TONE = { reported: 'warn', assigned: 'info', in_progress: 'info', resolved: 'ok', closed: 'neutral' }

async function fetchTickets(assetId) {
  const [asset, tickets] = await Promise.all([api.assets.get(assetId), api.assets.tickets(assetId)])
  return { asset, tickets }
}

// Traitement d'un ticket : statut, technicien et, à la résolution, action réalisée / pièces / date / commentaire.
function TicketCard({ ticket, onChanged }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(ticket.status)
  const [technician, setTechnician] = useState(ticket.technician ?? '')
  const [resolution, setResolution] = useState({
    action: ticket.resolution?.action ?? '',
    partsUsed: ticket.resolution?.partsUsed ?? '',
    resolvedAt: ticket.resolution?.resolvedAt ? isoDay(ticket.resolution.resolvedAt) : todayIso(),
    comment: ticket.resolution?.comment ?? '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const resolving = status === 'resolved' || status === 'closed'

  async function save() {
    setBusy(true)
    setError('')
    try {
      await api.tickets.update(ticket._id, { status, technician, ...(resolving ? { resolution } : {}) })
      setOpen(false)
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="space-y-space-sm rounded-lg bg-surface-container-low p-space-md" data-ticket={ticket.number}>
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className="font-tech-data-md font-bold text-secondary">{ticket.number}</span>
          <strong className="font-body-md text-on-surface">{ticket.title}</strong>
          <StatusPill tone={PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABELS[ticket.priority]}</StatusPill>
          <StatusPill data-cell="ticket-status" tone={STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</StatusPill>
        </div>
        <Button data-action="handle-ticket" onClick={() => setOpen(!open)} variant="secondary">{open ? 'Fermer' : 'Traiter'}</Button>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{ticket.description || 'Aucune description.'}</p>
      <p className="font-tech-unit text-tech-unit text-on-surface-variant">
        Signalé le {formatDate(ticket.reportedAt)} • Technicien : {ticket.technician || 'non assigné'}
      </p>
      {ticket.resolution?.action && (
        <div className="rounded-lg bg-surface-container-lowest p-space-sm font-body-sm text-body-sm" data-testid="ticket-resolution">
          <strong>Action réalisée :</strong> {ticket.resolution.action}
          {ticket.resolution.partsUsed && <> • <strong>Pièces :</strong> {ticket.resolution.partsUsed}</>}
          {ticket.resolution.resolvedAt && <> • Résolu le {formatDate(ticket.resolution.resolvedAt)}</>}
          {ticket.resolution.comment && <div className="text-on-surface-variant">{ticket.resolution.comment}</div>}
        </div>
      )}
      {open && (
        <div className="space-y-space-md border-t border-outline-variant pt-space-md" data-testid="ticket-panel">
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <SelectField label="Statut" onChange={setStatus} options={options(TICKET_STATUS_LABELS)} value={status} />
            <FormField label="Technicien assigné">
              <input className={formInputClass} data-testid="ticket-technician" onChange={(e) => setTechnician(e.target.value)} value={technician} />
            </FormField>
          </div>
          {resolving && (
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2" data-testid="resolution-form">
              <FormField className="md:col-span-2" label="Action réalisée" required>
                <input className={formInputClass} data-testid="resolution-action" onChange={(e) => setResolution({ ...resolution, action: e.target.value })} value={resolution.action} />
              </FormField>
              <FormField label="Pièces utilisées">
                <input className={formInputClass} data-testid="resolution-parts" onChange={(e) => setResolution({ ...resolution, partsUsed: e.target.value })} value={resolution.partsUsed} />
              </FormField>
              <FormField label="Date de résolution">
                <input className={formInputClass} onChange={(e) => setResolution({ ...resolution, resolvedAt: e.target.value })} type="date" value={resolution.resolvedAt} />
              </FormField>
              <FormField className="md:col-span-2" label="Commentaire">
                <textarea className={`${formInputClass} h-auto py-space-md`} onChange={(e) => setResolution({ ...resolution, comment: e.target.value })} rows="2" value={resolution.comment} />
              </FormField>
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex justify-end">
            <Button data-testid="update-ticket" disabled={busy} icon="save" onClick={save}>Mettre à jour le ticket</Button>
          </div>
        </div>
      )}
    </article>
  )
}

function TicketsEditor({ data, reload }) {
  const { asset, tickets } = data
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', reportedAt: todayIso(), technician: '', status: 'reported' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  async function create() {
    setBusy(true)
    setError('')
    try {
      await api.assets.createTicket(asset.assetId, form)
      setForm({ title: '', description: '', priority: 'medium', reportedAt: todayIso(), technician: '', status: 'reported' })
      reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const open = tickets.filter((ticket) => ['reported', 'assigned', 'in_progress'].includes(ticket.status)).length

  return (
    <WorkflowStepPage
      cabinet={asset.cabinet}
      current="tickets"
      description="Signalez un problème sur l'actif puis suivez son traitement jusqu'à la clôture."
      eyebrow={`Actif ${asset.assetId} • Tickets`}
      icon="confirmation_number"
      projectId={asset.project._id}
      title="Tickets / maintenance corrective">
      <SectionCard icon="add_alert" subtitle="Le ticket est lié automatiquement à l'actif" title="Nouveau ticket">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="ticket-form">
          <FormField className="md:col-span-3" label="Actif concerné">
            <input className={formInputClass} data-testid="ticket-asset" readOnly value={asset.assetId} />
          </FormField>
          <FormField className="md:col-span-5" label="Titre du problème" required>
            <input className={formInputClass} data-testid="ticket-title" onChange={(e) => set({ title: e.target.value })} value={form.title} />
          </FormField>
          <SelectField className="md:col-span-2" label="Priorité" onChange={(value) => set({ priority: value })} options={options(TICKET_PRIORITY_LABELS)} value={form.priority} />
          <FormField className="md:col-span-2" label="Date du signalement">
            <input className={formInputClass} onChange={(e) => set({ reportedAt: e.target.value })} type="date" value={form.reportedAt} />
          </FormField>
          <FormField className="md:col-span-12" label="Description">
            <textarea className={`${formInputClass} h-auto py-space-md`} data-testid="ticket-description" onChange={(e) => set({ description: e.target.value })} rows="2" value={form.description} />
          </FormField>
          <FormField className="md:col-span-6" label="Technicien assigné">
            <input className={formInputClass} onChange={(e) => set({ technician: e.target.value, status: e.target.value.trim() ? 'assigned' : 'reported' })} value={form.technician} />
          </FormField>
          <SelectField className="md:col-span-6" label="Statut" onChange={(value) => set({ status: value })} options={options({ reported: TICKET_STATUS_LABELS.reported, assigned: TICKET_STATUS_LABELS.assigned })} value={form.status} />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end">
          <Button data-testid="create-ticket" disabled={busy || !form.title.trim()} icon="add" onClick={create}>Créer le ticket</Button>
        </div>
      </SectionCard>

      <SectionCard icon="confirmation_number" subtitle={`${open} ouvert(s) sur ${tickets.length}`} title="Tickets de l'actif">
        {tickets.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Aucun ticket pour cet actif.</p>
        ) : (
          <div className="space-y-space-md" data-testid="tickets-list">
            {tickets.map((ticket) => <TicketCard key={`${ticket._id}-${ticket.updatedAt}`} onChanged={reload} ticket={ticket} />)}
          </div>
        )}
      </SectionCard>
    </WorkflowStepPage>
  )
}

function AssetTicketsPage() {
  const { assetId } = useParams()
  const loader = useCallback(() => fetchTickets(assetId), [assetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'actif" backTo={`/assets/${assetId}`} state={state}>
      {state.data && <TicketsEditor data={state.data} reload={state.reload} />}
    </LoadState>
  )
}

export default AssetTicketsPage
