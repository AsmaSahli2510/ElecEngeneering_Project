import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyInputChange, buildDefaultInputs, calculateFeeder, mergeSavedInputs } from '../domain/calculation/index.js'
import { api } from '../lib/api.js'

// Les données propres au départ (puissance, unité, type de charge, longueur, tension) font foi : si le départ a été
// modifié après un calcul enregistré, le calcul repart des nouvelles valeurs (les autres saisies sont conservées).
function syncFeederFields(inputs, defaults) {
  const { power, powerUnit, loadType, cableLength } = defaults.load
  return {
    ...inputs,
    circuit: { ...inputs.circuit, nominalVoltage: defaults.circuit.nominalVoltage },
    load: { ...inputs.load, power, powerUnit, loadType, cableLength },
  }
}

// État complet de la page de calcul d'un départ :
//  - charge le départ, l'armoire, le projet et le calcul déjà enregistré (s'il existe) ;
//  - initialise les 7 formulaires depuis l'armoire et le départ (ou depuis le calcul enregistré) ;
//  - recalcule à chaque modification (calculateFeeder est une fonction pure) ;
//  - enregistre le calcul du départ.
export function useFeederCalculation(feederId) {
  const [loaded, setLoaded] = useState({ status: 'loading', feeder: null, cabinet: null, project: null, error: '' })
  const [inputs, setInputs] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const feeder = await api.feeders.get(feederId)
      const [cabinet, saved] = await Promise.all([api.cabinets.get(feeder.cabinetId), api.feeders.getCalculation(feederId)])
      const project = await api.projects.get(cabinet.projectId)
      const defaults = buildDefaultInputs({ cabinet, feeder })
      const savedInputs = saved ? mergeSavedInputs(defaults, saved.inputs) : null
      const initial = savedInputs ? syncFeederFields(savedInputs, defaults) : defaults
      return { feeder, cabinet, project, initial, savedInputs }
    }
    load()
      .then(({ feeder, cabinet, project, initial, savedInputs }) => {
        if (!active) return
        setInputs(initial)
        // L'instantané « enregistré » est pris AVANT la synchronisation avec le départ : un départ modifié depuis
        // son calcul apparaît donc comme non enregistré (à recalculer).
        setSavedSnapshot(savedInputs ? JSON.stringify(savedInputs) : null)
        setLoaded({ status: 'ready', feeder, cabinet, project, error: '' })
      })
      .catch((error) => {
        if (active) setLoaded({ status: 'error', feeder: null, cabinet: null, project: null, error: error.message })
      })
    return () => {
      active = false
    }
  }, [feederId])

  const outcome = useMemo(() => (inputs ? calculateFeeder(inputs) : null), [inputs])

  const setFields = useCallback((formKey, patch) => {
    setInputs((current) => applyInputChange(current, formKey, patch))
  }, [])

  const isSaved = savedSnapshot !== null && savedSnapshot === JSON.stringify(inputs)

  const save = useCallback(async () => {
    if (!outcome?.ready) return false
    setSaving(true)
    setSaveError('')
    try {
      await api.feeders.saveCalculation(feederId, { inputs: outcome.inputs, result: outcome.result })
      setSavedSnapshot(JSON.stringify(inputs))
      return true
    } catch (error) {
      setSaveError(error.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [feederId, inputs, outcome])

  return { ...loaded, inputs, outcome, setFields, save, saving, saveError, isSaved }
}
