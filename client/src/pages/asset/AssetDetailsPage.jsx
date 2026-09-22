import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import WarrantyBadge from '../../components/assets/WarrantyBadge.jsx'
import { LinkButton } from '../../components/ui/buttons.jsx'
import LoadState from '../../components/ui/LoadState.jsx'
import Metric from '../../components/ui/Metric.jsx'
import SectionCard from '../../components/ui/SectionCard.jsx'
import StatusPill from '../../components/ui/StatusPill.jsx'
import { formatDate } from '../../domain/lifecycle/dates.js'
import { ASSET_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import { useLoad } from '../../hooks/useLoad.js'
import { api } from '../../lib/api.js'

// Page ouverte en scannant le QR code d'un actif. Lecture seule : aucune donnée n'est créée ni modifiée ici.
function AssetDetailsPage() {
  const { assetId } = useParams()
  const loader = useCallback(() => api.assets.get(assetId), [assetId])
  const state = useLoad(loader)

  return (
    <LoadState backLabel="Liste des actifs" backTo="/assets" state={state}>
      {state.data && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-lg pb-8" data-testid="asset-details">
          <div>
            <div className="mb-space-xs flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              Détails de l'actif
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface" data-testid="d-id">{state.data.assetId}</h1>
            <p className="font-tech-data-md text-tech-data-md text-on-surface-variant" data-testid="d-serial">SN : {state.data.serialNumber}</p>
          </div>
          <SectionCard icon="inventory_2" title="Actif">
            <div className="grid grid-cols-2 gap-space-md">
              <Metric label="Armoire" testId="d-cabinet" value={state.data.cabinet.reference} />
              <Metric label="Client" testId="d-client" value={state.data.project.client} />
              <Metric label="Site" testId="d-site" value={state.data.project.installationSite} />
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <div className="font-tech-unit text-tech-unit text-on-surface-variant">Statut</div>
                <div className="mt-space-xs"><StatusPill data-testid="d-status" tone="ok">{ASSET_STATUS_LABELS[state.data.status]}</StatusPill></div>
              </div>
              <div className="rounded-lg bg-surface-container-low p-space-md">
                <div className="font-tech-unit text-tech-unit text-on-surface-variant">Garantie</div>
                <div className="mt-space-xs"><WarrantyBadge data-testid="d-warranty" prefix="" warranty={state.data.warranty} /></div>
              </div>
              <Metric label="Dernière maintenance" testId="d-last-maintenance" value={state.data.lastMaintenance ? formatDate(state.data.lastMaintenance) : 'Aucune'} />
              <Metric label="Tickets ouverts" testId="d-open-tickets" value={state.data.openTickets} />
            </div>
          </SectionCard>
          <div className="flex flex-wrap gap-space-sm print:hidden">
            <LinkButton icon="inventory_2" to={`/assets/${state.data.assetId}`} variant="secondary">Fiche complète de l'actif</LinkButton>
            <LinkButton icon="confirmation_number" to={`/assets/${state.data.assetId}/tickets`} variant="secondary">Tickets</LinkButton>
          </div>
        </div>
      )}
    </LoadState>
  )
}

export default AssetDetailsPage
