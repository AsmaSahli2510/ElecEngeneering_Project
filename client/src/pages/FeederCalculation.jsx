import { Link, useNavigate, useParams } from "react-router-dom";
import CableForm from "../components/calculation/CableForm.jsx";
import CircuitForm from "../components/calculation/CircuitForm.jsx";
import CoefficientsForm from "../components/calculation/CoefficientsForm.jsx";
import InstallationForm from "../components/calculation/InstallationForm.jsx";
import LoadForm from "../components/calculation/LoadForm.jsx";
import ResultSummary from "../components/calculation/ResultSummary.jsx";
import UpstreamShortCircuitForm from "../components/calculation/UpstreamShortCircuitForm.jsx";
import UpstreamVoltageDropForm from "../components/calculation/UpstreamVoltageDropForm.jsx";
import { FEEDER_STATUS_LABELS } from "../domain/calculation/constants.js";
import { loadedConductorCount, designCurrent as computeDesignCurrent } from "../domain/calculation/formulas.js";
import { prototypeReferenceProvider } from "../domain/calculation/index.js";
import { useFeederCalculation } from "../hooks/useFeederCalculation.js";
import { formatNumber } from "../lib/format.js";

// Page de calcul d'un départ : 7 formulaires indépendants + synthèse.
// Le câble fait partie du calcul du départ (formulaire 3) : il n'existe pas de page « Câbles » séparée.
const provider = prototypeReferenceProvider;

function jumpToForm(key) {
  const element = document.getElementById(`form-${key}`);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
  element?.querySelector("input, select")?.focus({ preventScroll: true });
}

function FeederCalculation() {
  const { projectId, cabinetId, feederId } = useParams();
  const navigate = useNavigate();
  const { status, feeder, cabinet, project, error, inputs, outcome, setFields, save, saving, saveError, isSaved } =
    useFeederCalculation(feederId);
  const cabinetPath = `/projects/${projectId}/cabinets/${cabinetId}/feeders`;
  // Après l'enregistrement, retour automatique sur la page de l'armoire (liste des départs).
  const saveAndReturn = async () => {
    if (await save()) navigate(cabinetPath, { state: { saved: feeder.reference } });
  };

  if (status === "loading") {
    return <p className="p-space-xl font-body-md text-on-surface-variant">Chargement du départ…</p>;
  }
  if (status === "error") {
    return (
      <div className="space-y-space-md p-space-xl">
        <p className="rounded-lg bg-error-container p-space-md font-body-md text-on-error-container" role="alert">
          Impossible de charger le départ : {error}
        </p>
        <Link className="font-body-md font-semibold text-secondary hover:underline" to={cabinetPath}>
          ← Retour à l'armoire
        </Link>
      </div>
    );
  }

  const { errors, issues } = outcome;
  const issuesFor = (key) => issues.filter((issue) => issue.form === key);
  const setter = (formKey) => (field, value) => setFields(formKey, { [field]: value });

  const normalized = outcome.inputs;
  const circuitAndLoadValid = Object.keys(errors.circuit).length === 0 && Object.keys(errors.load).length === 0;
  const currentText = circuitAndLoadValid
    ? `${formatNumber(
        computeDesignCurrent({ ...normalized.load, nominalVoltage: normalized.circuit.nominalVoltage, circuitType: normalized.circuit.circuitType }),
        1,
      )} A`
    : null;

  const loadedConductors = loadedConductorCount(normalized.circuit.circuitType ?? inputs.circuit.circuitType);
  const sections = outcome.table ? outcome.table.rows.map((row) => row.section) : provider.listSections();
  const applyReference = () => {
    const { reference } = outcome.coefficients;
    setFields("coefficients", { k3: reference.k3.value, k4: reference.k4.value, k5: reference.k5.value });
  };

  return (
    <div className="flex w-full flex-col gap-space-lg pb-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        <span>Projet {project.reference}</span>
        <span>›</span>
        <Link className="font-medium text-secondary hover:underline" to={cabinetPath}>
          Armoire {cabinet.reference}
        </Link>
        <span>›</span>
        <Link className="font-medium text-secondary hover:underline" to={cabinetPath}>
          Départs
        </Link>
        <span>›</span>
        <strong className="text-on-surface">{feeder.reference}</strong>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <div className="mb-space-xs flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Étape 03 • Calcul du départ
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
            Calcul du départ {feeder.reference} — {feeder.designation}
          </h1>
          <p className="mt-space-2xs max-w-3xl font-body-md text-body-md text-on-surface-variant">
            Sept formulaires indépendants, préremplis depuis l'armoire et le départ. Le résultat se met à jour à chaque modification.
          </p>
        </div>
        <Link
          className="flex items-center gap-space-xs rounded-lg bg-surface-container-low px-space-md py-space-sm font-tech-unit text-tech-unit text-on-surface-variant hover:bg-surface-container"
          to={cabinetPath}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Départs de l'armoire
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
        <span className="rounded bg-secondary px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold text-on-secondary">{feeder.reference}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{feeder.designation}</span>
        <span className="text-outline-variant">•</span>
        <span className="font-tech-unit text-tech-unit text-on-surface-variant">
          {cabinet.powerSupplyPoint} / {cabinet.reference} / {inputs.circuit.nominalVoltage} V / {inputs.circuit.neutralSystem}
        </span>
        <span className="ml-auto rounded bg-secondary-fixed px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold text-on-secondary-fixed">
          {isSaved ? "Calcul enregistré" : (FEEDER_STATUS_LABELS[feeder.status] ?? "À calculer")}
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex flex-col gap-space-lg xl:col-span-8" data-testid="calculation-forms">
          <CircuitForm cabinetReference={cabinet.reference} errors={errors.circuit} issues={issuesFor("circuit")} onChange={setter("circuit")} values={inputs.circuit} />
          <LoadForm
            circuitType={inputs.circuit.circuitType}
            designCurrent={currentText}
            errors={errors.load}
            feederReference={feeder.reference}
            issues={issuesFor("load")}
            onChange={setter("load")}
            values={inputs.load}
          />
          <CableForm
            errors={errors.cable}
            installationMethods={provider.listInstallationMethods()}
            issues={issuesFor("cable")}
            loadedConductors={loadedConductors}
            onChange={setter("cable")}
            sections={sections}
            table={outcome.table}
            values={inputs.cable}
          />
          <InstallationForm errors={errors.installation} issues={issuesFor("installation")} onChange={setter("installation")} values={inputs.installation} />
          <CoefficientsForm
            errors={errors.coefficients}
            issues={issuesFor("coefficients")}
            onApplyReference={applyReference}
            onChange={setter("coefficients")}
            resolved={outcome.coefficients}
            values={inputs.coefficients}
          />
          <UpstreamVoltageDropForm
            errors={errors.upstreamVoltageDrop}
            feederDropPercent={outcome.result?.voltageDrop.feederPercent ?? null}
            issues={issuesFor("upstreamVoltageDrop")}
            maxVoltageDrop={inputs.load.maxVoltageDrop}
            maxVoltageDropError={errors.load.maxVoltageDrop}
            nominalVoltage={inputs.circuit.nominalVoltage}
            onChange={setter("upstreamVoltageDrop")}
            onChangeMax={(value) => setFields("load", { maxVoltageDrop: value })}
            values={inputs.upstreamVoltageDrop}
          />
          <UpstreamShortCircuitForm
            errors={errors.upstreamShortCircuit}
            issues={issuesFor("upstreamShortCircuit")}
            onChange={setter("upstreamShortCircuit")}
            values={inputs.upstreamShortCircuit}
          />
        </div>
        <ResultSummary
          backPath={cabinetPath}
          feeder={feeder}
          isSaved={isSaved}
          onJumpToForm={jumpToForm}
          onSave={saveAndReturn}
          outcome={outcome}
          saveError={saveError}
          saving={saving}
        />
      </div>
    </div>
  );
}

export default FeederCalculation;
