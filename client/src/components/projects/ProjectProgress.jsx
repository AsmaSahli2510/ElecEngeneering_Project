function ProjectProgress({ project }) {
  return (
    <div className="min-w-[190px]">
      <div className="mb-space-2xs flex items-center justify-between font-body-sm text-body-sm">
        <span className="font-medium text-on-surface">{project.phase}</span>
        <span className="font-tech-unit text-tech-unit font-bold text-secondary">
          {project.stage}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className={`h-full rounded-full ${project.normativeProgress === 100 ? "bg-primary-container" : "bg-secondary"}`}
          style={{ width: `${project.normativeProgress}%` }}
        />
      </div>
    </div>
  );
}

export default ProjectProgress;
