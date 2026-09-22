function LoadMonitor() {
  return (
    <section className="flex flex-col items-stretch justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-center gap-space-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-secondary">
          <span className="material-symbols-outlined text-[24px]">power</span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Portfolio Thermal & Load Distribution
            </h2>
            <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit text-on-surface-variant">
              Cos φ avg: 0.93
            </span>
          </div>
          <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
            Global demand active: 3.92 MW / 4.80 MW peak allowance (81.6%
            capacity)
          </p>
        </div>
      </div>
      <div className="flex max-w-xl flex-1 flex-col gap-space-2xs">
        <div className="flex items-center justify-between font-tech-unit text-tech-unit text-on-surface-variant">
          <span>Busbar Stress Level: Normal</span>
          <span className="font-semibold text-on-surface">81.6% Capacity</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full bg-secondary" style={{ width: "68%" }} />
          <div
            className="h-full bg-secondary-fixed-dim"
            style={{ width: "13.6%" }}
          />
          <div className="h-full bg-surface-dim" style={{ width: "18.4%" }} />
        </div>
        <div className="flex items-center justify-between font-label-caps text-label-caps uppercase text-on-surface-variant">
          <span>0 kW</span>
          <span>Reserved Inverters: 650 kW</span>
          <span>Peak: 4,800 kW</span>
        </div>
      </div>
    </section>
  );
}

export default LoadMonitor;
