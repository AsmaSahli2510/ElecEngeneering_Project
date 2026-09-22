function ProjectHeader({ total = 0, studiesCount = 0, quoteCount = 0, installedCount = 0 }) {
  return (
    <div className="mb-space-lg flex flex-col justify-between gap-space-md 2xl:flex-row 2xl:items-center">
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-space-md">
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
            Projets d'Ingénierie
          </h1>
          <div className="flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-space-2xs">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            <span className="font-tech-data-md text-tech-data-md font-semibold text-on-surface">
              {total} Projets au total
            </span>
          </div>
        </div>
        <p className="mt-space-2xs max-w-4xl font-body-md text-body-md text-on-surface-variant">
          Pilotez l'ensemble des études de dimensionnement, armoires TGBT, devis
          et chantiers de raccordement basse tension selon les normes{" "}
          <strong className="font-tech-unit text-tech-unit text-on-surface">
            NF C 15-100
          </strong>{" "}
          &{" "}
          <strong className="font-tech-unit text-tech-unit text-on-surface">
            NF EN 61439-1/-2
          </strong>
          .
        </p>
        <div className="mt-space-xs flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
          <span>
            <i className="mr-space-2xs inline-block h-1.5 w-1.5 rounded-full bg-secondary" />
            <strong className="text-on-surface">{studiesCount}</strong> en cours d'études
          </span>
          <span className="text-outline-variant">•</span>
          <span>
            <i className="mr-space-2xs inline-block h-1.5 w-1.5 rounded-full bg-on-tertiary-container" />
            <strong className="text-on-surface">{quoteCount}</strong> en chiffrage /
            validation
          </span>
          <span className="text-outline-variant">•</span>
          <span>
            <i className="mr-space-2xs inline-block h-1.5 w-1.5 rounded-full bg-inverse-surface" />
            <strong className="text-on-surface">{installedCount}</strong> installés & GMAO
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProjectHeader;
