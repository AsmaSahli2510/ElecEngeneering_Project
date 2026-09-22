// Cadre d'un des 7 formulaires du calcul de départ. Chaque formulaire est un <form> distinct
// avec son propre état de validité ; la touche Entrée ne recharge pas la page.

function FormCard({ id, number, title, subtitle, icon, errors = {}, issues = [], children }) {
  const errorCount = Object.keys(errors).length;
  const blocked = issues.length > 0;
  const status = errorCount > 0 ? "error" : blocked ? "blocked" : "valid";
  const badge = {
    valid: { label: "Valide", className: "bg-secondary-fixed text-on-secondary-fixed", icon: "check_circle" },
    error: { label: `${errorCount} à corriger`, className: "bg-error-container text-on-error-container", icon: "error" },
    blocked: { label: "Bloqué", className: "bg-error-container text-on-error-container", icon: "block" },
  }[status];

  return (
    <form
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:p-space-xl"
      data-form={id}
      id={`form-${id}`}
      noValidate
      onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface" id={`${id}-title`}>
              {number}. {title}
            </h2>
            {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>}
          </div>
        </div>
        <span
          className={`flex items-center gap-space-2xs rounded px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold ${badge.className}`}
          data-form-status={status}>
          <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
          {badge.label}
        </span>
      </div>
      {children}
      {issues.map((issue) => (
        <p
          className="rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container"
          key={issue.message}
          role="alert">
          {issue.message}
        </p>
      ))}
    </form>
  );
}

export default FormCard;
