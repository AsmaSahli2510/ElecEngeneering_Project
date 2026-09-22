import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button, LinkButton } from '../components/ui/buttons.jsx'
import { SelectField } from '../components/ui/fields.jsx'
import FormField, { formInputClass } from '../components/ui/FormField.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Notice from '../components/ui/Notice.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { isoDay, todayIso } from '../domain/lifecycle/dates.js'
import { INSTALLATION_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'

async function fetchInstallationData(projectId, cabinetId) {
  const [project, cabinet, installation, overview] = await Promise.all([
    api.projects.get(projectId),
    api.cabinets.get(cabinetId),
    api.cabinets.getInstallation(cabinetId),
    api.projects.overview(projectId),
  ])
  return { project, cabinet, installation, overview }
}

const STATUS_OPTIONS = Object.entries(INSTALLATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))

function InstallationEditor({ data, base, onSaved }) {
  const { project, cabinet, installation, overview } = data
  const completed = installation?.status === 'completed'
  const [form, setForm] = useState(() => ({
    installationDate: installation ? isoDay(installation.installationDate) : todayIso(),
    team: installation?.team ?? 'Équipe installation A',
    status: installation?.status ?? 'planned',
    comment: installation?.comment ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const set = (patch) => setForm((current) => ({ ...current, ...patch }))
  const assetId = created?.assetId ?? overview.asset?.assetId

  const errors = {}
  if (!form.installationDate) errors.installationDate = "Date d'installation requise."
  if (!form.team.trim()) errors.team = 'Technicien / équipe requis.'

  async function save() {
    setSaving(true)
    setError('')
    try {
      const response = await api.cabinets.saveInstallation(cabinet._id, form)
      if (response.assetCreated) setCreated(response.asset)
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WorkflowStepPage
      cabinet={cabinet}
      current="installation"
      description="Planifiez puis suivez l'installation. Lorsqu'elle passe à « Terminée », l'actif de l'armoire est créé automatiquement."
      eyebrow="Étape 09 • Installation"
      footer={
        <NextStepBar
          disabled={!assetId}
          hint={assetId ? `Actif ${assetId} créé : garantie, QR code, maintenance et tickets sont disponibles.` : "L'actif sera créé automatiquement quand l'installation sera terminée."}
          label="Voir l'actif"
          to={`/assets/${assetId ?? ''}`}
        />
      }
      icon="construction"
      projectId={project._id}
      title="Installation">
      {!overview.quotation && (
        <Notice actions={<Link className="font-bold underline" to={`${base}/quotation`}>Aller au devis</Link>} tone="warn" title="Devis manquant">
          L'installation suit le devis : enregistrez d'abord le devis.
        </Notice>
      )}
      {created && (
        <Notice actions={<LinkButton className="h-9 px-space-md" data-testid="asset-link" to={`/assets/${created.assetId}`}>Voir l'actif</LinkButton>} tone="success" title={`Actif ${created.assetId} créé automatiquement`}>
          Numéro de série {created.serialNumber}. Projet, client, site, armoire, départs, calculs, bilan, nomenclature, devis et installation lui sont liés sans nouvelle saisie.
        </Notice>
      )}
      {completed && !created && assetId && (
        <Notice actions={<LinkButton className="h-9 px-space-md" to={`/assets/${assetId}`}>Voir l'actif {assetId}</LinkButton>} tone="success" title="Installation terminée">
          L'actif de l'armoire a été créé ; l'installation n'est plus modifiable.
        </Notice>
      )}

      <SectionCard
        badge={installation && <StatusPill data-testid="install-status" tone={completed ? 'ok' : 'info'}>{INSTALLATION_STATUS_LABELS[installation.status]}</StatusPill>}
        icon="construction"
        subtitle={`Armoire ${cabinet.reference} — ${project.installationSite}`}
        title="Suivi d'installation">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="installation-form">
          <FormField className="md:col-span-4" error={errors.installationDate} label="Date d'installation" required>
            <input className={formInputClass} disabled={completed} onChange={(e) => set({ installationDate: e.target.value })} type="date" value={form.installationDate} />
          </FormField>
          <FormField className="md:col-span-4" error={errors.team} label="Technicien / équipe" required>
            <input className={formInputClass} disabled={completed} onChange={(e) => set({ team: e.target.value })} value={form.team} />
          </FormField>
          <SelectField className="md:col-span-4" label="Statut" onChange={(value) => !completed && set({ status: value })} options={STATUS_OPTIONS} value={form.status} />
          <FormField className="md:col-span-12" label="Commentaire">
            <textarea className={`${formInputClass} h-auto py-space-md`} disabled={completed} onChange={(e) => set({ comment: e.target.value })} rows="3" value={form.comment} />
          </FormField>
        </div>
        {form.status === 'completed' && !completed && (
          <Notice tone="info">En enregistrant avec le statut « Terminée », l'actif de l'armoire ({cabinet.reference}) sera créé automatiquement avec sa garantie et son QR code.</Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        {!completed && (
          <div className="flex justify-end border-t border-surface-container-low pt-space-md">
            <Button data-testid="save-installation" disabled={saving || Object.keys(errors).length > 0} icon="save" onClick={save}>
              {saving ? 'Enregistrement...' : "Enregistrer l'installation"}
            </Button>
          </div>
        )}
      </SectionCard>
    </WorkflowStepPage>
  )
}

function InstallationPage() {
  const { projectId, cabinetId } = useParams()
  const base = `/projects/${projectId}/cabinets/${cabinetId}`
  const loader = useCallback(() => fetchInstallationData(projectId, cabinetId), [projectId, cabinetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'armoire" backTo={`${base}/feeders`} state={state}>
      {state.data && <InstallationEditor base={base} data={state.data} key={state.data.installation?.updatedAt ?? 'new'} onSaved={state.reload} />}
    </LoadState>
  )
}

export default InstallationPage
