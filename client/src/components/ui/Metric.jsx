// Tuile d'indicateur : libellé, valeur (police technique), unité / détail.
function Metric({ label, value, unit, detail, testId, className = "" }) {
  return (
    <div className={`rounded-lg bg-surface-container-low p-space-md ${className}`}>
      <div className="font-tech-unit text-tech-unit text-on-surface-variant">{label}</div>
      <div className="mt-space-2xs flex items-baseline gap-space-xs">
        <span className="break-words font-tech-data-lg text-tech-data-lg font-bold text-on-surface" data-testid={testId}>
          {value}
        </span>
        {unit && <span className="font-tech-unit text-tech-unit text-on-surface-variant">{unit}</span>}
      </div>
      {detail && <div className="mt-space-2xs font-tech-unit text-tech-unit text-on-surface-variant">{detail}</div>}
    </div>
  );
}

export default Metric;
