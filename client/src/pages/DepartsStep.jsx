import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button, LinkButton } from '../components/ui/buttons.jsx'
import FormField, { formInputClass, formSelectClass } from '../components/ui/FormField.jsx'
import Notice from '../components/ui/Notice.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { CHECK_STATUS, CHECK_STATUS_LABELS, FEEDER_STATUS, FEEDER_STATUS_LABELS, LOAD_TYPES, POWER_UNITS } from '../domain/calculation/constants.js'
import { FEEDER_EXAMPLES } from '../data/feederExamples.js'
import { useFlowContext } from '../hooks/useFlowContext.js'
import { api } from '../lib/api.js'
import { formatNumber, formatSection } from '../lib/format.js'
import StatusPill from '../components/ui/StatusPill.jsx'

const STATUS_TONE = { [FEEDER_STATUS.DRAFT]: 'neutral', [FEEDER_STATUS.CALCULATED]: 'ok', [FEEDER_STATUS.NON_COMPLIANT]: 'error' }
const EMPTY_FEEDER = { reference: '', designation: '', loadType: 'Moteur', power: '', powerUnit: 'kW', voltage: 400, cableLength: '' }

// Prochain départ proposé : le premier exemple (D01, D02, D03) absent de la liste, sinon Dnn.
function nextFeederDraft(feeders) {
  const used = new Set(feeders.map((feeder) => feeder.reference))
  const example = FEEDER_EXAMPLES.find((candidate) => !used.has(candidate.reference))
  if (example) return { ...example }
  let index = feeders.length + 1
  while (used.has(`D${String(index).padStart(2, '0')}`)) index += 1
  return { ...EMPTY_FEEDER, reference: `D${String(index).padStart(2, '0')}` }
}

// Charge les départs de l'armoire et leurs calculs enregistrés (sans effet de bord sur l'état React).
async function fetchCabinetFeeders(cabinetId) {
  const [feeders, calculations] = await Promise.all([api.feeders.list(cabinetId), api.cabinets.calculations(cabinetId)])
  // L'API trie du plus récent au plus ancien ; la liste est affichée dans l'ordre de référence (D01, D02...).
  feeders.sort((a, b) => a.reference.localeCompare(b.reference, 'fr', { numeric: true }))
  return { feeders, calculations: Object.fromEntries(calculations.map((calculation) => [calculation.feederId, calculation])) }
}

function statusOf(feeder, calculation) {
  // Départ modifié après son calcul : le résultat affiché est ancien.
  if (feeder.status === FEEDER_STATUS.DRAFT && calculation) return { tone: 'warn', label: 'À recalculer' }
  return { tone: STATUS_TONE[feeder.status] ?? 'neutral', label: FEEDER_STATUS_LABELS[feeder.status] ?? FEEDER_STATUS_LABELS.draft }
}

function ResultDetails({ calculation, path }) {
  const { result } = calculation
  const check = (status) => (status === CHECK_STATUS.COMPLIANT ? 'Conforme' : CHECK_STATUS_LABELS[status])
  return (
    <div className="grid grid-cols-2 gap-space-md md:grid-cols-4" data-testid="feeder-details">
      {[
        ['Courant d\'emploi Ib', `${formatNumber(result.designCurrent, 1)} A`],
        ['Section', formatSection(result.cable.recommendedSection)],
        ['Iz corrigé', `${formatNumber(result.cable.correctedCurrentCapacity, 1)} A (K = ${formatNumber(result.coefficients.k, 2)})`],
        ['ΔU départ / limite', `${formatNumber(result.voltageDrop.feederPercent, 2)} % / ${formatNumber(result.voltageDrop.availablePercent, 2)} %`],
        ['Conformité thermique', check(result.checks.thermal)],
        ['Conformité ΔU', check(result.checks.voltageDrop)],
        ['Icu / Icc', `${formatNumber(result.shortCircuit.breakingCapacityKa, 1)} kA / ${formatNumber(result.shortCircuit.iccKa, 1)} kA`],
        ['Conducteur', `${result.cable.material} ${result.cable.insulation}, ${result.cable.installationMethod}`],
      ].map(([label, value]) => (
        <div key={label}>
          <div className="font-tech-unit text-tech-unit text-on-surface-variant">{label}</div>
          <div className="font-body-sm text-body-sm font-semibold text-on-surface">{value}</div>
        </div>
      ))}
      <div className="col-span-2 flex items-end md:col-span-4">
        <Link className="font-body-sm text-body-sm font-semibold text-secondary hover:underline" to={path}>
          Ouvrir le calcul complet (7 formulaires) →
        </Link>
      </div>
    </div>
  )
}

function DepartsStep() {
  const { projectId, cabinetId } = useParams()
  const location = useLocation()
  const { cabinet, error: contextError } = useFlowContext(projectId, cabinetId)
  const [feeders, setFeeders] = useState([])
  const [calculations, setCalculations] = useState({})
  const [form, setForm] = useState(() => nextFeederDraft([]))
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  // Message de confirmation transmis par la page de calcul après l'enregistrement d'un calcul.
  const [savedNotice, setSavedNotice] = useState(location.state?.saved ?? '')

  const applyData = useCallback((data) => {
    setFeeders(data.feeders)
    setCalculations(data.calculations)
  }, [])

  const reload = useCallback(async () => {
    const data = await fetchCabinetFeeders(cabinetId)
    applyData(data)
    return data.feeders
  }, [cabinetId, applyData])

  useEffect(() => {
    let active = true
    fetchCabinetFeeders(cabinetId)
      .then((data) => {
        if (!active) return
        applyData(data)
        setForm(nextFeederDraft(data.feeders))
        setShowForm(data.feeders.length === 0)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => {
      active = false
    }
  }, [cabinetId, applyData])

  const progress = useMemo(
    () => ({ total: feeders.length, done: feeders.filter((feeder) => feeder.status !== FEEDER_STATUS.DRAFT).length }),
    [feeders],
  )
  const allCalculated = feeders.length > 0 && progress.done === feeders.length
  const remaining = feeders.length - progress.done

  function validate(feeder) {
    if (!feeder.reference.trim()) return 'La référence est requise.'
    if (!feeder.designation.trim()) return 'La désignation est requise.'
    if (!(Number(feeder.power) > 0)) return 'La puissance doit être supérieure à 0.'
    if (!(Number(feeder.voltage) > 0)) return 'La tension doit être supérieure à 0.'
    if (!(Number(feeder.cableLength) > 0)) return 'La longueur du câble doit être supérieure à 0.'
    return ''
  }

  const toPayload = (draft) => ({ ...draft, power: Number(draft.power), voltage: Number(draft.voltage), cableLength: Number(draft.cableLength) })

  async function createFeeders(drafts) {
    setError('')
    setBusy(true)
    try {
      for (const draft of drafts) await api.feeders.create({ ...toPayload(draft), cabinetId })
      const loaded = await reload()
      setForm(nextFeederDraft(loaded))
      setShowForm(false)
    } catch (requestError) {
      setError(requestError.message)
      await reload().catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  async function saveFeeder(event) {
    event.preventDefault()
    const message = validate(form)
    if (message) return setError(message)
    if (!editingId) return createFeeders([form])

    setError('')
    setBusy(true)
    try {
      // Modifier un départ déjà calculé le remet « à calculer » : son calcul doit être refait avec les nouvelles données.
      const hadCalculation = Boolean(calculations[editingId])
      await api.feeders.update(editingId, { ...toPayload(form), ...(hadCalculation ? { status: FEEDER_STATUS.DRAFT } : {}) })
      const loaded = await reload()
      setEditingId(null)
      setForm(nextFeederDraft(loaded))
      setShowForm(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(feeder) {
    setEditingId(feeder._id)
    setForm({ reference: feeder.reference, designation: feeder.designation, loadType: feeder.loadType, power: feeder.power, powerUnit: feeder.powerUnit, voltage: feeder.voltage, cableLength: feeder.cableLength })
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setEditingId(null)
    setForm(nextFeederDraft(feeders))
    setShowForm(false)
    setError('')
  }

  async function addExamples() {
    const used = new Set(feeders.map((feeder) => feeder.reference))
    await createFeeders(FEEDER_EXAMPLES.filter((example) => !used.has(example.reference)))
  }

  async function removeFeeder(feeder) {
    if (!window.confirm(`Supprimer le départ ${feeder.reference} et son calcul ?`)) return
    setError('')
    try {
      await api.feeders.remove(feeder._id)
      const loaded = await reload()
      setForm(nextFeederDraft(loaded))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const base = `/projects/${projectId}/cabinets/${cabinetId}`
  const missingExamples = FEEDER_EXAMPLES.some((example) => !feeders.some((feeder) => feeder.reference === example.reference))

  return (
    <WorkflowStepPage
      cabinet={cabinet}
      current="feeders"
      description="Ajoutez les départs de cette armoire, puis calculez chaque départ séparément : le câble fait partie du calcul du départ."
      eyebrow="Étape 03 • Départs"
      footer={
        <NextStepBar
          disabled={!allCalculated}
          hint={
            allCalculated
              ? 'Tous les départs sont calculés : le bilan de puissance se construit automatiquement à partir de leurs résultats.'
              : feeders.length === 0
                ? 'Ajoutez au moins un départ, puis calculez-le.'
                : `${remaining} départ${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} à calculer avant le bilan de puissance.`
          }
          label="Calculer le bilan de puissance"
          to={`${base}/balance`}
        />
      }
      icon="account_tree"
      progress={progress}
      projectId={projectId}
      refreshKey={feeders.map((feeder) => feeder.status).join(',')}
      title="Départs de l'armoire">
      <div className="flex flex-col gap-space-lg">
        {savedNotice && (
          <Notice actions={<Button onClick={() => setSavedNotice('')} variant="ghost">Fermer</Button>} tone="success" title={`Calcul du départ ${savedNotice} enregistré`}>
            Vous êtes de retour sur l'armoire : calculez le départ suivant, ou passez au bilan de puissance une fois tous les départs calculés.
          </Notice>
        )}
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Départs de l'armoire {cabinet?.reference}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant" data-testid="feeders-progress">
                {progress.done} départ{progress.done > 1 ? 's' : ''} calculé{progress.done > 1 ? 's' : ''} sur {progress.total}
              </p>
            </div>
            <div className="flex flex-wrap gap-space-sm">
              {missingExamples && (
                <Button disabled={busy} icon="playlist_add" onClick={addExamples} variant="secondary">
                  Ajouter les départs d'exemple
                </Button>
              )}
              <Button
                icon="add"
                onClick={() => {
                  setEditingId(null)
                  setForm(nextFeederDraft(feeders))
                  setShowForm((visible) => !visible || Boolean(editingId))
                }}>
                Ajouter un départ
              </Button>
            </div>
          </div>
          {feeders.length === 0 ? (
            <div className="p-space-xl text-center font-body-sm text-body-sm text-on-surface-variant">
              Aucun départ. Ajoutez un départ ou chargez les départs d'exemple D01 à D03.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" data-testid="feeders-table">
                <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    {['Réf.', 'Désignation', 'Type de charge', 'Puissance', 'Ib', 'Section', 'ΔU', 'Statut', 'Actions'].map((heading) => (
                      <th className="whitespace-nowrap px-space-md py-space-md" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-on-surface">
                  {feeders.map((feeder) => {
                    const calculation = calculations[feeder._id]
                    const result = calculation?.result
                    const status = statusOf(feeder, calculation)
                    const calcPath = `${base}/feeders/${feeder._id}/calculation`
                    const drop = result?.checks.voltageDrop
                    return (
                      <Fragment key={feeder._id}>
                        <tr className="hover:bg-surface-container-low/60" data-feeder={feeder.reference}>
                          <td className="px-space-md py-space-md font-tech-data-md font-bold text-secondary">{feeder.reference}</td>
                          <td className="px-space-md py-space-md font-semibold">{feeder.designation}</td>
                          <td className="px-space-md py-space-md">{feeder.loadType}</td>
                          <td className="whitespace-nowrap px-space-md py-space-md font-tech-data-md">
                            {formatNumber(feeder.power, feeder.power % 1 ? 1 : 0)} {feeder.powerUnit}
                          </td>
                          <td className="whitespace-nowrap px-space-md py-space-md font-tech-data-md" data-cell="ib">
                            {result ? `${formatNumber(result.designCurrent, 1)} A` : '—'}
                          </td>
                          <td className="whitespace-nowrap px-space-md py-space-md font-tech-data-md" data-cell="section">
                            {result ? formatSection(result.cable.recommendedSection) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-space-md py-space-md" data-cell="du">
                            {drop ? (
                              <span className={drop === CHECK_STATUS.COMPLIANT ? 'font-semibold' : 'font-bold text-error'}>
                                {CHECK_STATUS_LABELS[drop]}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-space-md py-space-md" data-cell="status">
                            <StatusPill tone={status.tone}>{status.label}</StatusPill>
                          </td>
                          <td className="whitespace-nowrap px-space-md py-space-md">
                            <div className="flex items-center gap-space-xs">
                              {calculation && (
                                <button
                                  aria-expanded={expandedId === feeder._id}
                                  className="rounded-lg px-space-sm py-space-xs font-body-sm font-semibold text-secondary hover:bg-surface-container-low"
                                  data-action="view"
                                  onClick={() => setExpandedId(expandedId === feeder._id ? null : feeder._id)}
                                  type="button">
                                  Voir
                                </button>
                              )}
                              <button
                                className="rounded-lg px-space-sm py-space-xs font-body-sm font-semibold text-secondary hover:bg-surface-container-low"
                                data-action="edit"
                                onClick={() => startEdit(feeder)}
                                type="button">
                                Modifier
                              </button>
                              <LinkButton className="h-9 px-space-md" data-action="calculate" icon="calculate" to={calcPath}>
                                {feeder.status === FEEDER_STATUS.DRAFT && !calculation ? 'Calculer' : 'Recalculer'}
                              </LinkButton>
                              <button
                                aria-label={`Supprimer le départ ${feeder.reference}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                                onClick={() => removeFeeder(feeder)}
                                type="button">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === feeder._id && calculation && (
                          <tr className="bg-surface-container-low/50">
                            <td className="px-space-md py-space-md" colSpan={9}>
                              <ResultDetails calculation={calculation} path={calcPath} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <form className="space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:p-space-xl" data-testid="feeder-form" onSubmit={saveFeeder}>
            <div className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">{editingId ? 'edit' : 'add_circle'}</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{editingId ? `Modifier le départ ${form.reference}` : 'Ajouter un départ'}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {editingId
                    ? 'Le calcul du départ devra être refait avec ces nouvelles données.'
                    : 'Ces valeurs seront reprises automatiquement dans le calcul du départ.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
              <FormField className="md:col-span-3" label="Référence" required>
                <input className={`${formInputClass} font-tech-data-md font-bold`} onChange={update('reference')} value={form.reference} />
              </FormField>
              <FormField className="md:col-span-5" label="Désignation" required>
                <input className={formInputClass} onChange={update('designation')} value={form.designation} />
              </FormField>
              <FormField className="md:col-span-4" label="Type de charge">
                <select className={formSelectClass} onChange={update('loadType')} value={form.loadType}>
                  {LOAD_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </FormField>
              <FormField className="md:col-span-3" label="Puissance" required>
                <input className={`${formInputClass} font-tech-data-md`} min="0" onChange={update('power')} step="any" type="number" value={form.power} />
              </FormField>
              <FormField className="md:col-span-3" label="Unité">
                <select className={formSelectClass} onChange={update('powerUnit')} value={form.powerUnit}>
                  {POWER_UNITS.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </FormField>
              <FormField className="md:col-span-3" label="Tension (V)" required>
                <input className={`${formInputClass} font-tech-data-md`} min="0" onChange={update('voltage')} step="any" type="number" value={form.voltage} />
              </FormField>
              <FormField className="md:col-span-3" label="Longueur du câble (m)" required>
                <input className={`${formInputClass} font-tech-data-md`} min="0" onChange={update('cableLength')} step="any" type="number" value={form.cableLength} />
              </FormField>
            </div>
            <div className="flex justify-end gap-space-sm">
              <Button onClick={cancelForm} variant="secondary">
                Annuler
              </Button>
              <Button disabled={busy} icon="save" type="submit">
                {editingId ? 'Enregistrer les modifications' : 'Enregistrer le départ'}
              </Button>
            </div>
          </form>
        )}

        {(error || contextError) && (
          <Notice tone="error">{error || contextError}</Notice>
        )}
      </div>
    </WorkflowStepPage>
  )
}

export default DepartsStep
