import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import WorkflowStepPage from '../components/projects/WorkflowStepPage.jsx'
import FormField, { formInputClass, formSelectClass } from '../components/ui/FormField.jsx'
import { NEUTRAL_SYSTEMS } from '../domain/calculation/constants.js'
import { useFlowContext } from '../hooks/useFlowContext.js'
import { api } from '../lib/api.js'

const NETWORK_SUGGESTIONS = ['400/230 V – 50 Hz', '230 V – 50 Hz', '690 V – 50 Hz']

const initialCabinet = {
  reference: 'AR-01',
  powerSupplyPoint: 'TGBT-01',
  distanceToTGBT: 25,
  network: '400/230 V – 50 Hz',
  neutralSystem: 'TN-S',
  description: 'Armoire de distribution atelier',
}

function CabinetStep() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { error: contextError } = useFlowContext(projectId)
  const [form, setForm] = useState(initialCabinet)
  const [existingId, setExistingId] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  // Le flux gère une armoire par projet : si elle existe déjà, on l'édite au lieu d'en créer une seconde.
  useEffect(() => {
    let active = true
    api.cabinets
      .list(projectId)
      .then(([cabinet]) => {
        if (!active) return
        if (cabinet) {
          setExistingId(cabinet._id)
          setForm({
            reference: cabinet.reference ?? '',
            powerSupplyPoint: cabinet.powerSupplyPoint ?? '',
            distanceToTGBT: cabinet.distanceToTGBT ?? '',
            network: cabinet.network ?? '',
            neutralSystem: cabinet.neutralSystem ?? 'TN-S',
            description: cabinet.description ?? '',
          })
        }
        setLoaded(true)
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message)
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [projectId])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const distance = Number(form.distanceToTGBT)
    if (!form.reference.trim()) return setError("La référence de l'armoire est requise.")
    if (!form.powerSupplyPoint.trim()) return setError("Le point d'alimentation est requis.")
    if (form.distanceToTGBT === '' || !Number.isFinite(distance) || distance < 0) {
      return setError('La distance armoire–TGBT doit être un nombre positif.')
    }
    if (!form.network.trim()) return setError('Le réseau est requis.')
    setSaving(true)
    try {
      const payload = { ...form, projectId, distanceToTGBT: distance }
      const cabinet = existingId ? await api.cabinets.update(existingId, payload) : await api.cabinets.create(payload)
      navigate(`/projects/${projectId}/cabinets/${cabinet._id}/feeders`)
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  return (
    <WorkflowStepPage
      cabinet={existingId ? { ...form, _id: existingId } : null}
      description="Configurez l'armoire liée au projet avant d'ajouter ses départs."
      eyebrow="Étape 02 • Configuration"
      icon="developer_board"
      current="cabinet"
      projectId={projectId}
      title="Configuration de l'armoire">
      <form
        className="space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:p-space-xl"
        onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[20px]">developer_board</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Configuration de l'armoire</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Les paramètres repris automatiquement dans le calcul de chaque départ
              </p>
            </div>
          </div>
          <span className="rounded bg-surface-container px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold text-secondary">
            Obligatoire
          </span>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
          <FormField className="md:col-span-6" label="Référence de l'armoire" required>
            <input className={`${formInputClass} font-tech-data-md font-bold`} onChange={update('reference')} value={form.reference} />
          </FormField>
          <FormField className="md:col-span-6" label="Point d'alimentation" required>
            <input className={formInputClass} onChange={update('powerSupplyPoint')} value={form.powerSupplyPoint} />
          </FormField>
          <FormField className="md:col-span-6" label="Distance armoire–TGBT" required>
            <div className="relative">
              <input
                className={`${formInputClass} pr-10 font-tech-data-md`}
                min="0"
                onChange={update('distanceToTGBT')}
                step="any"
                type="number"
                value={form.distanceToTGBT}
              />
              <span className="absolute right-space-md top-1/2 -translate-y-1/2 font-tech-unit text-tech-unit text-on-surface-variant">m</span>
            </div>
          </FormField>
          <FormField className="md:col-span-6" label="Réseau" required>
            <input className={formInputClass} list="network-suggestions" onChange={update('network')} value={form.network} />
            <datalist id="network-suggestions">
              {NETWORK_SUGGESTIONS.map((network) => (
                <option key={network} value={network} />
              ))}
            </datalist>
          </FormField>
          <FormField className="md:col-span-6" label="Régime de neutre" required>
            <select className={formSelectClass} onChange={update('neutralSystem')} value={form.neutralSystem}>
              {NEUTRAL_SYSTEMS.map((system) => (
                <option key={system}>{system}</option>
              ))}
            </select>
          </FormField>
          <FormField className="md:col-span-12" label="Description">
            <textarea className={`${formInputClass} h-auto py-space-md`} onChange={update('description')} rows="4" value={form.description} />
          </FormField>
        </div>
        {(error || contextError) && (
          <p className="rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container" role="alert">
            {error || contextError}
          </p>
        )}
        <div className="flex justify-end border-t border-surface-container-low pt-space-md">
          <button
            className="flex h-10 items-center gap-space-xs rounded-lg bg-secondary px-space-lg font-headline-sm text-headline-sm font-bold text-on-secondary hover:bg-secondary-container disabled:opacity-60"
            disabled={saving || !loaded}
            type="submit">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            {saving ? 'Enregistrement...' : existingId ? "Mettre à jour et voir les départs" : 'Valider et ajouter les départs'}
          </button>
        </div>
      </form>
    </WorkflowStepPage>
  )
}

export default CabinetStep
