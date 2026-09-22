import { LinkButton } from "../ui/buttons.jsx";

// Barre d'action de bas de page : passer à l'étape suivante du cycle (ou dire pourquoi c'est impossible).
function NextStepBar({ hint, label, to, disabled, secondary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm print:hidden" data-testid="next-step-bar">
      <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>
      <div className="flex flex-wrap items-center gap-space-sm">
        {secondary}
        <LinkButton data-testid="next-step" disabled={disabled} iconAfter="arrow_forward" to={to}>
          {label}
        </LinkButton>
      </div>
    </div>
  );
}

export default NextStepBar;
