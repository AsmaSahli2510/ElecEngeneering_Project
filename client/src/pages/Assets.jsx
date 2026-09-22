import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import WarrantyBadge from '../components/assets/WarrantyBadge.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { formatDate } from '../domain/lifecycle/dates.js'
import { ASSET_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'

// Registre des actifs (armoires installées), créés automatiquement à la fin de chaque installation.
function Assets() {
  const loader = useCallback(() => api.assets.list(), [])
  const state = useLoad(loader)
  return (
    <LoadState state={state}>
      <div className="flex w-full flex-col gap-space-lg pb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Actifs</h1>
          <p className="font-body-md text-on-surface-variant">Armoires installées et suivies (garantie, maintenance, tickets).</p>
        </div>
        <SectionCard icon="inventory_2" subtitle={`${state.data?.length ?? 0} actif(s)`} title="Registre des actifs">
          {state.data?.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Aucun actif. Un actif est créé automatiquement quand l'installation d'une armoire passe à « Terminée ».</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm" data-testid="assets-table">
                <thead className="bg-surface-container text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <tr>{['Actif', 'N° de série', 'Projet', 'Client', 'Site', 'Armoire', 'Installation', 'Statut', 'Garantie', 'Tickets ouverts'].map((heading) => <th className="whitespace-nowrap px-space-md py-space-sm" key={heading}>{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {state.data?.map((asset) => (
                    <tr key={asset._id}>
                      <td className="px-space-md py-space-sm"><Link className="font-tech-data-md font-bold text-secondary hover:underline" to={`/assets/${asset.assetId}`}>{asset.assetId}</Link></td>
                      <td className="whitespace-nowrap px-space-md py-space-sm font-tech-data-md">{asset.serialNumber}</td>
                      <td className="px-space-md py-space-sm">{asset.project?.name}</td>
                      <td className="px-space-md py-space-sm">{asset.project?.client}</td>
                      <td className="px-space-md py-space-sm">{asset.project?.installationSite}</td>
                      <td className="px-space-md py-space-sm">{asset.cabinet?.reference}</td>
                      <td className="whitespace-nowrap px-space-md py-space-sm">{formatDate(asset.installationDate)}</td>
                      <td className="px-space-md py-space-sm"><StatusPill tone="ok">{ASSET_STATUS_LABELS[asset.status]}</StatusPill></td>
                      <td className="px-space-md py-space-sm"><WarrantyBadge prefix="" warranty={asset.warranty} /></td>
                      <td className="px-space-md py-space-sm font-tech-data-md">{asset.openTickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </LoadState>
  )
}

export default Assets
