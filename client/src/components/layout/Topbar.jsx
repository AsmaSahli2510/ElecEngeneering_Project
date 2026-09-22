import { NavLink } from "react-router-dom";
import SearchInput from "../ui/SearchInput.jsx";

function Topbar({ sidebarCollapsed }) {
  return (
    <header
      className={`fixed right-0 top-0 z-40 print:hidden bg-surface-container-lowest/95 shadow-[0_1px_6px_rgba(11,28,48,0.06)] backdrop-blur-md transition-[left] duration-300 ${sidebarCollapsed ? "left-[72px]" : "left-72"}`}>
      <div className="flex h-16 items-center justify-between px-space-xl">
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              folder_open
            </span>
            <NavLink
              className="font-semibold text-on-surface hover:text-secondary"
              to="/projects">
              Projets
            </NavLink>
            <span className="text-outline-variant">/</span>
            <span className="font-tech-data-md text-tech-data-md font-semibold text-on-surface">
              Portefeuille BE
            </span>
            <span className="text-outline-variant">•</span>
            <span className="hidden xl:inline">24 Études actives</span>
          </div>
          <div className="hidden 2xl:flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-sm py-space-2xs text-on-surface-variant">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="font-tech-unit text-tech-unit font-bold uppercase tracking-wider text-on-surface">
              Moteur Calcul IEC 60364 Prêt
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <SearchInput
            className="hidden md:block md:w-72 lg:w-80"
            placeholder="Rechercher projet, armoire, référence..."
          />
          <div className="hidden items-center gap-space-2xs rounded bg-surface-container-low px-space-sm py-space-xs font-tech-unit text-tech-unit font-bold text-secondary lg:flex">
            <span className="material-symbols-outlined text-[16px]">
              verified
            </span>
            <span>CEI 60364-5-52</span>
          </div>
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container"
            type="button"
            aria-label="Notifications">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
