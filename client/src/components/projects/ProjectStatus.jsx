import { PROJECT_STATUS_LABELS } from "../../domain/lifecycle/labels.js";

const tones = {
  draft: "bg-surface-container-low text-on-surface-variant",
  active: "bg-secondary-fixed text-on-secondary-fixed",
  completed: "bg-surface-container text-on-surface",
  archived: "bg-surface-container-high text-on-surface",
};

const dotTones = {
  draft: "bg-outline",
  active: "bg-secondary",
  completed: "bg-inverse-surface",
  archived: "bg-on-tertiary-container",
};

function ProjectStatus({ project }) {
  return (
    <span
      className={`inline-flex items-center gap-space-xs whitespace-nowrap rounded-full px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold ${tones[project.status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTones[project.status]}`} />
      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
    </span>
  );
}

export default ProjectStatus;
