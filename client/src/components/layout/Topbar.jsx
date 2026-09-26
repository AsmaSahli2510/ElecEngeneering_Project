import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { navigation } from "../../data/navigation.js";
import { formatDate } from "../../domain/lifecycle/dates.js";
import { useMaintenanceAlerts } from "../../hooks/useMaintenanceAlerts.js";
import { useProjectsWithProgress } from "../../hooks/useProjectsWithProgress.js";
import SearchInput from "../ui/SearchInput.jsx";
import StatusPill from "../ui/StatusPill.jsx";

const NAV_ITEMS = navigation.flatMap((group) => group.items);

function Topbar({ sidebarCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useProjectsWithProgress();
  const { alerts } = useMaintenanceAlerts();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return projects
      .filter((project) =>
        [project.reference, project.name, project.client, project.site, project.cabinetRef]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [projects, query]);

  // Section active du menu latéral, dérivée de l'URL : la navbar suit le routeur au lieu d'un libellé figé.
  const currentSection = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return NAV_ITEMS.find((item) => item.path === "/dashboard");
    return (
      NAV_ITEMS.find((item) => path === item.path) ||
      NAV_ITEMS.find((item) => path.startsWith(`${item.path}/`))
    );
  }, [location.pathname]);

  // À l'intérieur d'un projet précis (/projects/:id/...), affiche sa référence plutôt que le libellé générique.
  const currentProject = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    if (!match || match[1] === "new") return null;
    return projects.find((project) => project._id === match[1]) ?? null;
  }, [location.pathname, projects]);

  const goToProject = (projectId) => {
    navigate(`/projects/${projectId}`);
    setQuery("");
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      if (results[0]) {
        goToProject(results[0]._id);
      } else if (query.trim()) {
        navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
        setSearchOpen(false);
      }
    }
    if (event.key === "Escape") {
      setSearchOpen(false);
    }
  };

  return (
    <header
      className={`fixed right-0 top-0 z-40 print:hidden bg-surface-container-lowest/95 shadow-[0_1px_6px_rgba(11,28,48,0.06)] backdrop-blur-md transition-[left] duration-300 ${sidebarCollapsed ? "left-[72px]" : "left-72"}`}>
      <div className="flex h-16 items-center justify-between px-space-xl">
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              {currentSection?.icon ?? "dashboard"}
            </span>
            <NavLink
              className="font-semibold text-on-surface hover:text-secondary"
              to={currentSection?.path ?? "/dashboard"}>
              {currentSection?.label ?? "Dashboard"}
            </NavLink>
            {currentProject && (
              <>
                <span className="text-outline-variant">/</span>
                <span className="font-tech-data-md text-tech-data-md font-semibold text-on-surface">
                  {currentProject.reference ?? currentProject.name}
                </span>
              </>
            )}
          </div>
          <div className="hidden 2xl:flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-sm py-space-2xs text-on-surface-variant">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="font-tech-unit text-tech-unit font-bold uppercase tracking-wider text-on-surface">
              Moteur Calcul IEC 60364 Prêt
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="relative hidden md:block" ref={searchRef}>
            <SearchInput
              className="md:w-72 lg:w-80"
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                if (query) setSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher projet, armoire, référence..."
              value={query}
            />
            {searchOpen && query && (
              <div className="absolute right-0 top-full z-50 mt-space-xs max-h-96 w-full overflow-y-auto rounded-xl bg-surface-container-lowest shadow-lg ring-1 ring-outline-variant/40">
                {results.length === 0 ? (
                  <p className="p-space-md font-body-sm text-body-sm text-on-surface-variant">
                    Aucun résultat pour « {query} »
                  </p>
                ) : (
                  results.map((project) => (
                    <button
                      className="flex w-full flex-col items-start gap-space-2xs border-b border-surface-container-low px-space-md py-space-sm text-left last:border-0 hover:bg-surface-container-low"
                      key={project._id}
                      onClick={() => goToProject(project._id)}
                      type="button">
                      <span className="flex items-center gap-space-xs font-tech-data-md text-tech-data-md font-bold text-secondary">
                        {project.reference}
                        <span className="font-body-sm text-body-sm font-normal text-on-surface">
                          {project.name}
                        </span>
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {project.client} • {project.site}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container"
              onClick={() => setNotifOpen((open) => !open)}
              type="button"
              aria-label="Notifications">
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              {alerts.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-space-xs w-80 overflow-hidden rounded-xl bg-surface-container-lowest shadow-lg ring-1 ring-outline-variant/40">
                <div className="border-b border-surface-container-low px-space-md py-space-sm font-headline-sm text-headline-sm text-on-surface">
                  Notifications
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="p-space-md font-body-sm text-body-sm text-on-surface-variant">
                      Aucune échéance de maintenance aujourd'hui.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <button
                        className="flex w-full items-start justify-between gap-space-sm border-b border-surface-container-low px-space-md py-space-sm text-left last:border-0 hover:bg-surface-container-low"
                        key={alert._id}
                        onClick={() => {
                          navigate(`/assets/${alert.asset?.assetId}/maintenance`);
                          setNotifOpen(false);
                        }}
                        type="button">
                        <div>
                          <p className="font-tech-data-md text-tech-data-md font-bold text-on-surface">
                            {alert.asset?.assetId}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Maintenance prévue le {formatDate(alert.nextDate)}
                          </p>
                        </div>
                        <StatusPill tone={alert.isOverdue ? "error" : "warn"}>
                          {alert.isOverdue ? "En retard" : "Aujourd'hui"}
                        </StatusPill>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
