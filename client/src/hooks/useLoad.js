import { useCallback, useEffect, useState } from 'react'

// Charge des données asynchrones : `loader` doit être stable (useCallback) ; l'appel est refait quand il change
// ou quand `reload()` est appelé. Un rechargement conserve les données affichées (pas de clignotement).
// -> { status: 'loading' | 'ready' | 'error', data, error, reload }
export function useLoad(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: '' })
      })
      .catch((error) => {
        if (active) setState({ status: 'error', data: null, error: error.message })
      })
    return () => {
      active = false
    }
  }, [loader, tick])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  return { ...state, reload }
}
