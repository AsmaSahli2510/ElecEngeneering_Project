import { useNavigate } from "react-router-dom";
import ProjectProgress from "./ProjectProgress.jsx";
import ProjectStatus from "./ProjectStatus.jsx";

function actionFor(project) {
  if (!project.currentStep) return { label: "Dossier GMAO", icon: "qr_code_2" };
  if (["bom", "quotation"].includes(project.currentStep.key)) return { label: "Devis BOM", icon: "arrow_forward" };
  if (project.status === "draft") return { label: "Configurer", icon: "arrow_forward" };
  return { label: "Espace BE", icon: "arrow_forward" };
}

function ProjectRow({ project }) {
  const navigate = useNavigate();
  const action = actionFor(project);
  const goToProject = () => navigate(`/projects/${project._id}`);

  return (
    <tr className="group transition-colors hover:bg-surface-container-low/60">
      <td className="whitespace-nowrap px-space-lg py-space-md">
        <div className="flex items-center gap-space-xs">
          <span
            className={`font-tech-data-md text-tech-data-md font-bold ${project.status === "active" ? "text-secondary" : "text-on-surface"}`}>
            {project.reference}
          </span>
          {project.status === "active" && (
            <span className="rounded bg-surface-container-high px-space-xs py-space-2xs font-label-caps text-label-caps uppercase text-on-surface">
              Actif
            </span>
          )}
        </div>
        <span className="mt-space-2xs block font-tech-unit text-tech-unit text-on-surface-variant">
          Créé le {project.createdLabel}
        </span>
      </td>
      <td className="min-w-[280px] px-space-lg py-space-md">
        <div className="font-headline-sm text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-secondary">
          {project.name}
        </div>
        <div className="mt-space-2xs flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">notes</span>
          {project.description || "Aucune description"}
        </div>
      </td>
      <td className="whitespace-nowrap px-space-lg py-space-md">
        <div className="font-headline-sm text-headline-sm font-medium text-on-surface">
          {project.client}
        </div>
        <div className="mt-space-2xs flex items-center gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] text-secondary">
            pin_drop
          </span>
          {project.site}
        </div>
      </td>
      <td className="whitespace-nowrap px-space-lg py-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="font-tech-data-md text-tech-data-md font-bold text-on-surface">
            {project.cabinetRef ?? "Non configurée"}
          </span>
        </div>
        <div className="mt-space-2xs font-body-sm text-body-sm text-on-surface">
          {project.network ?? "—"}
        </div>
      </td>
      <td className="px-space-lg py-space-md">
        <ProjectProgress project={project} />
      </td>
      <td className="whitespace-nowrap px-space-lg py-space-md">
        <ProjectStatus project={project} />
      </td>
      <td className="whitespace-nowrap px-space-lg py-space-md">
        <div className="flex items-center gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[13px]">
            {project.currentStep ? "event" : "check_circle"}
          </span>
          Maj le {project.updatedLabel}
        </div>
      </td>
      <td className="whitespace-nowrap px-space-lg py-space-md text-right">
        <div className="flex items-center justify-end gap-space-xs">
          <button
            className="flex h-8 items-center gap-space-2xs rounded bg-surface-container-low px-space-sm font-body-sm text-body-sm font-medium text-secondary shadow-sm hover:bg-secondary hover:text-on-secondary"
            onClick={goToProject}
            type="button">
            <span>{action.label}</span>
            <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            onClick={goToProject}
            type="button"
            aria-label={`Actions ${project.reference}`}>
            <span className="material-symbols-outlined text-[18px]">
              more_vert
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ProjectRow;
