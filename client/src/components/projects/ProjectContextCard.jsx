const PROJECT_STATUS_LABELS = {
  draft: "Brouillon",
  active: "En cours",
  completed: "Terminé",
  archived: "Archivé",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-space-md py-space-2xs">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-right font-semibold text-on-surface">{value || "—"}</span>
    </div>
  );
}

// Résumé du dossier alimenté par les données réelles du projet et de l'armoire.
function ProjectContextCard({ project, cabinet, progress }) {
  return (
    <div className="flex flex-col gap-space-lg lg:sticky lg:top-20">
      <section className="space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Aperçu du dossier
          </span>
          <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold uppercase text-on-surface">
            {PROJECT_STATUS_LABELS[project?.status] ?? "—"}
          </span>
        </div>
        <div className="space-y-space-sm rounded-lg bg-surface-container-low p-space-md shadow-sm">
          <span className="font-tech-unit text-tech-unit text-on-surface-variant">Référence du projet</span>
          <div className="break-words font-tech-data-lg text-tech-data-lg font-bold tracking-tight text-secondary">
            {project?.reference || "—"}
          </div>
          <div className="font-body-md text-body-md font-semibold leading-tight text-on-surface">
            {project?.name || "Nom du projet"}
          </div>
        </div>
        <div className="font-body-sm text-body-sm">
          <Row label="Client" value={project?.client} />
          <Row label="Site" value={project?.installationSite} />
          <Row label="Adresse" value={project?.siteAddress} />
          <Row label="Création" value={formatDate(project?.creationDate)} />
        </div>
      </section>

      {cabinet && (
        <section className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            Armoire
          </span>
          <div className="font-tech-data-lg text-tech-data-lg font-bold text-secondary">{cabinet.reference}</div>
          <div className="font-body-sm text-body-sm">
            <Row label="Alimentation" value={cabinet.powerSupplyPoint} />
            <Row label="Distance TGBT" value={cabinet.distanceToTGBT !== undefined ? `${cabinet.distanceToTGBT} m` : null} />
            <Row label="Réseau" value={cabinet.network} />
            <Row label="Régime de neutre" value={cabinet.neutralSystem} />
          </div>
          {progress && (
            <div className="space-y-space-xs pt-space-sm">
              <div className="flex items-center justify-between font-tech-unit text-tech-unit text-on-surface-variant">
                <span>Départs calculés</span>
                <strong className="text-on-surface">
                  {progress.done} / {progress.total}
                </strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ProjectContextCard;
