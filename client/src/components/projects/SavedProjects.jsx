import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLoad } from '../../hooks/useLoad.js'
import { api } from '../../lib/api.js'
import { PROJECT_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import SectionCard from '../ui/SectionCard.jsx'
import StatusPill from '../ui/StatusPill.jsx'

// Projets réellement enregistrés : point d'entrée vers la vue globale et le cycle de vie de chaque projet.
function SavedProjects({ title = 'Projets enregistrés' }) {
  const loader = useCallback(() => api.projects.list(), [])
  const { status, data, error } = useLoad(loader)

  return (
    <SectionCard className="mb-space-lg" icon="folder_open" subtitle="Ouvrez un projet pour suivre tout son cycle : calculs, bilan, devis, installation, actif, maintenance…" title={title}>
      {status === 'loading' && <p className="font-body-sm text-on-surface-variant">Chargement…</p>}
      {status === 'error' && <p className="font-body-sm text-error">API indisponible : {error}</p>}
      {status === 'ready' && data.length === 0 && <p className="font-body-sm text-on-surface-variant">Aucun projet enregistré. Créez-en un avec « Nouveau projet ».</p>}
      {status === 'ready' && data.length > 0 && (
        <ul className="divide-y divide-surface-container-low" data-testid="saved-projects">
          {data.map((project) => (
            <li className="flex flex-wrap items-center justify-between gap-space-md py-space-sm" key={project._id}>
              <div>
                <Link className="font-body-md font-semibold text-secondary hover:underline" data-project-link={project.reference} to={`/projects/${project._id}`}>{project.name}</Link>
                <div className="font-tech-unit text-tech-unit text-on-surface-variant">{project.reference} • {project.client} • {project.installationSite}</div>
              </div>
              <StatusPill tone="info">{PROJECT_STATUS_LABELS[project.status]}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default SavedProjects
