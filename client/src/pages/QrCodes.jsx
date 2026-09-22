import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import AssetQr from '../components/assets/AssetQr.jsx'
import { Button } from '../components/ui/buttons.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import { useLoad } from '../hooks/useLoad.js'
import { api } from '../lib/api.js'
import { assetDetailsUrl } from '../lib/assetUrl.js'

// Planche de QR codes des actifs. Chaque QR encode l'identifiant de l'actif et ouvre la page Détails (lecture seule).
function QrCodes() {
  const loader = useCallback(() => api.assets.list(), [])
  const state = useLoad(loader)
  return (
    <LoadState state={state}>
      <div className="flex w-full flex-col gap-space-lg pb-8">
        <div className="flex flex-wrap items-end justify-between gap-space-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">QR Codes</h1>
            <p className="font-body-md text-on-surface-variant">Un QR code unique par actif. Le scanner n'écrit aucune donnée.</p>
          </div>
          <Button icon="print" onClick={() => window.print()} variant="secondary">Imprimer les étiquettes</Button>
        </div>
        {state.data?.length === 0 && <p className="font-body-sm text-on-surface-variant">Aucun actif : les QR codes sont générés à la création des actifs.</p>}
        <div className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 xl:grid-cols-4" data-testid="qr-grid">
          {state.data?.map((asset) => (
            <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-sm" key={asset._id}>
              <AssetQr size={160} value={assetDetailsUrl(asset.assetId)} />
              <Link className="font-tech-data-md text-tech-data-md font-bold text-secondary hover:underline" to={`/assets/${asset.assetId}/details`}>{asset.assetId}</Link>
              <div className="font-body-sm text-on-surface-variant">{asset.cabinet?.reference} — {asset.project?.client}</div>
            </div>
          ))}
        </div>
      </div>
    </LoadState>
  )
}

export default QrCodes
