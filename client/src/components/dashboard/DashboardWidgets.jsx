import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dueState, formatDate, todayIso } from "../../domain/lifecycle/dates.js";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "../../domain/lifecycle/labels.js";
import { useLoad } from "../../hooks/useLoad.js";
import { api } from "../../lib/api.js";

const DUE_TONE = {
  overdue: "bg-error-container text-on-error-container",
  soon: "bg-surface-variant text-on-surface",
  ok: "bg-surface-container text-on-surface-variant",
};
const DUE_LABEL = { overdue: "Urgent", soon: "À venir", ok: "Planifié" };

function MaintenanceWidget() {
  const navigate = useNavigate();
  const loader = useCallback(async () => {
    const [plans, projects] = await Promise.all([api.maintenancePlans.list(), api.projects.list()]);
    const projectMap = new Map(projects.map((project) => [String(project._id), project]));
    return plans.slice(0, 3).map((plan) => ({
      ...plan,
      project: projectMap.get(String(plan.projectId)) ?? null,
      due: dueState(plan.nextDate, todayIso(), 7),
    }));
  }, []);
  const { status, data, error } = useLoad(loader);

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-secondary">
            build_circle
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Upcoming Maintenance
          </h2>
        </div>
        <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold text-on-surface-variant">
          GMAO
        </span>
      </div>
      <div className="flex flex-col gap-space-sm">
        {status === "loading" && (
          <p className="font-body-sm text-on-surface-variant">Chargement…</p>
        )}
        {status === "error" && (
          <p className="font-body-sm text-error">API indisponible : {error}</p>
        )}
        {status === "ready" && data.length === 0 && (
          <p className="font-body-sm text-on-surface-variant">Aucune maintenance planifiée.</p>
        )}
        {status === "ready" &&
          data.map((plan) => (
            <div
              className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-sm"
              key={plan._id}>
              <div className="flex items-start gap-space-xs">
                <span className="font-tech-data-md text-tech-data-md font-bold text-secondary">
                  {plan.asset?.assetId ?? "—"}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  Maintenance préventive ({plan.frequencyMonths} mois)
                </span>
              </div>
              <div className="flex items-center justify-between pt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[15px]">
                    apartment
                  </span>
                  {plan.project ? `${plan.project.client} (${plan.project.installationSite})` : "—"}
                </span>
                <span className="flex items-center gap-space-2xs">
                  <strong className="font-tech-unit text-tech-unit text-on-surface">
                    {formatDate(plan.nextDate)}
                  </strong>
                  <span
                    className={`rounded px-space-xs py-space-2xs font-label-caps text-label-caps uppercase font-bold ${DUE_TONE[plan.due.state]}`}>
                    {DUE_LABEL[plan.due.state]}
                  </span>
                </span>
              </div>
            </div>
          ))}
      </div>
      <button
        className="flex h-9 items-center justify-center gap-space-xs rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface hover:bg-surface-container"
        onClick={() => navigate("/maintenance")}
        type="button">
        View Full Schedule{" "}
        <span className="material-symbols-outlined text-[16px]">
          chevron_right
        </span>
      </button>
    </section>
  );
}

const OPEN_TICKET_STATUSES = ["reported", "assigned", "in_progress"];
const HIGH_PRIORITIES = ["high", "critical"];

function TicketsWidget() {
  const navigate = useNavigate();
  const loader = useCallback(async () => {
    const tickets = await api.tickets.list();
    return tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).slice(0, 2);
  }, []);
  const { status, data, error } = useLoad(loader);
  const openCount = data?.length ?? 0;

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-error">
            confirmation_number
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Recent Critical Tickets
          </h2>
        </div>
        <span className="rounded bg-error-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold text-on-error-container">
          {openCount} Alerts
        </span>
      </div>
      <div className="flex flex-col gap-space-sm">
        {status === "loading" && (
          <p className="font-body-sm text-on-surface-variant">Chargement…</p>
        )}
        {status === "error" && (
          <p className="font-body-sm text-error">API indisponible : {error}</p>
        )}
        {status === "ready" && data.length === 0 && (
          <p className="font-body-sm text-on-surface-variant">Aucun ticket ouvert.</p>
        )}
        {status === "ready" &&
          data.map((ticket) => (
            <div
              className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-sm"
              key={ticket._id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold">
                    {ticket.number}
                  </span>
                  <span className="font-tech-unit text-tech-unit font-semibold text-secondary">
                    {ticket.asset?.assetId ?? "—"}
                  </span>
                </div>
                <span
                  className={`rounded px-space-xs py-space-2xs font-label-caps text-label-caps uppercase font-bold ${HIGH_PRIORITIES.includes(ticket.priority) ? "bg-error text-on-error" : "bg-surface-container text-on-surface"}`}>
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </span>
              </div>
              <p className="mt-space-2xs font-body-sm text-body-sm font-semibold text-on-surface">
                {ticket.title}
              </p>
              <div className="flex items-center justify-between pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <span>{ticket.technician || "Non assigné"}</span>
                <span className="font-tech-unit text-tech-unit font-medium text-secondary">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </span>
              </div>
            </div>
          ))}
      </div>
      <button
        className="flex h-9 items-center justify-center gap-space-xs rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface hover:bg-surface-container"
        onClick={() => navigate("/tickets")}
        type="button">
        Open Ticket Center{" "}
        <span className="material-symbols-outlined text-[16px]">
          open_in_new
        </span>
      </button>
    </section>
  );
}

function DashboardWidgets() {
  return (
    <div className="flex flex-col gap-space-md">
      <MaintenanceWidget />
      <TicketsWidget />
      <section className="flex flex-col gap-space-xs rounded-xl bg-primary-container p-space-md text-surface-bright shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-secondary-fixed">
            Reference Specs
          </span>
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
            menu_book
          </span>
        </div>
        <div className="mt-space-2xs font-headline-sm text-headline-sm">
          NF C 15-100 Table 52J
        </div>
        <p className="font-body-sm text-body-sm text-on-primary-container">
          Maximum operating ambient: 40°C • Derating factor f1 = 0.91 applied
          globally for copper XLPE conductors.
        </p>
      </section>
    </div>
  );
}

export default DashboardWidgets;
