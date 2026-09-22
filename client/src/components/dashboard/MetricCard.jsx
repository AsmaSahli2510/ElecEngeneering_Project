function MetricCard({ label, icon, iconTone = 'text-secondary', value, unit, footer, footerValue, alert = false }) {
  return (
    <article className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined text-[18px] ${iconTone}`}>{icon}</span>
      </div>
      <div className="mt-space-md flex items-baseline gap-space-xs">
        <span className={`font-tech-data-xl text-tech-data-xl leading-none ${alert ? 'text-error' : 'text-on-surface'}`}>{value}</span>
        <span className="font-tech-unit text-tech-unit text-on-surface-variant">{unit}</span>
      </div>
      <div className={`mt-space-sm flex items-center justify-between rounded px-space-xs py-space-2xs font-body-sm text-body-sm ${alert ? 'bg-error-container text-on-error-container' : 'bg-surface-container-low text-on-surface-variant'}`}>
        <span>{footer}</span>
        <span className={`font-tech-data-md text-tech-data-md font-semibold ${alert ? 'text-on-error-container' : 'text-secondary'}`}>{footerValue}</span>
      </div>
    </article>
  )
}

export default MetricCard
