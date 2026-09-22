export const formInputClass =
  "h-10 w-full rounded-lg bg-surface-container-low px-space-md font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/30";

export const formSelectClass = `${formInputClass} cursor-pointer`;

function FormField({
  label,
  children,
  hint,
  error,
  required = false,
  className = "",
}) {
  return (
    <label className={`space-y-space-xs ${className}`}>
      <span className="flex items-center gap-space-xs font-body-sm text-body-sm font-semibold text-on-surface">
        {label}
        {required && <span className="text-error">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block font-tech-unit text-tech-unit text-error" role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="block font-tech-unit text-tech-unit text-on-surface-variant">
            {hint}
          </span>
        )
      )}
    </label>
  );
}

export default FormField;
