import SearchInput from "../ui/SearchInput.jsx";

function ProjectFilters({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  tabs,
  clients,
  clientFilter,
  onClientFilter,
  sites,
  siteFilter,
  onSiteFilter,
  onReset,
}) {
  return (
    <div className="mb-space-lg space-y-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center gap-space-xs overflow-x-auto pb-space-2xs">
        {tabs.map((tab) => (
          <button
            className={`whitespace-nowrap rounded-lg px-space-md py-space-xs font-body-sm text-body-sm font-medium ${tab.key === statusFilter ? "bg-secondary text-on-secondary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}
            key={tab.key || "all"}
            onClick={() => onStatusFilter(tab.key)}
            type="button">
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-space-sm pt-space-xs md:grid-cols-12">
        <SearchInput
          className="md:col-span-6"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rechercher par référence, nom, client, armoire..."
        />
        <select
          className="h-10 rounded-lg bg-surface-container-low px-space-md font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30 md:col-span-2"
          onChange={(event) => onClientFilter(event.target.value)}
          value={clientFilter}>
          <option value="">Tous Clients</option>
          {clients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg bg-surface-container-low px-space-md font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30 md:col-span-2"
          onChange={(event) => onSiteFilter(event.target.value)}
          value={siteFilter}>
          <option value="">Tous Sites</option>
          {sites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>
        <button
          className="flex h-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface md:col-span-2"
          onClick={onReset}
          title="Réinitialiser les filtres"
          type="button">
          <span className="material-symbols-outlined text-[18px]">
            filter_list_off
          </span>
        </button>
      </div>
    </div>
  );
}

export default ProjectFilters;
