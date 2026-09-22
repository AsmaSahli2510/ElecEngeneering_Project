import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button } from '../components/ui/buttons.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Notice from '../components/ui/Notice.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { BOM_CATEGORIES, bomTotal, generateBom, lineTotal, mergeBom, toBomPayload } from '../domain/bom/index.js'
import { CATALOGUE } from '../domain/bom/catalogue.js'
import { formatMoney } from '../domain/quotation/index.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'
import { formatNumber } from '../lib/format.js'

async function fetchBomData(projectId, cabinetId) {
  const [project, cabinet, feeders, calculations, mainFeeder, saved] = await Promise.all([
    api.projects.get(projectId),
    api.cabinets.get(cabinetId),
    api.feeders.list(cabinetId),
    api.cabinets.calculations(cabinetId),
    api.cabinets.getMainFeeder(cabinetId),
    api.cabinets.getBom(cabinetId),
  ])
  feeders.sort((a, b) => a.reference.localeCompare(b.reference, 'fr', { numeric: true }))
  return { project, cabinet, feeders, calculations, mainFeeder, saved }
}

let uid = 0
const withUid = (item) => ({ ...item, _uid: `line-${(uid += 1)}` })
const EMPTY_LINE = { reference: '', designation: '', category: BOM_CATEGORIES[0], unit: 'u', quantity: 1, unitPrice: 0 }

const time = (value) => (value ? new Date(value).getTime() : 0)
const isMissingPrice = (item) => item.priceMissing && !(Number(item.unitPrice) > 0)

function lineError(line) {
  if (!line.reference.trim()) return 'Référence requise.'
  if (!line.designation.trim()) return 'Désignation requise.'
  if (!(Number(line.quantity) > 0)) return 'Quantité > 0 requise.'
  if (!(Number(line.unitPrice) >= 0) || line.unitPrice === '') return 'Prix unitaire ≥ 0 requis.'
  return ''
}

function LineFields({ line, onChange }) {
  const input = 'h-9 w-full rounded-lg bg-surface-container-low px-space-sm font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30'
  return (
    <>
      <td className="px-space-sm py-space-xs"><input aria-label="Référence" className={input} onChange={(e) => onChange({ reference: e.target.value })} value={line.reference} /></td>
      <td className="px-space-sm py-space-xs"><input aria-label="Désignation" className={input} onChange={(e) => onChange({ designation: e.target.value })} value={line.designation} /></td>
      <td className="px-space-sm py-space-xs">
        <select aria-label="Catégorie" className={`${input} cursor-pointer`} onChange={(e) => onChange({ category: e.target.value })} value={line.category}>
          {BOM_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </td>
      <td className="px-space-sm py-space-xs">
        <div className="flex gap-space-xs">
          <input aria-label="Quantité" className={`${input} w-20 font-tech-data-md`} min="0" onChange={(e) => onChange({ quantity: e.target.value })} step="any" type="number" value={line.quantity} />
          <input aria-label="Unité" className={`${input} w-14`} onChange={(e) => onChange({ unit: e.target.value })} value={line.unit} />
        </div>
      </td>
      <td className="px-space-sm py-space-xs"><input aria-label="Prix unitaire" className={`${input} w-28 font-tech-data-md`} min="0" onChange={(e) => onChange({ unitPrice: e.target.value })} step="any" type="number" value={line.unitPrice} /></td>
    </>
  )
}

function BomEditor({ data, base, onSaved }) {
  const { project, cabinet, feeders, calculations, mainFeeder, saved } = data
  const generated = useMemo(() => generateBom({ feeders, calculations, mainFeeder }), [feeders, calculations, mainFeeder])
  const [items, setItems] = useState(() => (saved.length > 0 ? saved : generated.lines).map(withUid))
  const [dirty, setDirty] = useState(saved.length === 0)
  const [editingUid, setEditingUid] = useState(null)
  const [draft, setDraft] = useState(null)
  const [adding, setAdding] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const total = bomTotal(items)
  const missingPrices = items.filter(isMissingPrice).length
  const savedUpdatedAt = Math.max(0, ...saved.map((item) => time(item.updatedAt)))
  const upstreamUpdatedAt = Math.max(0, ...calculations.map((calc) => time(calc.updatedAt)), time(mainFeeder?.updatedAt))
  const stale = saved.length > 0 && upstreamUpdatedAt > savedUpdatedAt && !dirty
  const canContinue = !dirty && saved.length > 0 && missingPrices === 0 && !stale

  const touch = (updater) => {
    setItems(updater)
    setDirty(true)
    setMessage('')
  }

  function regenerate() {
    const { items: merged, stats } = mergeBom(items, generated.lines)
    touch(() => merged.map((item) => (item._uid ? item : withUid(item))))
    setMessage(`Nomenclature régénérée : ${stats.added} ajoutée(s), ${stats.updated} mise(s) à jour, ${stats.removed} supprimée(s) ; ${stats.keptEdited} ligne(s) retouchée(s) conservée(s) et lignes manuelles inchangées.`)
  }

  function startEdit(item) {
    setEditingUid(item._uid)
    setDraft({ reference: item.reference, designation: item.designation, category: item.category, unit: item.unit, quantity: item.quantity, unitPrice: item.unitPrice })
    setError('')
  }

  function commitEdit() {
    const message = lineError(draft)
    if (message) return setError(message)
    touch((current) => current.map((item) => (item._uid === editingUid ? { ...item, ...draft, edited: item.source === 'auto' ? true : item.edited, priceMissing: item.priceMissing && !(Number(draft.unitPrice) > 0) } : item)))
    setEditingUid(null)
    setError('')
  }

  function commitAdd() {
    const message = lineError(adding)
    if (message) return setError(message)
    touch((current) => [...current, withUid({ ...adding, source: 'manual', edited: false, priceMissing: false })])
    setAdding(null)
    setError('')
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.cabinets.saveBom(cabinet._id, toBomPayload(items))
      setDirty(false)
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WorkflowStepPage
      actions={
        <Button data-testid="save-bom" disabled={!dirty || saving || items.length === 0} icon="save" onClick={save}>
          {saving ? 'Enregistrement...' : dirty ? 'Enregistrer la nomenclature' : 'Nomenclature enregistrée'}
        </Button>
      }
      current="bom"
      description="Générée automatiquement à partir des départs calculés et du départ général ; vous pouvez ajouter, modifier ou supprimer des composants."
      eyebrow="Étape 07 • Nomenclature"
      footer={
        <NextStepBar
          disabled={!canContinue}
          hint={
            canContinue
              ? 'Nomenclature enregistrée : le devis reprend automatiquement ses lignes.'
              : dirty
                ? 'Enregistrez la nomenclature pour créer le devis.'
                : missingPrices > 0
                  ? `${missingPrices} prix à renseigner avant de créer le devis.`
                  : stale
                    ? 'Les calculs ont changé : régénérez puis enregistrez la nomenclature.'
                    : 'La nomenclature est vide.'
          }
          label="Créer le devis"
          to={`${base}/quotation`}
        />
      }
      icon="list_alt"
      layout="wide"
      projectId={project._id}
      title="Nomenclature">
      {!mainFeeder && (
        <Notice actions={<Link className="font-bold underline" to={`${base}/main-feeder`}>Départ général</Link>} tone="warn" title="Départ général non enregistré">
          Les lignes du départ général (protection et câble) seront ajoutées dès qu'il sera enregistré.
        </Notice>
      )}
      {generated.warnings.map((warning) => <Notice key={warning} tone="warn">{warning}</Notice>)}
      {stale && <Notice tone="warn" title="Nomenclature à régénérer">Un calcul ou le départ général a changé depuis l'enregistrement de la nomenclature.</Notice>}
      {saved.length === 0 && items.length > 0 && <Notice tone="info" title="Nomenclature générée automatiquement">Vérifiez les lignes puis enregistrez-la pour poursuivre vers le devis.</Notice>}
      {missingPrices > 0 && <Notice tone="warn" title="Prix à renseigner">{missingPrices} ligne(s) n'ont pas de prix dans le catalogue de prototype : saisissez un prix unitaire.</Notice>}
      {message && <Notice tone="success" data-testid="bom-message">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <SectionCard
        actions={
          <>
            <Button data-testid="regenerate-bom" icon="autorenew" onClick={regenerate} variant="secondary">Régénérer depuis les calculs</Button>
            <Button data-testid="add-bom-line" icon="add" onClick={() => { setAdding({ ...EMPTY_LINE }); setError('') }} variant="secondary">Ajouter un composant</Button>
          </>
        }
        icon="list_alt"
        subtitle={`${items.length} ligne(s) • ${CATALOGUE.note}`}
        title={`Composants — armoire ${cabinet.reference}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" data-testid="bom-table">
            <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Référence', 'Désignation', 'Catégorie', 'Quantité', 'Prix unitaire', 'Total', 'Origine', 'Actions'].map((heading) => (
                  <th className="whitespace-nowrap px-space-md py-space-sm" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low font-body-sm">
              {items.map((item) => {
                const editing = editingUid === item._uid
                return (
                  <tr data-bom-line={item.autoKey ?? item.reference} key={item._uid}>
                    {editing ? (
                      <>
                        <LineFields line={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
                        <td className="px-space-md py-space-sm font-tech-data-md">{formatMoney(lineTotal(draft))}</td>
                        <td />
                        <td className="whitespace-nowrap px-space-md py-space-sm">
                          <Button className="mr-space-xs h-9 px-space-md" onClick={commitEdit}>OK</Button>
                          <Button className="h-9 px-space-md" onClick={() => setEditingUid(null)} variant="secondary">Annuler</Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md font-bold text-secondary">{item.reference}</td>
                        <td className="px-space-md py-space-sm">{item.designation}</td>
                        <td className="whitespace-nowrap px-space-md py-space-sm">{item.category}</td>
                        <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{formatNumber(item.quantity, item.quantity % 1 ? 2 : 0)} {item.unit}</td>
                        <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">
                          {isMissingPrice(item) ? <StatusPill tone="warn">Prix à renseigner</StatusPill> : formatMoney(Number(item.unitPrice))}
                        </td>
                        <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md font-bold" data-cell="total">{formatMoney(lineTotal(item))}</td>
                        <td className="px-space-md py-space-sm">
                          <StatusPill tone={item.source === 'auto' ? (item.edited ? 'info' : 'neutral') : 'ok'}>{item.source === 'auto' ? (item.edited ? 'Auto, retouché' : 'Auto') : 'Manuel'}</StatusPill>
                        </td>
                        <td className="whitespace-nowrap px-space-md py-space-sm">
                          <button className="rounded-lg px-space-sm py-space-xs font-semibold text-secondary hover:bg-surface-container-low" data-action="edit" onClick={() => startEdit(item)} type="button">Modifier</button>
                          <button aria-label={`Supprimer ${item.reference}`} className="rounded-lg px-space-sm py-space-xs font-semibold text-error hover:bg-error-container" data-action="delete" onClick={() => touch((current) => current.filter((line) => line._uid !== item._uid))} type="button">Supprimer</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              {adding && (
                <tr className="bg-surface-container-low/60" data-testid="bom-add-row">
                  <LineFields line={adding} onChange={(patch) => setAdding((current) => ({ ...current, ...patch }))} />
                  <td className="px-space-md py-space-sm font-tech-data-md">{formatMoney(lineTotal(adding))}</td>
                  <td />
                  <td className="whitespace-nowrap px-space-md py-space-sm">
                    <Button className="mr-space-xs h-9 px-space-md" data-testid="commit-add" onClick={commitAdd}>Ajouter</Button>
                    <Button className="h-9 px-space-md" onClick={() => setAdding(null)} variant="secondary">Annuler</Button>
                  </td>
                </tr>
              )}
              {items.length === 0 && !adding && (
                <tr><td className="px-space-md py-space-xl text-center text-on-surface-variant" colSpan={8}>Aucune ligne. Calculez les départs, ou ajoutez des composants manuellement.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-space-md border-t border-surface-container-low pt-space-md">
          <span className="font-body-md text-body-md text-on-surface-variant">Total nomenclature HT</span>
          <strong className="font-tech-data-xl text-tech-data-xl text-on-surface" data-testid="bom-total">{formatMoney(total)}</strong>
        </div>
      </SectionCard>
    </WorkflowStepPage>
  )
}

function BomPage() {
  const { projectId, cabinetId } = useParams()
  const base = `/projects/${projectId}/cabinets/${cabinetId}`
  const loader = useCallback(() => fetchBomData(projectId, cabinetId), [projectId, cabinetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'armoire" backTo={`${base}/feeders`} state={state}>
      {state.data && <BomEditor base={base} data={state.data} key={state.data.saved.map((item) => item.updatedAt).join('|') || 'new'} onSaved={state.reload} />}
    </LoadState>
  )
}

export default BomPage
