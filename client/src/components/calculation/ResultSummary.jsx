import { Link } from "react-router-dom";
import { CALCULATION_STATUS, CALCULATION_STATUS_LABELS, CHECK_STATUS, CHECK_STATUS_LABELS } from "../../domain/calculation/constants.js";
import { formatNumber, formatSection } from "../../lib/format.js";
import { FORM_LABELS } from "./formLabels.js";

function ResultLine({ label, value, sub, testId }) {
  return (
    <div className="flex items-start justify-between gap-space-md border-b border-on-primary-container/20 py-space-xs font-body-sm text-body-sm text-on-primary-container">
      <span>{label}</span>
      <span className="text-right">
        <strong className="text-surface-bright" data-testid={testId}>
          {value}
        </strong>
        {sub && <span className="block font-tech-unit text-tech-unit text-on-primary-container">{sub}</span>}
      </span>
    </div>
  );
}

function CheckLine({ label, status, testId }) {
  const compliant = status === CHECK_STATUS.COMPLIANT;
  return (
    <div className="flex items-center justify-between gap-space-md border-b border-on-primary-container/20 py-space-xs font-body-sm text-body-sm text-on-primary-container">
      <span>{label}</span>
      <span
        className={`flex items-center gap-space-2xs rounded px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold ${compliant ? "bg-secondary text-on-secondary" : "bg-error-container text-on-error-container"}`}
        data-testid={testId}>
        <span className="material-symbols-outlined text-[14px]">{compliant ? "check_circle" : "cancel"}</span>
        {CHECK_STATUS_LABELS[status]}
      </span>
    </div>
  );
}

function IncompleteNotice({ outcome, onJumpToForm }) {
  const formKeys = Object.keys(FORM_LABELS);
  const problems = formKeys
    .map((key) => ({
      key,
      count: Object.keys(outcome.errors[key] ?? {}).length,
      issues: outcome.issues.filter((issue) => issue.form === key),
    }))
    .filter((problem) => problem.count > 0 || problem.issues.length > 0);

  return (
    <div className="space-y-space-sm rounded-lg bg-tertiary-container p-space-md" data-testid="incomplete-notice">
      <div className="flex items-center gap-space-xs font-body-sm text-body-sm font-bold text-surface-bright">
        <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">info</span>
        Calcul incomplet
      </div>
      <p className="font-body-sm text-body-sm text-on-primary-container">Corrigez les formulaires suivants pour obtenir le résultat :</p>
      <ul className="space-y-space-xs">
        {problems.map((problem) => (
          <li key={problem.key}>
            <button
              className="text-left font-body-sm text-body-sm text-tertiary-fixed underline hover:text-surface-bright"
              onClick={() => onJumpToForm(problem.key)}
              type="button">
              {FORM_LABELS[problem.key]}
              {problem.count > 0 && ` — ${problem.count} champ${problem.count > 1 ? "s" : ""} à corriger`}
              {problem.issues.length > 0 && " — bloqué"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Synthèse du calcul : résultat en direct + enregistrement + retour à l'armoire.
function ResultSummary({ feeder, outcome, isSaved, saving, saveError, onSave, onJumpToForm, backPath }) {
  const { result } = outcome;
  const validated = result?.globalStatus === CALCULATION_STATUS.VALIDATED;
  const sectionRaisedForDrop = result && result.cable.thermalSection !== null && result.cable.thermalSection !== result.cable.recommendedSection && result.cable.limitingCriterion === "voltageDrop";

  return (
    <aside
      aria-label="Résultat du calcul"
      className="space-y-space-md rounded-xl bg-primary-container p-space-lg text-surface-bright shadow-xl xl:sticky xl:top-20 xl:col-span-4"
      data-testid="result-summary">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-secondary-fixed">Résultat en direct</span>
          <h2 className="mt-space-xs font-headline-sm text-headline-sm font-bold">
            {feeder.reference} — {feeder.designation}
          </h2>
        </div>
        <span className="material-symbols-outlined text-[24px] text-tertiary-fixed">analytics</span>
      </div>

      {!outcome.ready ? (
        <IncompleteNotice onJumpToForm={onJumpToForm} outcome={outcome} />
      ) : (
        <>
          <div className="rounded-lg bg-tertiary-container p-space-md">
            <span className="font-body-sm text-on-primary-container">Courant d'emploi Ib</span>
            <div className="font-tech-data-xl text-tech-data-xl font-bold text-surface-bright" data-testid="result-ib">
              {formatNumber(result.designCurrent, 1)} A
            </div>
          </div>
          <div className="space-y-space-2xs">
            <ResultLine
              label="Section recommandée"
              sub={sectionRaisedForDrop ? `${formatSection(result.cable.thermalSection)} thermique, relevée pour ΔU` : undefined}
              testId="result-section"
              value={formatSection(result.cable.recommendedSection)}
            />
            <ResultLine label="Conducteur" value={result.cable.material} />
            <ResultLine label="Isolation" value={result.cable.insulation} />
            <ResultLine label="Mode de pose" value={result.cable.installationMethod} />
            <ResultLine
              label="Courant admissible corrigé Iz"
              sub={`${formatNumber(result.cable.currentCapacityTable, 1)} A × K ${formatNumber(result.coefficients.k, 2)}`}
              testId="result-iz"
              value={`${formatNumber(result.cable.correctedCurrentCapacity, 1)} A`}
            />
            <ResultLine
              label="Chute de tension"
              sub={`${formatNumber(result.voltageDrop.feederVolts, 2)} V`}
              testId="result-du"
              value={`${formatNumber(result.voltageDrop.feederPercent, 2)} %`}
            />
            <ResultLine
              label="Limite admissible (ΔU disponible)"
              sub={`${formatNumber(result.voltageDrop.maxPercent, 2)} % − ${formatNumber(result.voltageDrop.upstreamPercent, 2)} % amont`}
              testId="result-du-limit"
              value={`${formatNumber(result.voltageDrop.availablePercent, 2)} %`}
            />
            <ResultLine label="Icc amont" value={`${formatNumber(result.shortCircuit.iccKa, 1)} kA`} />
            <ResultLine label="Pouvoir de coupure" value={`${formatNumber(result.shortCircuit.breakingCapacityKa, 1)} kA`} />
            <CheckLine label="Conformité thermique (Iz ≥ Ib)" status={result.checks.thermal} testId="check-thermal" />
            <CheckLine label="Conformité chute de tension" status={result.checks.voltageDrop} testId="check-voltage-drop" />
            <CheckLine label="Conformité pouvoir de coupure" status={result.checks.breakingCapacity} testId="check-breaking" />
          </div>
          <div
            className={`flex items-center gap-space-xs rounded-lg px-space-md py-space-sm font-body-sm font-bold ${validated ? "bg-secondary text-on-secondary" : "bg-error-container text-on-error-container"}`}
            data-testid="result-global-status">
            <span className="material-symbols-outlined text-[18px]">{validated ? "check_circle" : "cancel"}</span>
            Statut global : {CALCULATION_STATUS_LABELS[result.globalStatus]}
            {validated && " ✓"}
          </div>
        </>
      )}

      {saveError && (
        <p className="rounded-lg bg-error-container p-space-sm font-body-sm text-body-sm text-on-error-container" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex flex-col gap-space-sm pt-space-sm">
        {isSaved ? (
          <>
            <div className="flex items-center justify-center gap-space-xs rounded-lg bg-surface-bright/10 px-space-lg py-space-sm font-body-sm font-bold text-tertiary-fixed" data-testid="saved-notice">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              Calcul enregistré
            </div>
            <Link
              className="flex h-10 items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-lg font-headline-sm text-headline-sm font-bold text-on-secondary hover:bg-secondary-container"
              data-testid="back-to-cabinet"
              to={backPath}>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Retour à l'armoire
            </Link>
          </>
        ) : (
          <button
            className="flex h-10 items-center justify-center gap-space-xs rounded-lg bg-secondary px-space-lg font-headline-sm text-headline-sm font-bold text-on-secondary hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="save-calculation"
            disabled={!outcome.ready || saving}
            onClick={onSave}
            type="button">
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Enregistrement..." : "Enregistrer le calcul"}
          </button>
        )}
      </div>
    </aside>
  );
}

export default ResultSummary;
