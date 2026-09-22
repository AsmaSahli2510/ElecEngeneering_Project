import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AssetQr from '../../components/assets/AssetQr.jsx'
import WarrantyBadge from '../../components/assets/WarrantyBadge.jsx'
import WorkflowStepPage from '../../components/projects/WorkflowStepPage.jsx'
import { Button, LinkButton } from '../../components/ui/buttons.jsx'
import FormField, { formInputClass } from '../../components/ui/FormField.jsx'
import LoadState from '../../components/ui/LoadState.jsx'
import Metric from '../../components/ui/Metric.jsx'
import Notice from '../../components/ui/Notice.jsx'
import SectionCard from '../../components/ui/SectionCard.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { dueState, formatDate, isoDay, warrantyStatus } from '../../domain/lifecycle/dates.js'
import { ASSET_STATUS_LABELS, WARRANTY_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import { useLoad } from '../../hooks/useLoad.js'
import { api } from '../../lib/api.js'
import { assetDetailsUrl } from '../../lib/assetUrl.js'

function Row({ label, value, testId }) {
  return (
    <div className="flex items-start justify-between gap-space-md border-b border-surface-container-low py-space-xs font-body-sm text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <strong className="text-right text-on-surface" data-testid={testId}>{value || '—'}</strong>
    </div>
  )
}

function WarrantySection({ asset, onSaved }) {
  const [partsEnd, setPartsEnd] = useState(isoDay(asset.warranty.partsEnd))
  const [laborEnd, setLaborEnd] = useState(isoDay(asset.warranty.laborEnd))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const start = isoDay(asset.warranty.start)
  const changed = partsEnd !== isoDay(asset.warranty.partsEnd) || laborEnd !== isoDay(asset.warranty.laborEnd)
  const draft = warrantyStatus({ start, partsEnd, laborEnd })
  const invalid = partsEnd < start || laborEnd < start

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.assets.update(asset.assetId, { warranty: { partsEnd, laborEnd } })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      badge={<WarrantyBadge data-testid="warranty-status" warranty={{ start, partsEnd, laborEnd }} />}
      icon="verified_user"
      id="garantie"
      subtitle="Le début de garantie suit automatiquement la date d'installation ; les fins sont pré-remplies et modifiables."
      title="Garantie">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3" data-testid="warranty-form">
        <FormField hint="Date d'installation (non modifiable)" label="Début de garantie">
          <input className={formInputClass} data-testid="warranty-start" readOnly value={start} type="date" />
        </FormField>
        <FormField hint={`Pièces : ${WARRANTY_STATUS_LABELS[draft.parts]}`} label="Fin de garantie des pièces">
          <input className={formInputClass} data-testid="warranty-parts" min={start} onChange={(e) => setPartsEnd(e.target.value)} type="date" value={partsEnd} />
        </FormField>
        <FormField hint={`Main-d'œuvre : ${WARRANTY_STATUS_LABELS[draft.labor]}`} label="Fin de garantie main-d'œuvre">
          <input className={formInputClass} data-testid="warranty-labor" min={start} onChange={(e) => setLaborEnd(e.target.value)} type="date" value={laborEnd} />
        </FormField>
      </div>
      {invalid && <Notice tone="error">Les fins de garantie ne peuvent pas précéder le début de garantie.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {changed && (
        <div className="flex justify-end">
          <Button data-testid="save-warranty" disabled={invalid || saving} icon="save" onClick={save}>Enregistrer la garantie</Button>
        </div>
      )}
    </SectionCard>
  )
}

function AssetView({ asset, reload }) {
  const location = useLocation()
  const { project, cabinet } = asset
  const base = `/projects/${project._id}/cabinets/${cabinet._id}`
  const qrValue = assetDetailsUrl(asset.assetId)
  const next = asset.nextMaintenance ? dueState(asset.nextMaintenance) : null

  // Ancres du stepper (#garantie, #qr) : défilement vers la section correspondante.
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  return (
    <WorkflowStepPage
      actions={<StatusPill data-testid="asset-status" tone="ok">{ASSET_STATUS_LABELS[asset.status]}</StatusPill>}
      cabinet={cabinet}
      current="asset"
      description="Créé automatiquement à la fin de l'installation : il réutilise toutes les données du projet sans nouvelle saisie."
      eyebrow="Étape 10 • Actif"
      icon="inventory_2"
      projectId={project._id}
      title={`Actif ${asset.assetId}`}>
      <SectionCard icon="inventory_2" subtitle="Identité de l'actif et informations reprises du projet" title="Identification">
        <div className="grid grid-cols-1 gap-x-space-xl md:grid-cols-2" data-testid="asset-identity">
          <div>
            <Row label="Identifiant de l'actif" testId="a-id" value={asset.assetId} />
            <Row label="Numéro de série" testId="a-serial" value={`SN : ${asset.serialNumber}`} />
            <Row label="Projet" testId="a-project" value={project.name} />
            <Row label="Client" testId="a-client" value={project.client} />
          </div>
          <div>
            <Row label="Site" testId="a-site" value={project.installationSite} />
            <Row label="Armoire" testId="a-cabinet" value={cabinet.reference} />
            <Row label="Date d'installation" testId="a-date" value={formatDate(asset.installationDate)} />
            <Row label="Statut" testId="a-status" value={ASSET_STATUS_LABELS[asset.status]} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon="link" subtitle="Ces données restent dans leurs modules : l'actif y est simplement lié." title="Données liées à l'actif">
        <div className="flex flex-wrap gap-space-sm">
          {[
            ['Départs et calculs', 'feeders', 'account_tree'],
            ['Bilan de puissance', 'balance', 'analytics'],
            ['Départ général', 'main-feeder', 'electrical_services'],
            ['Nomenclature', 'bom', 'list_alt'],
            ['Devis', 'quotation', 'request_quote'],
            ['Installation', 'installation', 'construction'],
          ].map(([label, path, icon]) => (
            <LinkButton icon={icon} key={path} to={`${base}/${path}`} variant="secondary">{label}</LinkButton>
          ))}
          <LinkButton icon="history" to={`/projects/${project._id}/history`} variant="secondary">Historique</LinkButton>
        </div>
      </SectionCard>

      <WarrantySection asset={asset} key={`${asset.warranty.partsEnd}-${asset.warranty.laborEnd}`} onSaved={reload} />

      <SectionCard icon="qr_code_2" id="qr" subtitle="Le QR code contient l'identifiant de l'actif ; le scanner ouvre la page Détails sans créer de donnée." title="QR Code">
        <div className="flex flex-wrap items-center gap-space-xl" data-testid="qr-section">
          <AssetQr value={qrValue} />
          <div className="space-y-space-sm">
            <div className="font-tech-data-lg text-tech-data-lg font-bold text-on-surface" data-testid="qr-id">{asset.assetId}</div>
            <div className="max-w-md break-all font-tech-unit text-tech-unit text-on-surface-variant" data-testid="qr-payload">{qrValue}</div>
            <div className="flex flex-wrap gap-space-sm">
              <LinkButton data-testid="open-details" icon="open_in_new" to={`/assets/${asset.assetId}/details`}>Ouvrir la page Détails</LinkButton>
              <Button icon="print" onClick={() => window.print()} variant="secondary">Imprimer l'étiquette</Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        <SectionCard icon="build" title="Maintenance préventive">
          <Metric detail={next ? (next.state === 'overdue' ? `En retard de ${-next.days} j` : `Dans ${next.days} jour(s)`) : 'Aucun plan défini'} label="Prochaine maintenance" testId="a-next-maintenance" value={asset.nextMaintenance ? formatDate(asset.nextMaintenance) : '—'} />
          <Metric label="Dernière maintenance" value={asset.lastMaintenance ? formatDate(asset.lastMaintenance) : '—'} />
          <LinkButton icon="build" to={`/assets/${asset.assetId}/maintenance`}>Gérer la maintenance</LinkButton>
        </SectionCard>
        <SectionCard icon="confirmation_number" title="Tickets">
          <Metric detail={`${asset.ticketsTotal} ticket(s) au total`} label="Tickets ouverts" testId="a-open-tickets" value={asset.openTickets} />
          <LinkButton icon="confirmation_number" to={`/assets/${asset.assetId}/tickets`}>Gérer les tickets</LinkButton>
        </SectionCard>
      </div>
    </WorkflowStepPage>
  )
}

function AssetPage() {
  const { assetId } = useParams()
  const loader = useCallback(() => api.assets.get(assetId), [assetId])
  const state = useLoad(loader)
  return (
    <LoadState backLabel="Liste des actifs" backTo="/assets" state={state}>
      {state.data && <AssetView asset={state.data} reload={state.reload} />}
    </LoadState>
  )
}

export default AssetPage
