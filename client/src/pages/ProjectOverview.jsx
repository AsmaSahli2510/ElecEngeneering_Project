import { Link, useParams } from 'react-router-dom'
import { LinkButton } from '../components/ui/buttons.jsx'
import LoadState from '../components/ui/LoadState.jsx'
import Metric from '../components/ui/Metric.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { STEP_STATUS } from '../domain/lifecycle/workflow.js'
import { formatDate } from '../domain/lifecycle/dates.js'
import { PROJECT_STATUS_LABELS } from '../domain/lifecycle/labels.js'
import { formatMoney } from '../domain/quotation/index.js'
import { useProjectOverview } from '../hooks/useProjectOverview.js'

const STATUS_TEXT = { [STEP_STATUS.DONE]: 'Terminé', [STEP_STATUS.IN_PROGRESS]: 'En cours', [STEP_STATUS.NOT_STARTED]: 'Non commencé', [STEP_STATUS.BLOCKED]: 'Bloqué' }
const STATUS_ICON = { [STEP_STATUS.DONE]: 'check', [STEP_STATUS.IN_PROGRESS]: 'more_horiz', [STEP_STATUS.NOT_STARTED]: 'circle', [STEP_STATUS.BLOCKED]: 'lock' }
const NODE_TONE = {
  [STEP_STATUS.DONE]: 'bg-secondary text-on-secondary',
  [STEP_STATUS.IN_PROGRESS]: 'bg-surface-container-highest text-secondary ring-2 ring-secondary',
  [STEP_STATUS.NOT_STARTED]: 'bg-surface-container text-on-surface-variant',
  [STEP_STATUS.BLOCKED]: 'bg-surface-container text-on-surface-variant opacity-60',
}
const PILL_TONE = { [STEP_STATUS.DONE]: 'ok', [STEP_STATUS.IN_PROGRESS]: 'info', [STEP_STATUS.NOT_STARTED]: 'neutral', [STEP_STATUS.BLOCKED]: 'neutral' }

// Vue globale du projet : progression de tout le cycle, de la création du projet à l'historique de l'actif.
function ProjectOverview() {
  const { projectId } = useParams()
  const state = useProjectOverview(projectId)
  const { overview, workflow } = state

  return (
    <LoadState backLabel="Projets" backTo="/projects" state={state}>
      {overview && workflow && (
        <div className="flex w-full flex-col gap-space-lg pb-8" data-testid="project-overview">
          <div className="flex flex-wrap items-end justify-between gap-space-md">
            <div>
              <div className="mb-space-xs flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                Vue globale du projet
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">{overview.project.name}</h1>
              <p className="mt-space-2xs font-body-md text-body-md text-on-surface-variant">
                {overview.project.reference} • {overview.project.client} • {overview.project.installationSite}
              </p>
            </div>
            <StatusPill tone="info">{PROJECT_STATUS_LABELS[overview.project.status]}</StatusPill>
          </div>

          <section className="flex flex-wrap items-center justify-between gap-space-md rounded-xl bg-primary-container p-space-lg text-surface-bright shadow-xl" data-testid="next-action">
            {workflow.next ? (
              <>
                <div>
                  <div className="font-label-caps text-label-caps uppercase text-secondary-fixed">Prochaine action</div>
                  <div className="font-headline-md text-headline-md font-bold">{workflow.next.label}</div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">{workflow.next.reason || 'Étape suivante du cycle de vie de l\'armoire.'}</p>
                </div>
                <LinkButton data-testid="continue" iconAfter="arrow_forward" to={workflow.next.path}>Continuer</LinkButton>
              </>
            ) : (
              <div className="flex items-center gap-space-sm font-headline-sm text-headline-sm font-bold">
                <span className="material-symbols-outlined">task_alt</span>
                Cycle complet : l'armoire est installée et suivie.
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
            <SectionCard className="lg:col-span-7" icon="timeline" subtitle={`${workflow.steps.filter((step) => step.status === STEP_STATUS.DONE).length} / ${workflow.steps.length} étapes terminées`} title="Progression du cycle">
              <ol className="relative space-y-0" data-testid="timeline">
                {workflow.steps.map((step, index) => {
                  const clickable = step.path && step.status !== STEP_STATUS.BLOCKED
                  return (
                    <li className="relative flex gap-space-md pb-space-md" data-step={step.key} data-status={step.status} key={step.key}>
                      {index < workflow.steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-outline-variant" />}
                      <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${NODE_TONE[step.status]} ${step.issue ? 'outline outline-2 outline-error' : ''}`}>
                        <span className="material-symbols-outlined text-[18px]">{STATUS_ICON[step.status]}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-space-sm">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{step.icon}</span>
                          {clickable ? (
                            <Link className="font-body-md font-semibold text-on-surface hover:text-secondary hover:underline" to={step.path}>{step.label}</Link>
                          ) : (
                            <span className="font-body-md font-semibold text-on-surface-variant">{step.label}</span>
                          )}
                          <StatusPill tone={step.issue ? 'error' : PILL_TONE[step.status]}>{STATUS_TEXT[step.status]}</StatusPill>
                        </div>
                        {step.reason && <div className={`font-tech-unit text-tech-unit ${step.issue ? 'text-error' : 'text-on-surface-variant'}`}>{step.reason}</div>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </SectionCard>

            <div className="flex flex-col gap-space-lg lg:col-span-5">
              <SectionCard icon="developer_board" title="Armoire">
                {overview.cabinet ? (
                  <div className="grid grid-cols-2 gap-space-md">
                    <Metric label="Référence" value={overview.cabinet.reference} />
                    <Metric label="Départs calculés" testId="ov-feeders" value={`${overview.feeders.filter((f) => f.status !== 'draft').length} / ${overview.feeders.length}`} />
                    <Metric label="Réseau" value={overview.cabinet.network} />
                    <Metric label="Neutre" value={overview.cabinet.neutralSystem} />
                  </div>
                ) : (
                  <p className="font-body-sm text-on-surface-variant">Aucune armoire configurée.</p>
                )}
              </SectionCard>
              <SectionCard icon="request_quote" title="Devis et installation">
                <div className="grid grid-cols-2 gap-space-md">
                  <Metric label="Devis" value={overview.quotation?.reference ?? '—'} />
                  <Metric label="Total TTC" value={overview.quotation ? formatMoney(overview.quotation.totalTTC) : '—'} />
                  <Metric label="Installation" value={overview.installation ? formatDate(overview.installation.installationDate) : '—'} />
                  <Metric label="Actif" testId="ov-asset" value={overview.asset?.assetId ?? '—'} />
                </div>
              </SectionCard>
              {overview.asset && (
                <SectionCard icon="build" title="Exploitation">
                  <div className="grid grid-cols-2 gap-space-md">
                    <Metric label="Prochaine maintenance" value={overview.maintenance ? formatDate(overview.maintenance.nextDate) : '—'} />
                    <Metric label="Tickets ouverts" value={overview.tickets.open} detail={`${overview.tickets.total} au total`} />
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </div>
      )}
    </LoadState>
  )
}

export default ProjectOverview
