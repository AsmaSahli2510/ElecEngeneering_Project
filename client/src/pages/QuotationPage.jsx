import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import { Button } from '../components/ui/buttons.jsx'
import { NumberField } from '../components/ui/fields.jsx'
import FormField, { formInputClass } from '../components/ui/FormField.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Notice from '../components/ui/Notice.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import NextStepBar from '../components/workflow/NextStepBar.jsx'
import { addDays, formatDate, isoDay, todayIso } from '../domain/lifecycle/dates.js'
import { computeQuotationTotals, formatMoney, linesFromBom, QUOTATION_DEFAULTS, validateQuotation } from '../domain/quotation/index.js'
import { CATALOGUE } from '../domain/bom/catalogue.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'
import { formatNumber } from '../lib/format.js'

async function fetchQuotationData(projectId, cabinetId) {
  const [project, cabinet, bom, saved] = await Promise.all([
    api.projects.get(projectId),
    api.cabinets.get(cabinetId),
    api.cabinets.getBom(cabinetId),
    api.cabinets.getQuotation(cabinetId),
  ])
  const nextReference = saved ? null : (await api.quotations.nextReference()).reference
  return { project, cabinet, bom, saved, nextReference }
}

const time = (value) => (value ? new Date(value).getTime() : 0)

function QuotationEditor({ data, base, onSaved }) {
  const { project, cabinet, bom, saved, nextReference } = data
  const [editing, setEditing] = useState(!saved)
  const [form, setForm] = useState(() => ({
    reference: saved?.reference ?? nextReference,
    date: saved ? isoDay(saved.date) : todayIso(),
    validityDays: saved?.validityDays ?? QUOTATION_DEFAULTS.validityDays,
    discountPercent: saved?.discountPercent ?? QUOTATION_DEFAULTS.discountPercent,
    vatPercent: saved?.vatPercent ?? QUOTATION_DEFAULTS.vatPercent,
  }))
  const [lines, setLines] = useState(() => (saved ? saved.lines : linesFromBom(bom)))
  const [dirty, setDirty] = useState(!saved)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const change = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const errors = validateQuotation(form)
  const valid = Object.keys(errors).length === 0 && lines.length > 0
  const totals = useMemo(() => computeQuotationTotals(lines, Number(form.discountPercent) || 0, Number(form.vatPercent) || 0), [lines, form.discountPercent, form.vatPercent])
  const validUntil = form.date && Number(form.validityDays) >= 0 ? addDays(form.date, Number(form.validityDays)) : null
  const stale = Boolean(saved) && bom.length > 0 && Math.max(...bom.map((item) => time(item.updatedAt))) > time(saved.updatedAt)
  const generated = saved?.status === 'generated' && !dirty

  async function persist(status) {
    setSaving(true)
    setError('')
    try {
      await api.cabinets.saveQuotation(cabinet._id, { ...form, date: form.date, currency: QUOTATION_DEFAULTS.currency, lines, status })
      setDirty(false)
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const summary = (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2" data-testid="quote-summary">
      <div className="space-y-space-2xs font-body-md">
        <div>Client : <strong data-testid="q-client">{project.client}</strong></div>
        <div>Projet : <strong>{project.name}</strong> <span className="text-on-surface-variant">({project.reference})</span></div>
        <div>Devis : <strong data-testid="q-reference">{form.reference}</strong></div>
      </div>
      <div className="space-y-space-2xs text-right font-tech-data-md">
        <div>Total HT : <strong data-testid="q-total-ht">{formatMoney(totals.totalHT)}</strong></div>
        <div>TVA ({formatNumber(Number(form.vatPercent) || 0, 0)} %) : <strong data-testid="q-vat">{formatMoney(totals.vatAmount)}</strong></div>
        <div className="font-tech-data-lg text-tech-data-lg">Total TTC : <strong data-testid="q-total-ttc">{formatMoney(totals.totalTTC)}</strong></div>
      </div>
    </div>
  )

  return (
    <WorkflowStepPage
      current="quotation"
      description="Client, projet, composants, quantités et prix sont repris automatiquement de la nomenclature."
      eyebrow="Étape 08 • Devis"
      footer={
        <NextStepBar
          disabled={!saved || dirty}
          hint={saved && !dirty ? 'Devis enregistré : vous pouvez planifier l\'installation.' : 'Enregistrez le devis pour passer à l\'installation.'}
          label="Passer à l'installation"
          to={`${base}/installation`}
        />
      }
      icon="request_quote"
      layout="wide"
      projectId={project._id}
      title="Devis">
      {bom.length === 0 && (
        <Notice actions={<Link className="font-bold underline" to={`${base}/bom`}>Nomenclature</Link>} tone="warn" title="Nomenclature vide">
          Enregistrez d'abord la nomenclature : le devis en reprend les lignes.
        </Notice>
      )}
      {stale && (
        <Notice
          actions={<Button onClick={() => { setLines(linesFromBom(bom)); setEditing(true); setDirty(true) }} variant="secondary">Mettre à jour les lignes</Button>}
          tone="warn"
          title="Nomenclature modifiée">
          La nomenclature a changé depuis l'enregistrement du devis.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="print:hidden">
        <SectionCard
          actions={saved && !editing ? <Button data-testid="edit-quote" icon="edit" onClick={() => setEditing(true)} variant="secondary">Modifier</Button> : null}
          badge={saved && <StatusPill data-testid="quote-status" tone={generated ? 'ok' : 'info'}>{generated ? 'Devis généré' : saved.status === 'generated' ? 'Modifié (à régénérer)' : 'Enregistré'}</StatusPill>}
          icon="request_quote"
          subtitle={`Référence proposée automatiquement, modifiable • ${CATALOGUE.note}`}
          title="Informations du devis">
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-12" data-testid="quote-form">
            <FormField className="md:col-span-3" error={errors.reference} label="Référence du devis">
              <input className={`${formInputClass} font-tech-data-md font-bold`} disabled={!editing} onChange={(e) => change({ reference: e.target.value })} value={form.reference} />
            </FormField>
            <FormField className="md:col-span-3" error={errors.date} label="Date">
              <input className={formInputClass} disabled={!editing} onChange={(e) => change({ date: e.target.value })} type="date" value={form.date} />
            </FormField>
            <NumberField className="md:col-span-2" error={errors.validityDays} hint={validUntil ? `Valable jusqu'au ${formatDate(validUntil)}` : undefined} label="Validité" min="0" onChange={(value) => change({ validityDays: value })} readOnly={!editing} step="1" unit="jours" value={form.validityDays} />
            <NumberField className="md:col-span-2" error={errors.discountPercent} label="Remise" max="100" min="0" onChange={(value) => change({ discountPercent: value })} readOnly={!editing} unit="%" value={form.discountPercent} />
            <NumberField className="md:col-span-2" error={errors.vatPercent} label="TVA" max="100" min="0" onChange={(value) => change({ vatPercent: value })} readOnly={!editing} unit="%" value={form.vatPercent} />
          </div>
          {summary}
          <div className="flex flex-wrap justify-end gap-space-sm border-t border-surface-container-low pt-space-md">
            <Button data-testid="save-quote" disabled={!valid || saving || (!!saved && !dirty)} icon="save" onClick={() => persist('saved')} variant="secondary">
              Enregistrer le devis
            </Button>
            <Button data-testid="generate-quote" disabled={!valid || saving || generated} icon="description" onClick={() => persist('generated')}>
              Générer le devis
            </Button>
            <Button data-testid="print-quote" disabled={!saved || dirty} icon="print" onClick={() => window.print()} variant="secondary">
              Télécharger / imprimer
            </Button>
          </div>
        </SectionCard>
      </div>

      <section className="rounded-xl bg-white p-space-xl text-black shadow-sm print:rounded-none print:p-0 print:shadow-none" data-testid="quote-document" id="quote-document">
        <header className="flex flex-wrap items-start justify-between gap-space-md border-b border-black/20 pb-space-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight">DEVIS {form.reference}</h2>
            <p className="font-body-sm text-body-sm">Date : {formatDate(form.date)}{validUntil && <> — Valable jusqu'au {formatDate(validUntil)}</>}</p>
          </div>
          <div className="text-right font-body-sm text-body-sm">
            <div className="font-bold">{project.client}</div>
            <div>{project.installationSite}</div>
            {project.siteAddress && <div>{project.siteAddress}</div>}
          </div>
        </header>
        <p className="py-space-md font-body-md text-body-md">
          Projet : <strong>{project.name}</strong> ({project.reference}) — Armoire {cabinet.reference}
        </p>
        <table className="w-full text-left font-body-sm text-body-sm" data-testid="quote-table">
          <thead>
            <tr className="border-b border-black/30">
              <th className="py-space-xs">Désignation</th>
              <th className="py-space-xs text-right">Quantité</th>
              <th className="py-space-xs text-right">Prix unitaire</th>
              <th className="py-space-xs text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {totals.lines.map((line, index) => (
              <tr className="border-b border-black/10" key={`${line.reference}-${index}`}>
                <td className="py-space-xs">{line.designation}</td>
                <td className="py-space-xs text-right font-tech-data-md">{formatNumber(line.quantity, line.quantity % 1 ? 2 : 0)} {line.unit}</td>
                <td className="py-space-xs text-right font-tech-data-md">{formatMoney(line.unitPrice)}</td>
                <td className="py-space-xs text-right font-tech-data-md">{formatMoney(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-space-lg w-full max-w-sm space-y-space-2xs font-tech-data-md">
          <div className="flex justify-between"><dt>Sous-total HT</dt><dd data-testid="doc-subtotal">{formatMoney(totals.subtotalHT)}</dd></div>
          <div className="flex justify-between"><dt>Remise ({formatNumber(Number(form.discountPercent) || 0, 0)} %)</dt><dd data-testid="doc-discount">− {formatMoney(totals.discountAmount)}</dd></div>
          <div className="flex justify-between"><dt>Total HT</dt><dd data-testid="doc-total-ht">{formatMoney(totals.totalHT)}</dd></div>
          <div className="flex justify-between"><dt>TVA ({formatNumber(Number(form.vatPercent) || 0, 0)} %)</dt><dd data-testid="doc-vat">{formatMoney(totals.vatAmount)}</dd></div>
          <div className="flex justify-between border-t border-black/30 pt-space-xs text-tech-data-lg font-bold"><dt>Total TTC</dt><dd data-testid="doc-total-ttc">{formatMoney(totals.totalTTC)}</dd></div>
        </dl>
        <p className="mt-space-lg font-tech-unit text-tech-unit text-black/60">{CATALOGUE.note}</p>
      </section>
    </WorkflowStepPage>
  )
}

function QuotationPage() {
  const { projectId, cabinetId } = useParams()
  const base = `/projects/${projectId}/cabinets/${cabinetId}`
  const loader = useCallback(() => fetchQuotationData(projectId, cabinetId), [projectId, cabinetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Retour à l'armoire" backTo={`${base}/feeders`} state={state}>
      {state.data && <QuotationEditor base={base} data={state.data} key={state.data.saved?.updatedAt ?? 'new'} onSaved={state.reload} />}
    </LoadState>
  )
}

export default QuotationPage
