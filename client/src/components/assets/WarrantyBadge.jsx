import { warrantyStatus } from '../../domain/lifecycle/dates.js'
import { WARRANTY_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import StatusPill from '../ui/StatusPill.jsx'

const TONE = { active: 'ok', expired: 'error', upcoming: 'info', unknown: 'neutral' }

// Statut de garantie calculé à partir des dates enregistrées (jamais de date en dur).
function WarrantyBadge({ warranty, prefix = 'Garantie : ', ...rest }) {
  const { status } = warrantyStatus(warranty)
  return (
    <StatusPill icon={status === 'active' ? 'verified_user' : status === 'expired' ? 'gpp_bad' : 'schedule'} tone={TONE[status]} {...rest}>
      {prefix}{WARRANTY_STATUS_LABELS[status]}
    </StatusPill>
  )
}

export default WarrantyBadge
