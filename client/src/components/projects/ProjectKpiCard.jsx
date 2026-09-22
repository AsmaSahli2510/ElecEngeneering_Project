function ProjectKpiCard({
  label,
  title,
  icon,
  value,
  suffix,
  detail,
  progress,
  tone = "secondary",
  alert,
}) {
  return (
    <div className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-xl border border-surface-container-low bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="block font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            {label}
          </span>
          <span className="mt-space-2xs block font-headline-sm text-headline-sm font-semibold text-on-surface">
            {title}
          </span>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low ${tone === "secondary" ? "text-secondary" : "text-on-tertiary-container"}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-space-md">
        <div className="flex items-baseline gap-space-xs">
          <span className="font-tech-data-xl text-tech-data-xl text-on-surface">
            {value}
          </span>
          {suffix && (
            <span className="font-tech-unit text-tech-unit text-on-surface-variant">
              {suffix}
            </span>
          )}
        </div>
        {alert ? (
          <div className="mt-space-2xs flex items-center gap-space-xs font-body-sm text-body-sm text-error">
            <span className="material-symbols-outlined text-[15px]">
              report_problem
            </span>
            {alert}
          </div>
        ) : (
          <div className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
            {detail}
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-space-md h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
          <div
            className={`h-full rounded-full ${tone === "secondary" ? "bg-secondary" : "bg-secondary-container"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectKpiCard;
