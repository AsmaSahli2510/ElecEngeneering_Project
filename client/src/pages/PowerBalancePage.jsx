import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button } from '../components/ui/buttons.jsx'
import { formInputClass } from '../components/ui/FormField.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Metric from '../components/ui/Metric.jsx'
import Notice from '../components/ui/Notice.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { BALANCE_DEFAULTS, computeBalance, toBalancePayload } from '../domain/balance/index.js'
import { BALANCE_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'
import { formatNumber, formatSection } from '../lib/format.js'

async function fetchBalanceData(projectId, cabinetId) {
  const [project, cabinet, feeders, calculations, saved] = await Promise.all([
    api.projects.get(projectId),
    api.cabinets.get(cabinetId),
    api.feeders.list(cabinetId),
    api.cabinets.calculations(cabinetId),
    api.cabinets.getBalance(cabinetId),
  ])
  feeders.sort((a, b) => a.reference.localeCompare(b.reference, 'fr', { numeric: true }))
  return { project, cabinet, feeders, calculations, saved }
}

// Empreinte des paramètres (indépendante de l'ordre des départs) pour détecter des modifications non enregistrées.
const signature = (ks, entries) => JSON.stringify([Number(ks), [...entries].map(([id, value]) => [String(id), Number(value)]).sort(([a], [b]) => a.localeCompare(b))])

const LINE_STATUS = { validated: ['ok', 'Conforme'], non_compliant: ['error', 'Non conforme'] }

// Éditeur du bilan. Remonté (via `key`) à chaque rechargement des données enregistrées.
function BalanceEditor({ data, base, onSaved }) {
  const { project, cabinet, feeders, calculations, saved } = data
  const [ks, setKs] = useState(saved?.parameters?.simultaneityFactor ?? BALANCE_DEFAULTS.simultaneityFactor)
  const [ku, setKu] = useState(() => Object.fromEntries((saved?.parameters?.utilizationFactors ?? []).map((factor) => [factor.feederId, factor.ku])))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const parameters = useMemo(() => ({ simultaneityFactor: ks, utilizationFactors: ku }), [ks, ku])
  const outcome = useMemo(() => computeBalance({ feeders, calculations, parameters }), [feeders, calculations, parameters])

  // Le bilan enregistré est obsolète si un calcul de départ est plus récent, ou si la liste des départs a changé.
  const stale = Boolean(saved) && (new Date(outcome.basedOn ?? 0) > new Date(saved.basedOn) || saved.lines.length !== feeders.length)
  const savedSignature = saved ? signature(saved.parameters.simultaneityFactor, saved.parameters.utilizationFactors.map((factor) => [factor.feederId, factor.ku])) : null
  const currentSignature = signature(ks, outcome.lines.map((line) => [line.feederId, line.ku]))
  const unsavedChanges = !saved || savedSignature !== currentSignature
  const upToDate = Boolean(saved) && !stale && !unsavedChanges

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.cabinets.saveBalance(cabinet._id, toBalancePayload(outcome, parameters))
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const { totals } = outcome
  const validated = outcome.ready && outcome.status === 'validated'
  const nonCompliantCount = outcome.lines.filter((line) => line.status !== 'validated').length
  const canContinue = upToDate && validated

  return (
    <WorkflowStepPage
      current="balance"
      description="Synthèse alimentée automatiquement par les calculs des départs : aucune donnée n'est à ressaisir."
      eyebrow="Étape 05 • Bilan de puissance"
      footer={
        <NextStepBar
          disabled={!canContinue}
          hint={
            canContinue
              ? 'Bilan enregistré : le départ général sera dimensionné à partir de ces résultats.'
              : !outcome.ready
                ? 'Le bilan est incomplet : calculez tous les départs.'
                : !validated
                  ? 'Des départs ne sont pas conformes : corrigez leurs calculs avant de continuer.'
                  : 'Enregistrez le bilan pour continuer.'
          }
          label="Continuer vers le départ général"
          to={`${base}/main-feeder`}
        />
      }
      icon="analytics"
      layout="wide"
      projectId={project._id}
      title="Bilan de puissance">
      <SectionCard icon="assignment" subtitle="Repris du projet, de l'armoire et des départs calculés" title="Contexte">
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-3 xl:grid-cols-6" data-testid="balance-context">
          <Metric label="Projet" value={project.name} className="col-span-2" detail={project.reference} />
          <Metric label="Armoire" value={cabinet.description || cabinet.reference} />
          <Metric label="Référence armoire" value={cabinet.reference} />
          <Metric label="Réseau" value={cabinet.network} />
          <Metric label="Tension" value={totals ? `${totals.networkVoltage} V` : '—'} />
          <Metric label="Nombre de départs" value={feeders.length} />
        </div>
      </SectionCard>

      {outcome.missing.length > 0 && (
        <Notice
          actions={<Link className="font-bold underline" to={`${base}/feeders`}>Aller aux départs</Link>}
          title="Bilan incomplet"
          tone="warn">
          Départs à calculer : {outcome.missing.join(', ')}.
        </Notice>
      )}
      {feeders.length === 0 && <Notice tone="warn" title="Aucun départ">Ajoutez et calculez des départs avant le bilan.</Notice>}
      {stale && (
        <Notice tone="warn" title="Bilan obsolète">
          Un départ a été recalculé (ou ajouté/supprimé) depuis l'enregistrement du bilan. Enregistrez à nouveau le bilan pour mettre à jour les étapes suivantes.
        </Notice>
      )}
      {outcome.ready && nonCompliantCount > 0 && (
        <Notice tone="error" title="Départs non conformes">
          {nonCompliantCount} départ(s) ne sont pas conformes. Corrigez-les dans leur calcul avant de valider le bilan.
        </Notice>
      )}
      {outcome.warnings.map((warning) => (
        <Notice key={warning} tone="info">{warning}</Notice>
      ))}

      <SectionCard icon="functions" subtitle="Résumé automatique" title="Résumé du bilan">
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-4" data-testid="balance-summary">
          <Metric label="Nombre total de départs" testId="m-count" value={totals?.feederCount ?? outcome.lines.length} />
          <Metric label="Puissance installée totale" testId="m-installed" unit="kW" value={totals ? formatNumber(totals.installedPowerKw, 1) : '—'} />
          <Metric label="Puissance demandée" testId="m-demand" unit="kW" value={totals ? formatNumber(totals.demandPowerKw, 1) : '—'} />
          <Metric label="Courant total" testId="m-current" unit="A" value={totals ? formatNumber(totals.totalCurrent, 1) : '—'} />
          <Metric label="Facteur de puissance global" testId="m-pf" value={totals ? formatNumber(totals.globalPowerFactor, 2) : '—'} />
          <Metric label="Tension réseau" testId="m-voltage" unit="V" value={totals ? totals.networkVoltage : '—'} />
          <Metric label="Phases" testId="m-phases" value={totals ? totals.phases : '—'} />
          <Metric label="Puissance apparente" unit="kVA" value={totals ? formatNumber(totals.apparentPowerKva, 1) : '—'} />
        </div>
      </SectionCard>

      <SectionCard
        icon="table_rows"
        subtitle="Puissance, cos φ, courant et section repris de chaque calcul de départ"
        title="Départs pris en compte">
        <div className="overflow-x-auto">
          <table className="w-full text-left" data-testid="balance-table">
            <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Référence', 'Désignation', 'Type de charge', 'Puissance', 'cos φ', "Courant d'emploi", 'Section', "Ku", 'Statut'].map((heading) => (
                  <th className="whitespace-nowrap px-space-md py-space-sm" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm">
              {outcome.lines.map((line) => {
                const [tone, label] = LINE_STATUS[line.status] ?? ['neutral', line.status]
                return (
                  <tr data-balance-line={line.reference} key={line.feederId}>
                    <td className="px-space-md py-space-sm font-tech-data-md font-bold text-secondary">{line.reference}</td>
                    <td className="px-space-md py-space-sm font-semibold">{line.designation}</td>
                    <td className="px-space-md py-space-sm">{line.loadType}</td>
                    <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatNumber(line.powerKw, 1)} kW</td>
                    <td className="px-space-md py-space-sm font-tech-data-md">{formatNumber(line.powerFactor, 2)}</td>
                    <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatNumber(line.designCurrent, 1)} A</td>
                    <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatSection(line.section)}</td>
                    <td className="px-space-md py-space-sm">
                      <input
                        aria-label={`Ku ${line.reference}`}
                        className={`${formInputClass} h-9 w-20 font-tech-data-md`}
                        max="1"
                        min="0"
                        onChange={(event) => setKu((current) => ({ ...current, [line.feederId]: event.target.value }))}
                        step="0.05"
                        type="number"
                        value={ku[line.feederId] ?? BALANCE_DEFAULTS.utilizationFactor}
                      />
                      {outcome.errors.utilizationFactors[line.feederId] && <div className="font-tech-unit text-tech-unit text-error">{outcome.errors.utilizationFactors[line.feederId]}</div>}
                    </td>
                    <td className="px-space-md py-space-sm"><StatusPill tone={tone}>{label}</StatusPill></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        icon="tune"
        subtitle="Aucune valeur normative n'est imposée : 1,00 = pas de réduction. Ks s'applique à l'ensemble, Ku à chaque départ."
        title="Coefficients configurables">
        <div className="flex flex-wrap items-end gap-space-lg">
          <label className="space-y-space-xs">
            <span className="block font-body-sm text-body-sm font-semibold text-on-surface">Facteur de simultanéité Ks</span>
            <input
              aria-label="Facteur de simultanéité Ks"
              className={`${formInputClass} w-40 font-tech-data-md`}
              data-testid="ks-input"
              max="1"
              min="0"
              onChange={(event) => setKs(event.target.value)}
              step="0.05"
              type="number"
              value={ks}
            />
            {outcome.errors.simultaneityFactor && <span className="block font-tech-unit text-tech-unit text-error">{outcome.errors.simultaneityFactor}</span>}
          </label>
          <p className="max-w-xl font-tech-unit text-tech-unit text-on-surface-variant">
            Pdemandée = Ks × Σ (Ku × P). Le courant global est obtenu par somme vectorielle des puissances absorbées (actives et réactives) pondérées par Ku puis Ks.
          </p>
        </div>
      </SectionCard>

      <section
        className={`rounded-xl p-space-lg shadow-xl ${validated ? 'bg-primary-container text-surface-bright' : 'bg-surface-container-high text-on-surface'}`}
        data-testid="balance-result">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs font-headline-md text-headline-md font-bold" data-testid="balance-status">
              <span className="material-symbols-outlined">{validated ? 'check_circle' : outcome.ready ? 'warning' : 'hourglass_empty'}</span>
              {BALANCE_STATUS_LABELS[outcome.status]}
            </div>
            {totals && (
              <div className="mt-space-sm grid grid-cols-2 gap-x-space-xl gap-y-space-2xs font-tech-data-md text-tech-data-md md:grid-cols-4">
                <span>Puissance installée : <strong>{formatNumber(totals.installedPowerKw, 1)} kW</strong></span>
                <span>Puissance demandée : <strong>{formatNumber(totals.demandPowerKw, 1)} kW</strong></span>
                <span>Courant calculé : <strong>{formatNumber(totals.totalCurrent, 1)} A</strong></span>
                <span>cos φ global : <strong>{formatNumber(totals.globalPowerFactor, 2)}</strong></span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-space-xs">
            {upToDate ? (
              <StatusPill icon="task_alt" tone="ok" data-testid="balance-saved">Bilan enregistré</StatusPill>
            ) : (
              <Button data-testid="save-balance" disabled={!outcome.ready || saving} icon="save" onClick={save}>
                {saving ? 'Enregistrement...' : 'Enregistrer le bilan'}
              </Button>
            )}
          </div>
        </div>
        {error && <Notice className="mt-space-md" tone="error">{error}</Notice>}
      </section>
    </WorkflowStepPage>
  )
}

function PowerBalancePage() {
  const { projectId, cabinetId } = useParams()
  const loader = useCallback(() => fetchBalanceData(projectId, cabinetId), [projectId, cabinetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour aux départs" backTo={`/projects/${projectId}/cabinets/${cabinetId}/feeders`} state={state}>
      {state.data && (
        <BalanceEditor base={`/projects/${projectId}/cabinets/${cabinetId}`} data={state.data} key={state.data.saved?.updatedAt ?? 'new'} onSaved={state.reload} />
      )}
    </LoadState>
  )
}

export default PowerBalancePage
