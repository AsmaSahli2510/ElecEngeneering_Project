import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROJECT_STATUS_LABELS } from '../../domain/lifecycle/labels.js'
import { useProjectsWithProgress } from '../../hooks/useProjectsWithProgress.js'

const statusStyles = {
  draft: 'bg-surface-container text-on-surface-variant',
  active: 'bg-surface-variant text-on-surface',
  completed: 'bg-surface-container-high text-on-surface',
  archived: 'bg-surface-variant text-on-surface',
}

const RECENT_COUNT = 5

function RecentProjects() {
  const navigate = useNavigate()
  const { status, projects, error } = useProjectsWithProgress()
  const [filter, setFilter] = useState('')

  const filtered = filter ? projects.filter((project) => project.status === filter) : projects
  const recent = filtered.slice(0, RECENT_COUNT)

  return (
    <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col justify-between gap-space-md bg-surface-container-low p-space-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[20px] text-secondary">folder_special</span>
          <h2 className="font-headline-sm text-headline-sm tracking-tight text-on-surface">Recent Projects</h2>
          <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-semibold text-on-surface-variant">{recent.length} of {projects.length}</span>
        </div>
        <div className="flex items-center gap-space-xs overflow-x-auto">
          <button className={`whitespace-nowrap rounded-lg px-space-sm py-space-2xs font-tech-unit text-tech-unit ${!filter ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} onClick={() => setFilter('')} type="button">All</button>
          {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
            <button className={`whitespace-nowrap rounded-lg px-space-sm py-space-2xs font-tech-unit text-tech-unit ${filter === key ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`} key={key} onClick={() => setFilter(key)} type="button">{label}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="px-space-md py-space-sm">Ref / Project Name</th>
              <th className="px-space-md py-space-sm">Client / Site</th>
              <th className="px-space-md py-space-sm">Main Node</th>
              <th className="px-space-md py-space-sm">Progress</th>
              <th className="px-space-md py-space-sm">Status</th>
              <th className="px-space-md py-space-sm text-right">Updated</th>
              <th className="px-space-md py-space-sm text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
            {status === 'loading' && (
              <tr><td className="px-space-md py-space-lg text-on-surface-variant" colSpan={7}>Chargement…</td></tr>
            )}
            {status === 'error' && (
              <tr><td className="px-space-md py-space-lg text-error" colSpan={7}>API indisponible : {error}</td></tr>
            )}
            {status === 'ready' && recent.length === 0 && (
              <tr><td className="px-space-md py-space-lg text-on-surface-variant" colSpan={7}>Aucun projet.</td></tr>
            )}
            {status === 'ready' && recent.map((project) => (
              <tr className="transition-colors hover:bg-surface-container-low/60" key={project._id}>
                <td className="px-space-md py-space-md">
                  <div className="flex max-w-[210px] flex-col">
                    <span className="font-tech-data-md text-tech-data-md font-semibold text-secondary">{project.reference}</span>
                    <span className="truncate font-body-md text-body-md font-semibold">{project.name}</span>
                  </div>
                </td>
                <td className="px-space-md py-space-md">
                  <div className="flex flex-col">
                    <span className="font-medium">{project.client}</span>
                    <span className="flex items-center gap-space-2xs text-on-surface-variant"><span className="material-symbols-outlined text-[13px]">location_on</span>{project.site}</span>
                  </div>
                </td>
                <td className="px-space-md py-space-md">
                  <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold">{project.cabinetRef ?? '—'}</span>
                </td>
                <td className="min-w-[120px] px-space-md py-space-md">
                  <div className="flex items-center gap-space-xs">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${project.normativeProgress}%` }} />
                    </div>
                    <span className="font-tech-unit text-tech-unit font-semibold">{project.normativeProgress}%</span>
                  </div>
                </td>
                <td className="px-space-md py-space-md">
                  <span className={`inline-flex items-center gap-space-2xs rounded px-space-xs py-space-2xs font-tech-unit text-tech-unit font-semibold ${statusStyles[project.status]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'draft' ? 'bg-outline' : 'bg-secondary'}`} />
                    {project.statusLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-space-md py-space-md text-right font-tech-unit text-tech-unit text-on-surface-variant">{project.updatedLabel}</td>
                <td className="px-space-md py-space-md">
                  <div className="flex items-center justify-center gap-space-xs">
                    <button className="rounded p-space-xs text-secondary hover:bg-surface-container" onClick={() => navigate(`/projects/${project._id}`)} title="Open project" type="button">
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">
        <span>Showing <strong className="font-tech-unit text-tech-unit text-on-surface">{recent.length}</strong> of {filtered.length} projects</span>
        <button className="rounded bg-surface-container px-space-sm py-space-2xs font-tech-unit text-tech-unit hover:bg-surface-container-high" onClick={() => navigate('/projects')} type="button">View all</button>
      </div>
    </section>
  )
}

export default RecentProjects
