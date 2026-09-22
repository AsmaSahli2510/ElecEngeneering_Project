import Button from "../ui/Button.jsx";

function ProjectToolbar({ view, onViewChange, onNewProject }) {
  return (
    <div className="mb-space-lg flex flex-wrap items-center justify-end gap-space-sm">
      <div className="inline-flex rounded-lg bg-surface-container-low p-space-2xs shadow-sm">
        <button
          className={`flex items-center gap-space-xs rounded px-space-md py-space-xs font-headline-sm text-headline-sm ${view === "table" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => onViewChange("table")}
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            table_rows
          </span>
          <span className="hidden sm:inline font-body-sm text-body-sm">
            Tableau
          </span>
        </button>
        <button
          className={`flex items-center gap-space-xs rounded px-space-md py-space-xs font-headline-sm text-headline-sm ${view === "cards" ? "bg-surface-container-lowest text-secondary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => onViewChange("cards")}
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            grid_view
          </span>
          <span className="hidden sm:inline font-body-sm text-body-sm">
            Cartes
          </span>
        </button>
      </div>
      <Button
        className="flex h-10 items-center gap-space-xs rounded-lg px-space-md font-headline-sm text-headline-sm"
        variant="neutral"
        type="button">
        <span className="material-symbols-outlined text-[18px]">
          file_download
        </span>
        <span>Exporter (.xlsx)</span>
      </Button>
      <Button
        className="flex h-10 items-center gap-space-xs rounded-lg px-space-lg font-headline-sm text-headline-sm"
        onClick={onNewProject}
        type="button">
        <span className="material-symbols-outlined text-[20px]">
          add_circle
        </span>
        <span>+ Nouveau Projet</span>
      </Button>
    </div>
  );
}

export default ProjectToolbar;
