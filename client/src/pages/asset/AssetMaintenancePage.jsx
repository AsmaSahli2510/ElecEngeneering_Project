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
import { dueState, formatDate, isoDay, nextMaintenanceDate, todayIso } from '../../domain/lifecycle/dates.js'
import { FREQUENCY_LABELS, INTERVENTION_RESULT_LABELS, INTERVENTION_TYPE_LABELS } from '../../domain/lifecycle/labels.js'
import { useLoad } from '../../hooks/useLoad.js'
import { api } from '../../lib/api.js'

const options = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }))
const DUE_TONE = { overdue: 'error', soon: 'warn', ok: 'ok' }
const DUE_LABEL = { overdue: 'En retard', soon: 'Bientôt', ok: 'À jour' }

async function fetchMaintenance(assetId) {
  const [asset, plan] = await Promise.all([api.assets.get(assetId), api.assets.getMaintenance(assetId)])
  return { asset, plan }
}

function MaintenanceEditor({ data, reload }) {
  const { asset, plan } = data
  const [frequency, setFrequency] = useState(String(plan?.frequencyMonths ?? 6))
  const [technician, setTechnician] = useState(plan?.technician ?? '')
  const [intervention, setIntervention] = useState({ date: todayIso(), type: 'preventive', technician: plan?.technician ?? '', result: 'ok', observations: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const interventions = [...(plan?.interventions ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date))
  // Prochaine date : dernière intervention (sinon installation) + fréquence — même règle que le serveur.
  const nextDate = nextMaintenanceDate({ installationDate: asset.installationDate, interventionDates: interventions.map((item) => item.date), frequencyMonths: Number(frequency) })
  const due = plan ? dueState(plan.nextDate) : null
  const planChanged = !plan || Number(frequency) !== plan.frequencyMonths || technician !== plan.technician

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
      reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowStepPage
      cabinet={asset.cabinet}
      current="maintenance"
      description="La prochaine date est calculée automatiquement à partir de la date d'installation ou de la dernière intervention."
      eyebrow={`Actif ${asset.assetId} • Maintenance`}
      icon="build"
      projectId={asset.project._id}
      title="Maintenance préventive">
      {error && <Notice tone="error">{error}</Notice>}
      <SectionCard
        badge={due && <StatusPill data-testid="due-state" tone={DUE_TONE[due.state]}>{DUE_LABEL[due.state]}</StatusPill>}
        icon="event_repeat"
        subtitle={`Actif ${asset.assetId} — installé le ${formatDate(asset.installationDate)}`}
        title="Plan de maintenance">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="plan-form">
          <FormField className="md:col-span-3" label="Actif">
            <input className={formInputClass} data-testid="plan-asset" readOnly value={asset.assetId} />
          </FormField>
          <SelectField className="md:col-span-3" label="Fréquence" onChange={setFrequency} options={options(FREQUENCY_LABELS)} value={frequency} />
          <FormField className="md:col-span-3" hint="Calculée automatiquement" label="Prochaine date">
            <input className={`${formInputClass} font-bold text-secondary`} data-testid="plan-next-date" readOnly value={formatDate(nextDate)} />
          </FormField>
          <FormField className="md:col-span-3" label="Technicien assigné" required>
            <input className={formInputClass} data-testid="plan-technician" onChange={(e) => setTechnician(e.target.value)} value={technician} />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button data-testid="save-plan" disabled={busy || !technician.trim() || !planChanged} icon="save" onClick={() => run(() => api.assets.savePlan(asset.assetId, { frequencyMonths: Number(frequency), technician }))}>
            {plan ? 'Mettre à jour le plan' : 'Définir le plan'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard icon="fact_check" subtitle={plan ? "Enregistrée dans l'historique de l'actif" : "Définissez d'abord le plan pour enregistrer des interventions"} title="Enregistrer une intervention">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="intervention-form">
          <FormField className="md:col-span-3" label="Date d'intervention">
            <input className={formInputClass} disabled={!plan} onChange={(e) => setIntervention({ ...intervention, date: e.target.value })} type="date" value={intervention.date} />
          </FormField>
          <SelectField className="md:col-span-3" label="Type" onChange={(value) => setIntervention({ ...intervention, type: value })} options={options(INTERVENTION_TYPE_LABELS)} value={intervention.type} />
          <FormField className="md:col-span-3" label="Technicien">
            <input className={formInputClass} disabled={!plan} onChange={(e) => setIntervention({ ...intervention, technician: e.target.value })} value={intervention.technician} />
          </FormField>
          <SelectField className="md:col-span-3" label="Résultat" onChange={(value) => setIntervention({ ...intervention, result: value })} options={options(INTERVENTION_RESULT_LABELS)} value={intervention.result} />
          <FormField className="md:col-span-12" label="Observations">
            <textarea className={`${formInputClass} h-auto py-space-md`} disabled={!plan} onChange={(e) => setIntervention({ ...intervention, observations: e.target.value })} rows="2" value={intervention.observations} />
          </FormField>
        </div>
        <div className="flex justify-end">
          <Button
            data-testid="save-intervention"
            disabled={busy || !plan || !intervention.date || !intervention.technician.trim()}
            icon="add_task"
            onClick={() => run(async () => {
              await api.assets.addIntervention(asset.assetId, intervention)
              setIntervention({ ...intervention, observations: '' })
            })}>
            Enregistrer l'intervention
          </Button>
        </div>
      </SectionCard>

      <SectionCard icon="history" subtitle={`${interventions.length} intervention(s)`} title="Interventions réalisées">
        {interventions.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Aucune intervention enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm" data-testid="interventions-table">
              <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                <tr>{['Date', 'Type', 'Technicien', 'Résultat', 'Observations'].map((heading) => <th className="px-space-md py-space-sm" key={heading}>{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {interventions.map((item) => (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatDate(item.date)}</td>
                    <td className="px-space-md py-space-sm">{INTERVENTION_TYPE_LABELS[item.type]}</td>
                    <td className="px-space-md py-space-sm">{item.technician}</td>
                    <td className="px-space-md py-space-sm"><StatusPill tone={item.result === 'ok' ? 'ok' : item.result === 'reserves' ? 'warn' : 'error'}>{INTERVENTION_RESULT_LABELS[item.result]}</StatusPill></td>
                    <td className="px-space-md py-space-sm">{item.observations || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {plan && <p className="font-tech-unit text-tech-unit text-on-surface-variant" data-testid="next-maintenance">Prochaine maintenance : <strong>{formatDate(isoDay(plan.nextDate))}</strong></p>}
      </SectionCard>
    </WorkflowStepPage>
  )
}

function AssetMaintenancePage() {
  const { assetId } = useParams()
  const loader = useCallback(() => fetchMaintenance(assetId), [assetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'actif" backTo={`/assets/${assetId}`} state={state}>
      {state.data && <MaintenanceEditor data={state.data} key={state.data.plan?.updatedAt ?? 'new'} reload={state.reload} />}
    </LoadState>
  )
}

export default AssetMaintenancePage
