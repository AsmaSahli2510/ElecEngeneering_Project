import { useCallback } from 'react'
import { computeWorkflow, STEP_STATUS } from '../domain/lifecycle/workflow.js'
import { formatDate } from '../domain/lifecycle/dates.js'
import { PROJECT_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { api } from '../lib/api.js'
import { useLoad } from './useLoad.js'

// Liste des projets enregistrés, enrichie avec la progression réelle de leur cycle de vie.
// `GET /projects/summary` renvoie en un seul appel la même agrégation que `GET /projects/:id/overview`
// pour tous les projets (au lieu d'un appel par projet) ; `computeWorkflow` reste la même logique métier
// que sur la page de détail d'un projet.
export function useProjectsWithProgress() {
  const loader = useCallback(async () => {
    const summaries = await api.projects.summary()
    return summaries.map((overview) => {
      const workflow = overview.cabinet ? computeWorkflow(overview) : null
      const flow = workflow?.steps.filter((step) => step.key !== 'history') ?? []
      const stepsDone = flow.filter((step) => step.status === STEP_STATUS.DONE).length
      const stepsTotal = flow.length
      const { project, cabinet } = overview
      return {
        ...project,
        statusLabel: PROJECT_STATUS_LABELS[project.status] ?? project.status,
        site: project.installationSite,
        createdLabel: formatDate(project.creationDate ?? project.createdAt),
        updatedLabel: formatDate(project.updatedAt),
        cabinet,
        cabinetRef: cabinet?.reference ?? null,
        network: cabinet?.network ?? null,
        currentStep: workflow?.next ?? null,
        stepsDone,
        stepsTotal,
        phase: workflow?.next ? workflow.next.label : cabinet ? 'Cycle terminé' : 'Non démarré',
        stage: stepsTotal ? `Étape ${stepsDone}/${stepsTotal}` : '—',
        normativeProgress: stepsTotal ? Math.round((stepsDone / stepsTotal) * 100) : 0,
      }
    })
  }, [])
  const { status, data, error, reload } = useLoad(loader)
  return { status, projects: data ?? [], error, reload }
}
