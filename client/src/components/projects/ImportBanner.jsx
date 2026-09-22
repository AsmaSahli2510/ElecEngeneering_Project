function ImportBanner() {
  return (
    <div className="mb-space-2xl flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm md:flex-row">
      <div className="flex items-center gap-space-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-secondary shadow-sm">
          <span className="material-symbols-outlined text-[26px]">
            upload_file
          </span>
        </div>
        <div>
          <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Besoin d'importer une liste ou un dossier d'études existant ?
          </h4>
          <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
            Synchronisez directement vos notes de calculs au format{" "}
            <strong className="font-tech-unit text-tech-unit text-on-surface">
              Caneco BT
            </strong>
            ,{" "}
            <strong className="font-tech-unit text-tech-unit text-on-surface">
              Elec Calc
            </strong>{" "}
            ou tables normalisées{" "}
            <strong className="font-tech-unit text-tech-unit text-on-surface">
              Excel (.xlsx)
            </strong>
            .
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-sm">
        <button
          className="flex h-10 items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-lg font-headline-sm text-headline-sm text-on-surface shadow-sm hover:bg-surface-container"
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            download
          </span>
          Télécharger Template
        </button>
        <button
          className="flex h-10 items-center gap-space-xs rounded-lg bg-secondary px-space-lg font-headline-sm text-headline-sm text-on-secondary shadow-sm hover:bg-secondary-container"
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            drive_folder_upload
          </span>
          Importer Fichier
        </button>
      </div>
    </div>
  );
}

export default ImportBanner;
