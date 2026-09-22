function Pagination({ page, totalPages, total, shown, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col items-center justify-between gap-space-md bg-surface-container-lowest p-space-md sm:flex-row">
      <div className="font-body-sm text-body-sm text-on-surface-variant">
        Affichage de{" "}
        <strong className="font-tech-data-md text-tech-data-md text-on-surface">
          {shown}
        </strong>{" "}
        sur{" "}
        <strong className="font-tech-data-md text-tech-data-md text-on-surface">
          {total}
        </strong>{" "}
        projets d'études
      </div>
      <div className="flex items-center gap-space-xs">
        <button
          className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-low text-on-surface-variant disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>
        {pages.map((pageNumber) => (
          <button
            className={`flex h-8 w-8 items-center justify-center rounded font-tech-data-md text-tech-data-md ${pageNumber === page ? "bg-secondary font-bold text-on-secondary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            type="button">
            {pageNumber}
          </button>
        ))}
        <button
          className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-low text-on-surface disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}

export default Pagination;
