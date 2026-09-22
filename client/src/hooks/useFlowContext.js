import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

// Charge le projet et l'armoire courants du flux (identifiants issus de l'URL).
export function useFlowContext(projectId, cabinetId) {
  const [state, setState] = useState({ project: null, cabinet: null, error: '' })

  useEffect(() => {
    let active = true
    Promise.all([projectId ? api.projects.get(projectId) : null, cabinetId ? api.cabinets.get(cabinetId) : null])
      .then(([project, cabinet]) => {
        if (active) setState({ project, cabinet, error: '' })
      })
      .catch((error) => {
        if (active) setState({ project: null, cabinet: null, error: error.message })
      })
    return () => {
      active = false
    }
  }, [projectId, cabinetId])

  return state
}
