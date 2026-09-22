import { NavLink } from "react-router-dom";
import { navigation } from "../../data/navigation.js";

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-50 print:hidden flex h-screen select-none flex-col bg-primary-container text-surface-bright shadow-[2px_0_12px_rgba(7,21,37,0.18)] transition-[width] duration-300 ${collapsed ? "w-[72px]" : "w-72"}`}>
      <div
        className={`flex h-14 shrink-0 items-center bg-tertiary-container ${collapsed ? "justify-center px-space-sm" : "gap-space-md px-space-md"}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-[0_1px_8px_rgba(0,81,213,0.35)]">
          <span className="material-symbols-outlined text-[20px]">
            electric_bolt
          </span>
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-headline-sm text-headline-sm leading-none tracking-tight text-surface-bright">
              ELEC Engineering
            </span>
            <span className="mt-space-2xs truncate font-label-caps text-label-caps uppercase tracking-wider text-on-primary-container">
              IEC 60364 • NF C 15-100
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-primary-fixed-dim hover:bg-surface-container-highest/20 hover:text-surface-bright"
            onClick={onToggle}
            type="button"
            aria-label="Réduire le menu">
            <span className="material-symbols-outlined text-[18px]">
              keyboard_double_arrow_left
            </span>
          </button>
        )}
        {collapsed && (
          <button
            className="absolute right-[-14px] top-5 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-md"
            onClick={onToggle}
            type="button"
            aria-label="Ouvrir le menu">
            <span className="material-symbols-outlined text-[16px]">
              keyboard_double_arrow_right
            </span>
          </button>
        )}
      </div>

      <div
        className={`flex-1 space-y-space-md overflow-hidden py-space-sm ${collapsed ? "px-space-sm" : "px-space-md"}`}>
        {navigation.map((group) => (
          <div className="space-y-space-2xs" key={group.section}>
            {!collapsed && (
              <div className="px-space-sm pb-space-2xs text-[9px] font-bold uppercase leading-3 tracking-wider text-on-primary-container">
                {group.section}
              </div>
            )}
            <nav className="space-y-space-2xs">
              {group.items.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center rounded-lg py-space-xs transition-all ${collapsed ? "justify-center px-space-sm" : "gap-space-sm px-space-sm"} ${isActive ? "bg-secondary text-[13px] font-semibold leading-4 text-on-secondary shadow-[0_1px_6px_rgba(0,81,213,0.35)]" : "text-[12px] leading-4 text-primary-fixed-dim hover:bg-surface-container-highest/20 hover:text-surface-bright"}`
                  }
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}>
                  <span className="material-symbols-outlined text-[17px]">
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div
        className={`shrink-0 bg-tertiary-container ${collapsed ? "p-space-sm" : "p-space-sm"}`}>
        <div
          className={`flex items-center rounded-lg bg-primary-container p-space-sm ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex min-w-0 items-center gap-space-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <span className="font-tech-data-md text-tech-data-md font-bold uppercase">
                AE
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold leading-4 text-surface-bright">
                  Asma Engineer
                </div>
                <div className="truncate text-[10px] leading-3 text-on-primary-container">
                  Lead Bureau d'Études
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex shrink-0 items-center gap-space-2xs">
              <NavLink
                className="rounded p-space-xs text-primary-fixed-dim hover:text-surface-bright"
                to="/settings"
                aria-label="Settings">
                <span className="material-symbols-outlined text-[18px]">
                  settings
                </span>
              </NavLink>
              <button
                className="rounded p-space-xs text-primary-fixed-dim hover:text-error"
                type="button"
                aria-label="Log out">
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
