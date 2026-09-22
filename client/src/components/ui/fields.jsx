import FormField, { formInputClass, formSelectClass } from "./FormField.jsx";

const techInput = `${formInputClass} font-tech-data-md`;

// Ajoute un liseré d'erreur à une classe de champ.
const withError = (className, hasError) => (hasError ? `${className} ring-2 ring-error/60` : className);

export function NumberField({ label, value, onChange, error, hint, unit, className, step = "any", min, max, readOnly = false }) {
  return (
    <FormField className={className} error={error} hint={hint} label={label}>
      <div className="relative">
        <input
          aria-invalid={error ? "true" : undefined}
          className={`${withError(techInput, error)} ${unit ? "pr-12" : ""} ${readOnly ? "cursor-default font-bold text-secondary" : ""}`}
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          step={step}
          type="number"
          value={value}
        />
        {unit && (
          <span className="pointer-events-none absolute right-space-md top-1/2 -translate-y-1/2 font-tech-unit text-tech-unit text-on-surface-variant">
            {unit}
          </span>
        )}
      </div>
    </FormField>
  );
}

// options : tableau de chaînes ou de { value, label }
export function SelectField({ label, value, onChange, options, error, hint, className }) {
  return (
    <FormField className={className} error={error} hint={hint} label={label}>
      <select
        aria-invalid={error ? "true" : undefined}
        className={withError(formSelectClass, error)}
        onChange={(event) => onChange(event.target.value)}
        value={value}>
        {options.map((option) => {
          const { value: optionValue, label: optionLabel } = typeof option === "object" ? option : { value: option, label: option };
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}

export function InfoNote({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-surface-container-low text-on-surface-variant",
    ok: "bg-secondary-fixed text-on-secondary-fixed",
    error: "bg-error-container text-on-error-container",
  };
  return <div className={`rounded-lg p-space-md font-body-sm text-body-sm ${tones[tone]}`}>{children}</div>;
}
