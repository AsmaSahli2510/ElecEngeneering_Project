// Bandeau d'information. tone : info | success | warn | error
const STYLES = {
  info: { box: "bg-surface-container-low text-on-surface", icon: "info" },
  success: { box: "bg-secondary-fixed text-on-secondary-fixed", icon: "check_circle" },
  warn: { box: "bg-[#fff1cc] text-[#6b4a00]", icon: "warning" },
  error: { box: "bg-error-container text-on-error-container", icon: "error" },
};

function Notice({ tone = "info", title, children, actions, className = "", ...rest }) {
  const style = STYLES[tone];
  return (
    <div
      className={`flex flex-wrap items-start gap-space-sm rounded-lg p-space-md font-body-sm text-body-sm ${style.box} ${className}`}
      role={tone === "error" ? "alert" : "status"}
      {...rest}>
      <span className="material-symbols-outlined mt-[1px] text-[18px]">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <div className="font-bold">{title}</div>}
        {children && <div className={title ? "mt-space-2xs" : ""}>{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-space-xs">{actions}</div>}
    </div>
  );
}

export default Notice;
