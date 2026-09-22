import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { computeWorkflow, STEP_ICONS, STEP_LABELS, STEP_ORDER, STEP_STATUS } from "../../domain/lifecycle/workflow.js";

// Stepper du cycle complet (15 étapes), alimenté par la vue agrégée du projet.
// Sans projet (page de création), il affiche le cycle à venir sans liens.
const STATUS_TEXT = {
  [STEP_STATUS.DONE]: "Terminé",
  [STEP_STATUS.IN_PROGRESS]: "En cours",
  [STEP_STATUS.NOT_STARTED]: "Non commencé",
  [STEP_STATUS.BLOCKED]: "Bloqué",
};

const STATUS_ICON = {
  [STEP_STATUS.DONE]: "check_circle",
  [STEP_STATUS.IN_PROGRESS]: "pending",
  [STEP_STATUS.NOT_STARTED]: "radio_button_unchecked",
  [STEP_STATUS.BLOCKED]: "lock",
};

const TONE = {
  [STEP_STATUS.DONE]: "bg-secondary-fixed text-on-secondary-fixed",
  [STEP_STATUS.IN_PROGRESS]: "bg-surface-container-high text-secondary",
  [STEP_STATUS.NOT_STARTED]: "bg-surface-container-low text-on-surface",
  [STEP_STATUS.BLOCKED]: "bg-surface-container-low text-on-surface-variant opacity-70",
};

function previewSteps() {
  return STEP_ORDER.map((key, index) => ({
    key,
    label: STEP_LABELS[key],
    icon: STEP_ICONS[key],
    path: null,
    status: index === 0 ? STEP_STATUS.IN_PROGRESS : STEP_STATUS.BLOCKED,
    reason: index === 0 ? "" : "Créez d'abord le projet",
    issue: false,
  }));
}

// `current` : clé de l'étape affichée (mise en évidence). `overview` : vue agrégée (ou null : aperçu).
function NewProjectStepper({ current, overview }) {
  const workflow = overview?.project ? computeWorkflow(overview) : null;
  const steps = workflow?.steps ?? previewSteps();
  const doneCount = steps.filter((step) => step.status === STEP_STATUS.DONE).length;
  const listRef = useRef(null);

  // Le stepper défile horizontalement : l'étape affichée est ramenée dans le champ de vision.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current, overview]);

  return (
    <section className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm print:hidden" data-testid="workflow-stepper">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Cycle de vie de l'armoire
        </span>
        <span className="flex items-center gap-space-xs font-tech-unit text-tech-unit font-bold text-secondary">
          {workflow?.next ? (
            <>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              Prochaine étape : {workflow.next.label}
            </>
          ) : workflow ? (
            <>
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              Cycle complet
            </>
          ) : (
            "Créez le projet pour démarrer le cycle"
          )}
          <span className="ml-space-sm rounded bg-surface-container px-space-xs py-space-2xs text-on-surface">
            {doneCount} / {steps.length}
          </span>
        </span>
      </div>
      <ol className="flex gap-space-xs overflow-x-auto pb-space-xs" ref={listRef}>
        {steps.map((step, index) => {
          const isCurrent = step.key === current;
          const clickable = step.path && step.status !== STEP_STATUS.BLOCKED;
          const body = (
            <>
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-label-caps text-label-caps font-bold">{String(index + 1).padStart(2, "0")}</span>
                <span className="material-symbols-outlined text-[16px]">{STATUS_ICON[step.status]}</span>
              </div>
              <span className="mt-space-2xs flex items-center gap-space-2xs truncate font-body-sm text-body-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                {step.label}
              </span>
              <span className={`truncate font-tech-unit text-tech-unit ${step.issue ? "font-bold text-error" : ""}`}>
                {step.issue && step.reason ? step.reason : STATUS_TEXT[step.status]}
              </span>
            </>
          );
          const classes = `flex w-40 shrink-0 flex-col rounded-lg p-space-xs ${TONE[step.status]} ${isCurrent ? "ring-2 ring-secondary" : ""} ${step.issue ? "outline outline-1 outline-error" : ""}`;
          const title = step.reason || undefined;
          return (
            <li key={step.key}>
              {clickable ? (
                <Link aria-current={isCurrent ? "step" : undefined} className={`${classes} hover:brightness-95`} data-step={step.key} data-status={step.status} title={title} to={step.path}>
                  {body}
                </Link>
              ) : (
                <div aria-current={isCurrent ? "step" : undefined} className={classes} data-step={step.key} data-status={step.status} title={title}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default NewProjectStepper;
