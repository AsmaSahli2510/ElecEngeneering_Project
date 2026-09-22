import { useProjectOverview } from "../../hooks/useProjectOverview.js";
import NewProjectStepper from "./NewProjectStepper.jsx";
import ProjectContextCard from "./ProjectContextCard.jsx";

// Gabarit commun des pages du cycle de vie : stepper connecté, titre, contenu, fiche du dossier.
//  - projectId / current : projet courant et clé de l'étape affichée (voir domain/lifecycle/workflow.js)
//  - cabinet / progress  : surcharges facultatives (valeurs plus fraîches que la vue agrégée)
//  - layout "wide"       : contenu pleine largeur, sans fiche latérale (nomenclature, devis)
function WorkflowStepPage({ eyebrow, title, description, icon, projectId, current, children, footer, layout = "split", cabinet, progress, actions, refreshKey }) {
  const { overview } = useProjectOverview(projectId, refreshKey);
  const project = overview?.project ?? null;
  const cabinetDoc = cabinet ?? overview?.cabinet ?? null;
  const feeders = overview?.feeders ?? [];
  const cabinetProgress = progress ?? (overview?.cabinet ? { total: feeders.length, done: feeders.filter((feeder) => feeder.status !== "draft").length } : undefined);

  return (
    <div className="flex w-full flex-col gap-space-lg pb-8">
      <NewProjectStepper current={current} overview={overview} />
      <div className="flex flex-wrap items-end justify-between gap-space-md print:hidden">
        <div>
          <div className="mb-space-xs flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            {eyebrow}
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">{title}</h1>
          {description && <p className="mt-space-2xs max-w-3xl font-body-md text-body-md text-on-surface-variant">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          {actions}
          <div className="flex items-center gap-space-xs rounded-lg bg-surface-container-low px-space-md py-space-xs font-tech-unit text-tech-unit text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
            {[project?.reference, cabinetDoc?.reference].filter(Boolean).join(" • ") || "Chargement…"}
          </div>
        </div>
      </div>
      {layout === "wide" ? (
        <div className="flex flex-col gap-space-lg">{children}</div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
          <div className="flex flex-col gap-space-xl lg:col-span-8">{children}</div>
          <div className="lg:col-span-4 print:hidden">
            <ProjectContextCard cabinet={cabinetDoc} progress={cabinetProgress} project={project} />
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}

export default WorkflowStepPage;
