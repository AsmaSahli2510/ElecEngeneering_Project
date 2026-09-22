import { Link } from "react-router-dom";

// Boutons et liens-boutons partagés. variant : primary | secondary | danger | ghost
const VARIANTS = {
  primary: "bg-secondary text-on-secondary hover:bg-secondary-container",
  secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
  danger: "bg-error-container text-on-error-container hover:opacity-80",
  ghost: "text-secondary hover:bg-surface-container-low",
};

const base =
  "inline-flex h-10 items-center justify-center gap-space-xs rounded-lg px-space-lg font-body-sm text-body-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", icon, children, className = "", ...rest }) {
  return (
    <button className={`${base} ${VARIANTS[variant]} ${className}`} type="button" {...rest}>
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", icon, iconAfter, children, className = "", disabled, to, ...rest }) {
  const classes = `${base} ${VARIANTS[variant]} ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`;
  return (
    <Link aria-disabled={disabled || undefined} className={classes} tabIndex={disabled ? -1 : undefined} to={to} {...rest}>
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
      {iconAfter && <span className="material-symbols-outlined text-[18px]">{iconAfter}</span>}
    </Link>
  );
}
