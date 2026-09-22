import DashboardWidgets from "../components/dashboard/DashboardWidgets.jsx";
import LoadMonitor from "../components/dashboard/LoadMonitor.jsx";
import MetricCard from "../components/dashboard/MetricCard.jsx";
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
            Operational Workspace • Site Supervision Desk
          </div>
          <h1 className="mt-space-2xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Good morning Asma — Engineering workspace overview
          </h1>
          <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
            Current standard compliance: NF C 15-100 Amendment 5 • IEC
            60364-5-52 • Active electrical nodes: {m(data?.cabinetsTotal ?? 0)}
          </p>
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

      <section className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Active Studies"
          icon="account_tree"
          value={m(data?.activeProjects ?? 0)}
          unit="PRJ"
          footer="Total Projects"
          footerValue={`${m(data?.projectsTotal ?? 0)} total`}
        />
        <MetricCard
          label="Cabinets Dimensioned"
          icon="developer_board"
          iconTone="text-on-tertiary-container"
          value={m(data?.cabinetsTotal ?? 0)}
          unit="UNITS"
          footer="Active Projects"
          footerValue={`${m(data?.activeProjects ?? 0)} en cours`}
        />
        <MetricCard
          label="Assets Under Norm"
          icon="verified"
          value={m(data?.assetsTotal ?? 0)}
          unit="COMMISSIONED"
          footer="En service"
          footerValue={`${m(data?.commissionedAssets ?? 0)} / ${m(data?.assetsTotal ?? 0)}`}
        />
        <MetricCard
          label="Open Diagnostics"
          icon="notification_important"
          iconTone="text-error"
          value={m(data?.openTickets ?? 0)}
          unit="TICKETS"
          footer={`${m(data?.highPriorityOpenTickets ?? 0)} High Priority`}
          footerValue="⚠"
          alert={Boolean(data?.openTickets)}
        />
        <MetricCard
          label="Preventive GMAO"
          icon="calendar_clock"
          value={m(data?.maintenanceTotal ?? 0)}
          unit="SCHEDULED"
          footer="Due ≤ 7 Days"
          footerValue={`${m(data?.maintenanceDueSoon ?? 0)} items`}
        />
      </section>

      <LoadMonitor />

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
