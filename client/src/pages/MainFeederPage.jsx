import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button } from '../components/ui/buttons.jsx'
import { NumberField, SelectField } from '../components/ui/fields.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Metric from '../components/ui/Metric.jsx'
import Notice from '../components/ui/Notice.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { AUTO_SECTION, CONDUCTOR_MATERIALS, INSULATION_TYPES } from '../domain/calculation/constants.js'
import { prototypeReferenceProvider } from '../domain/calculation/referenceProvider.js'
import { buildDefaultMainFeederInputs, calculateMainFeeder, toMainFeederPayload } from '../domain/mainFeeder/index.js'
import { PROTECTION_TYPES, STANDARD_RATINGS_A, suggestRating } from '../domain/protection.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'
import { formatNumber, formatSection } from '../lib/format.js'
import { canonical } from '../lib/json.js'

const provider = prototypeReferenceProvider

async function fetchMainFeederData(projectId, cabinetId) {
  const [project, cabinet, calculations, balance, saved] = await Promise.all([
    api.projects.get(projectId),
    api.cabinets.get(cabinetId),
    api.cabinets.calculations(cabinetId),
    api.cabinets.getBalance(cabinetId),
    api.cabinets.getMainFeeder(cabinetId),
  ])
  return { project, cabinet, calculations, balance, saved }
}

const CHECK_LABEL = { compliant: ['ok', 'Conforme'], non_compliant: ['error', 'Non conforme'] }

function CheckRow({ label, detail, status, testId }) {
  const [tone, text] = CHECK_LABEL[status]
  return (
    <div className="flex items-center justify-between gap-space-md border-b border-on-primary-container/20 py-space-xs font-body-sm text-body-sm text-on-primary-container">
      <span>
        {label}
        {detail && <span className="block font-tech-unit text-tech-unit">{detail}</span>}
      </span>
      <StatusPill data-testid={testId} icon={status === 'compliant' ? 'check_circle' : 'cancel'} tone={tone}>{text}</StatusPill>
    </div>
  )
}

function MainFeederEditor({ data, base, onSaved }) {
  const { project, cabinet, calculations, balance, saved } = data
  const totals = balance.result
  const [values, setValues] = useState(() => saved?.inputs ?? buildDefaultMainFeederInputs({ cabinet, balanceTotals: totals, calculations }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (patch) => setValues((current) => ({ ...current, ...patch }))
  const setCoefficient = (key) => (value) => setValues((current) => ({ ...current, coefficients: { ...current.coefficients, [key]: value } }))

  const outcome = useMemo(() => calculateMainFeeder(values, totals), [values, totals])
  const { result, errors } = outcome
  const suggested = suggestRating(totals.totalCurrent)
  const ratingOptions = [...new Set([...STANDARD_RATINGS_A, Number(values.rating)].filter((rating) => rating > 0))].sort((a, b) => a - b).map((rating) => ({ value: String(rating), label: `${rating} A` }))
  const sections = outcome.table ? outcome.table.rows.map((row) => row.section) : provider.listSections()
  const sectionOptions = [{ value: AUTO_SECTION, label: 'Automatique' }, ...sections.map((section) => ({ value: String(section), label: formatSection(section) }))]

  const payload = outcome.ready ? toMainFeederPayload(outcome, balance.updatedAt) : null
  const savedSignature = saved ? canonical(saved.inputs) : null
  const unsavedChanges = !saved || !payload || canonical(payload.inputs) !== savedSignature
  const stale = Boolean(saved) && new Date(balance.updatedAt) > new Date(saved.basedOn)
  const upToDate = Boolean(saved) && !unsavedChanges && !stale
  const compliant = outcome.ready && result.globalStatus === 'compliant'

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.cabinets.saveMainFeeder(cabinet._id, payload)
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WorkflowStepPage
      current="mainFeeder"
      description="Dimensionné automatiquement à partir du bilan de puissance : Ib ≤ In ≤ Iz et chute de tension."
      eyebrow="Étape 06 • Départ général"
      footer={
        <NextStepBar
          disabled={!(upToDate && compliant)}
          hint={upToDate && compliant ? 'Départ général enregistré : la nomenclature est générée automatiquement.' : compliant ? 'Enregistrez le départ général pour continuer.' : 'Le départ général doit être conforme pour générer la nomenclature.'}
          label="Générer la nomenclature"
          to={`${base}/bom`}
        />
      }
      icon="electrical_services"
      layout="wide"
      projectId={project._id}
      title="Départ général">
      <SectionCard icon="analytics" subtitle="Repris automatiquement du bilan de puissance enregistré" title="Données calculées">
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-5" data-testid="mf-inputs">
          <Metric label="Puissance demandée" unit="kW" value={formatNumber(totals.demandPowerKw, 1)} />
          <Metric label="Courant calculé" testId="mf-ib" unit="A" value={formatNumber(totals.totalCurrent, 1)} />
          <Metric label="Tension" unit="V" value={totals.networkVoltage} />
          <Metric label="Nombre de phases" value={totals.phases} />
          <Metric label="cos φ global" value={formatNumber(totals.globalPowerFactor, 2)} />
        </div>
      </SectionCard>

      {stale && (
        <Notice tone="warn" title="Bilan modifié">
          Le bilan de puissance a été enregistré à nouveau depuis le dernier enregistrement du départ général : vérifiez les résultats puis enregistrez-le.
        </Notice>
      )}

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex flex-col gap-space-lg xl:col-span-8">
          <SectionCard icon="settings" subtitle="Protection générale et câble d'alimentation de l'armoire" title="Configuration">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="mf-form">
              <SelectField className="md:col-span-6" error={errors.protectionType} label="Protection générale" onChange={(value) => set({ protectionType: value })} options={PROTECTION_TYPES} value={values.protectionType} />
              <div className="md:col-span-6">
                <SelectField
                  error={errors.rating}
                  hint={suggested ? `Calibre minimal suggéré : ${suggested} A (plus petit calibre ≥ Ib)` : 'Ib dépasse la série de calibres'}
                  label="Calibre"
                  onChange={(value) => set({ rating: value })}
                  options={ratingOptions}
                  value={String(values.rating)}
                />
              </div>
              <SelectField className="md:col-span-4" error={errors.material} label="Type de câble — conducteur" onChange={(value) => set({ material: value })} options={CONDUCTOR_MATERIALS} value={values.material} />
              <SelectField className="md:col-span-4" error={errors.insulation} label="Type de câble — isolant" onChange={(value) => set({ insulation: value })} options={INSULATION_TYPES} value={values.insulation} />
              <SelectField className="md:col-span-4" error={errors.section} hint="Automatique : plus petite section vérifiant Iz ≥ In et ΔU" label="Section" onChange={(value) => set({ section: value })} options={sectionOptions} value={String(values.section)} />
              <NumberField className="md:col-span-6" error={errors.length} hint={`Distance armoire–TGBT saisie sur l'armoire : ${cabinet.distanceToTGBT ?? '—'} m`} label="Longueur" min="0" onChange={(value) => set({ length: value })} unit="m" value={values.length} />
              <SelectField className="md:col-span-6" error={errors.installationMethod} label="Mode de pose" onChange={(value) => set({ installationMethod: value })} options={provider.listInstallationMethods().map((method) => method.label)} value={values.installationMethod} />
            </div>
            {suggested && Number(values.rating) !== suggested && (
              <Button icon="auto_fix_high" onClick={() => set({ rating: suggested })} variant="secondary">Utiliser le calibre suggéré ({suggested} A)</Button>
            )}
          </SectionCard>

          <SectionCard icon="tune" subtitle="Hypothèses de correction (1,00 = aucune correction) et limite de chute de tension" title="Hypothèses de calcul">
            <div className="grid grid-cols-2 gap-space-md md:grid-cols-4">
              <NumberField error={errors.k3} label="K3" max="1.5" min="0.1" onChange={setCoefficient('k3')} step="0.01" value={values.coefficients.k3} />
              <NumberField error={errors.k4} label="K4" max="1.5" min="0.1" onChange={setCoefficient('k4')} step="0.01" value={values.coefficients.k4} />
              <NumberField error={errors.k5} label="K5" max="1.5" min="0.1" onChange={setCoefficient('k5')} step="0.01" value={values.coefficients.k5} />
              <NumberField
                error={errors.maxVoltageDrop}
                hint="Par défaut : ΔU amont supposée par les calculs des départs"
                label="ΔU maximale admissible"
                max="100"
                min="0"
                onChange={(value) => set({ maxVoltageDrop: value })}
                unit="%"
                value={values.maxVoltageDrop}
              />
            </div>
          </SectionCard>
          {outcome.issues.map((issue) => (
            <Notice key={issue.message} tone="error" title="Calcul bloqué">{issue.message}</Notice>
          ))}
        </div>

        <aside aria-label="Résultat du départ général" className="space-y-space-md rounded-xl bg-primary-container p-space-lg text-surface-bright shadow-xl xl:sticky xl:top-20 xl:col-span-4" data-testid="mf-result">
          <div>
            <span className="font-label-caps text-label-caps uppercase text-secondary-fixed">Résultats en direct</span>
            <h2 className="mt-space-xs font-headline-sm text-headline-sm font-bold">Résultat du départ général</h2>
          </div>
          {!outcome.ready ? (
            <p className="rounded-lg bg-tertiary-container p-space-md font-body-sm text-on-primary-container">Complétez la configuration pour obtenir le résultat.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="rounded-lg bg-tertiary-container p-space-md">
                  <div className="font-tech-unit text-tech-unit text-on-primary-container">Courant calculé Ib</div>
                  <div className="font-tech-data-lg text-tech-data-lg font-bold" data-testid="mf-r-ib">{formatNumber(result.designCurrent, 1)} A</div>
                </div>
                <div className="rounded-lg bg-tertiary-container p-space-md">
                  <div className="font-tech-unit text-tech-unit text-on-primary-container">Calibre choisi In</div>
                  <div className="font-tech-data-lg text-tech-data-lg font-bold" data-testid="mf-r-in">{result.rating} A</div>
                </div>
                <div className="rounded-lg bg-tertiary-container p-space-md">
                  <div className="font-tech-unit text-tech-unit text-on-primary-container">Section</div>
                  <div className="font-tech-data-lg text-tech-data-lg font-bold" data-testid="mf-r-section">{formatSection(result.section)}</div>
                </div>
                <div className="rounded-lg bg-tertiary-container p-space-md">
                  <div className="font-tech-unit text-tech-unit text-on-primary-container">Courant admissible Iz</div>
                  <div className="font-tech-data-lg text-tech-data-lg font-bold" data-testid="mf-r-iz">{formatNumber(result.correctedCurrentCapacity, 1)} A</div>
                </div>
              </div>
              <div className="rounded-lg bg-tertiary-container p-space-md font-body-sm">
                <div className="font-tech-unit text-tech-unit text-on-primary-container">Chute de tension</div>
                <strong data-testid="mf-r-du">{formatNumber(result.voltageDropPercent, 2)} %</strong>
                <span className="text-on-primary-container"> ({formatNumber(result.voltageDropVolts, 2)} V) — limite {formatNumber(result.voltageDropLimitPercent, 2)} %</span>
              </div>
              <div>
                <CheckRow detail={`${formatNumber(result.designCurrent, 1)} A ≤ ${result.rating} A`} label="Ib ≤ In" status={result.checks.ibLeIn} testId="mf-check-ib-in" />
                <CheckRow detail={`${result.rating} A ≤ ${formatNumber(result.correctedCurrentCapacity, 1)} A`} label="In ≤ Iz" status={result.checks.inLeIz} testId="mf-check-in-iz" />
                <CheckRow label="Chute de tension" status={result.checks.voltageDrop} testId="mf-check-du" />
              </div>
              <div
                className={`flex items-center gap-space-xs rounded-lg px-space-md py-space-sm font-body-sm font-bold ${compliant ? 'bg-secondary text-on-secondary' : 'bg-error-container text-on-error-container'}`}
                data-testid="mf-status">
                <span className="material-symbols-outlined text-[18px]">{compliant ? 'check_circle' : 'cancel'}</span>
                {compliant ? 'Départ général conforme ✓' : 'Départ général non conforme ✕'}
              </div>
            </>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="pt-space-sm">
            {upToDate ? (
              <StatusPill data-testid="mf-saved" icon="task_alt" tone="ok">Départ général enregistré</StatusPill>
            ) : (
              <Button className="w-full" data-testid="save-main-feeder" disabled={!outcome.ready || saving} icon="save" onClick={save}>
                {saving ? 'Enregistrement...' : 'Enregistrer le départ général'}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </WorkflowStepPage>
  )
}

function MainFeederPage() {
  const { projectId, cabinetId } = useParams()
  const base = `/projects/${projectId}/cabinets/${cabinetId}`
  const loader = useCallback(() => fetchMainFeederData(projectId, cabinetId), [projectId, cabinetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'armoire" backTo={`${base}/feeders`} state={state}>
      {state.data && !state.data.balance && (
        <div className="space-y-space-md p-space-xl">
          <Notice tone="warn" title="Bilan de puissance requis">
            Le départ général utilise les résultats du bilan de puissance. Calculez et enregistrez d'abord le bilan.
          </Notice>
          <Link className="font-body-md font-semibold text-secondary hover:underline" to={`${base}/balance`}>→ Aller au bilan de puissance</Link>
        </div>
      )}
      {state.data?.balance && (
        <MainFeederEditor base={base} data={state.data} key={`${state.data.saved?.updatedAt ?? 'new'}-${state.data.balance.updatedAt}`} onSaved={state.reload} />
      )}
    </LoadState>
  )
}

export default MainFeederPage
