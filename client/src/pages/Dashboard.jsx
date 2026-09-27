import DashboardWidgets from "../components/dashboard/DashboardWidgets.jsx";
import QuickSizing from "../components/dashboard/QuickSizing.jsx";
import RecentProjects from "../components/dashboard/RecentProjects.jsx";
import { useNavigate } from "react-router-dom";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics.js";

function Dashboard() {
  const navigate = useNavigate();
  const { status, data } = useDashboardMetrics();
  const m = (value) => (status === "ready" ? String(value) : "—");

  return (
    <div className="flex w-full flex-col gap-space-lg">
      <section className="flex flex-col justify-between gap-space-md pb-space-xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Operational Workspace
          </div>
          <h1 className="mt-space-2xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Engineering workspace overview
          </h1>

        </div>
        <div className="flex shrink-0 items-center gap-space-sm self-start md:self-auto">
          <button
            className="flex h-9 items-center gap-space-xs rounded-lg bg-surface-container-low px-space-md font-tech-data-md text-tech-data-md text-on-surface shadow-sm hover:bg-surface-container"
            type="button">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              file_download
            </span>
            Export Reports
          </button>
          <button
            className="flex h-9 items-center gap-space-xs rounded-lg bg-secondary px-space-md font-tech-data-md text-tech-data-md text-on-secondary shadow-sm hover:bg-secondary-container"
            onClick={() => navigate("/projects/new")}
            type="button">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex flex-col gap-space-md xl:col-span-8">
          <RecentProjects />
          <QuickSizing />
        </div>
        <div className="xl:col-span-4">
          <DashboardWidgets />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
