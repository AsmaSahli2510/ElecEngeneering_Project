import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImportBanner from "../components/projects/ImportBanner.jsx";
import Pagination from "../components/projects/Pagination.jsx";
import ProjectFilters from "../components/projects/ProjectFilters.jsx";
import ProjectHeader from "../components/projects/ProjectHeader.jsx";
import ProjectKpiCard from "../components/projects/ProjectKpiCard.jsx";
import ProjectTable from "../components/projects/ProjectTable.jsx";
import ProjectToolbar from "../components/projects/ProjectToolbar.jsx";
import { PROJECT_STATUS_LABELS } from "../domain/lifecycle/labels.js";
import { useProjectsWithProgress } from "../hooks/useProjectsWithProgress.js";

const PAGE_SIZE = 10;

function Projects() {
  const navigate = useNavigate();
  const { status, projects, error } = useProjectsWithProgress();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);

  const clients = useMemo(
    () => [...new Set(projects.map((project) => project.client).filter(Boolean))].sort(),
    [projects],
  );
  const sites = useMemo(
    () => [...new Set(projects.map((project) => project.site).filter(Boolean))].sort(),
    [projects],
  );

  const tabs = useMemo(
    () => [
      { key: "", label: "Tous", count: projects.length },
      ...Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => ({
        key,
        label,
        count: projects.filter((project) => project.status === key).length,
      })),
    ],
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        [project.reference, project.name, project.client, project.site, project.cabinetRef]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = !statusFilter || project.status === statusFilter;
      const matchesClient = !clientFilter || project.client === clientFilter;
      const matchesSite = !siteFilter || project.site === siteFilter;
      return matchesSearch && matchesStatus && matchesClient && matchesSite;
    });
  }, [projects, search, statusFilter, clientFilter, siteFilter]);

  // Revient à la page 1 quand les filtres changent (cf. https://react.dev/learn/you-might-not-need-an-effect).
  const filtersKey = `${search}|${statusFilter}|${clientFilter}|${siteFilter}`;
  const [appliedFiltersKey, setAppliedFiltersKey] = useState(filtersKey);
  if (filtersKey !== appliedFiltersKey) {
    setAppliedFiltersKey(filtersKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const studiesCount = projects.filter((project) => project.status === "active").length;
  const draftCount = projects.filter((project) => project.status === "draft").length;
  const quoteCount = projects.filter((project) =>
    ["bom", "quotation"].includes(project.currentStep?.key),
  ).length;
  const installedCount = projects.filter((project) => project.status === "completed").length;
  const issuesCount = projects.filter((project) => project.currentStep?.issue).length;
  const avgProgress = projects.length
    ? Math.round(
        projects.reduce((sum, project) => sum + project.normativeProgress, 0) / projects.length,
      )
    : 0;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setClientFilter("");
    setSiteFilter("");
  };

  return (
    <div className="w-full">
      <ProjectHeader
        installedCount={installedCount}
        quoteCount={quoteCount}
        studiesCount={studiesCount}
        total={projects.length}
      />
      <ProjectToolbar
        onNewProject={() => navigate("/projects/new")}
        onViewChange={setView}
        view={view}
      />
      <div className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        <ProjectKpiCard
          detail={`${draftCount} en initialisation`}
          icon="architecture"
          label="Bureau d'Études"
          progress={avgProgress}
          suffix="projets en cours"
          title="Études Actives"
          value={String(studiesCount)}
        />
        <ProjectKpiCard
          alert={issuesCount > 0 ? `${issuesCount} alerte(s) de conformité` : undefined}
          detail={issuesCount > 0 ? undefined : "Aucune alerte en cours"}
          icon="verified_user"
          label="Cycle de Vie"
          suffix="étapes terminées (moy.)"
          title="Avancement Normatif"
          value={`${avgProgress}%`}
        />
        <ProjectKpiCard
          detail="Nomenclature ou devis en attente"
          icon="request_quote"
          label="Devis & Approvisionnement"
          suffix="projets en chiffrage"
          title="Chiffrage & BOM"
          tone="alt"
          value={String(quoteCount)}
        />
        <ProjectKpiCard
          detail="Suivi maintenance & tickets actif"
          icon="qr_code_scanner"
          label="Exploitation Site"
          suffix="projets en exploitation"
          title="Installés & GMAO"
          tone="alt"
          value={String(installedCount)}
        />
      </div>
      <ProjectFilters
        clientFilter={clientFilter}
        clients={clients}
        onClientFilter={setClientFilter}
        onReset={resetFilters}
        onSearch={setSearch}
        onSiteFilter={setSiteFilter}
        onStatusFilter={setStatusFilter}
        search={search}
        siteFilter={siteFilter}
        sites={sites}
        statusFilter={statusFilter}
        tabs={tabs}
      />
      {status === "loading" && (
        <p className="p-space-lg font-body-sm text-on-surface-variant">Chargement des projets…</p>
      )}
      {status === "error" && (
        <p className="p-space-lg font-body-sm text-error">API indisponible : {error}</p>
      )}
      {status === "ready" && filteredProjects.length === 0 && (
        <p className="mb-space-lg rounded-xl bg-surface-container-lowest p-space-lg font-body-sm text-on-surface-variant shadow-sm">
          Aucun projet ne correspond à ces critères.
        </p>
      )}
      {status === "ready" && filteredProjects.length > 0 && view === "table" && (
        <>
          <ProjectTable projects={paginatedProjects} />
          <Pagination
            onPageChange={setPage}
            page={currentPage}
            shown={paginatedProjects.length}
            total={filteredProjects.length}
            totalPages={totalPages}
          />
        </>
      )}
      {status === "ready" && filteredProjects.length > 0 && view === "cards" && (
        <div className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              className="cursor-pointer rounded-xl bg-surface-container-lowest p-space-lg shadow-sm"
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}>
              <div className="flex items-center justify-between">
                <span className="font-tech-data-md text-tech-data-md font-bold text-secondary">
                  {project.reference}
                </span>
                <span className="font-tech-unit text-tech-unit text-on-surface-variant">
                  {project.statusLabel}
                </span>
              </div>
              <h3 className="mt-space-md font-headline-sm text-headline-sm font-semibold text-on-surface">
                {project.name}
              </h3>
              <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
                {project.client} • {project.site}
              </p>
              <div className="mt-space-md h-1.5 rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary"
                  style={{ width: `${project.normativeProgress}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
      <ImportBanner />
    </div>
  );
}

export default Projects;
