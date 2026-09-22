// Pastille de statut. tone : ok | info | warn | error | neutral
const TONES = {
  ok: "bg-secondary-fixed text-on-secondary-fixed",
  info: "bg-surface-container-high text-secondary",
  warn: "bg-[#fff1cc] text-[#6b4a00]",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

function StatusPill({ tone = "neutral", icon, children, className = "", ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-space-2xs whitespace-nowrap rounded-full px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold ${TONES[tone]} ${className}`}
      {...rest}>
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
}

export default StatusPill;
