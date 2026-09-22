import { useCallback, useMemo } from 'react'
import { computeWorkflow } from '../domain/lifecycle/workflow.js'
import { api } from '../lib/api.js'
import { useLoad } from './useLoad.js'

// Vue agrégée du projet + progression du workflow (statut de chacune des étapes du cycle).
// `refreshKey` : changer sa valeur force un rechargement (ex. après l'ajout d'un départ).
export function useProjectOverview(projectId, refreshKey = 0) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loader = useCallback(() => (projectId ? api.projects.overview(projectId) : Promise.resolve(null)), [projectId, refreshKey])
  const { status, data, error, reload } = useLoad(loader)
  const workflow = useMemo(() => (data?.project ? computeWorkflow(data) : null), [data])
  return { status, overview: data, workflow, error, reload }
}
