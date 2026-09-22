import { LOAD_TYPES, POWER_UNITS } from "../../domain/calculation/constants.js";
import FormCard from "./FormCard.jsx";
import { NumberField, SelectField } from "../ui/fields.jsx";

function currentFormula({ powerUnit }, circuitType) {
  const voltage = circuitType === "Monophasé" ? "U" : "√3 × U";
  return powerUnit === "kVA" ? `Ib = S / (${voltage})` : `Ib = P / (${voltage} × cos φ × η)`;
}

// Formulaire 2 — Puissance et charge
function LoadForm({ values, errors, issues, onChange, designCurrent, circuitType, feederReference }) {
  const unitIsApparent = values.powerUnit === "kVA";
  return (
    <FormCard
      errors={errors}
      icon="bolt"
      id="load"
      issues={issues}
      number="2"
      subtitle={`Puissance, type de charge et longueur repris du départ ${feederReference ?? ""}`.trim()}
      title="Puissance et charge">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <NumberField
          className="md:col-span-3"
          error={errors.power}
          label="Puissance"
          min="0"
          onChange={(value) => onChange("power", value)}
          value={values.power}
        />
        <SelectField
          className="md:col-span-3"
          error={errors.powerUnit}
          label="Unité"
          onChange={(value) => onChange("powerUnit", value)}
          options={POWER_UNITS}
          value={values.powerUnit}
        />
        <SelectField
          className="md:col-span-6"
          error={errors.loadType}
          label="Type de charge"
          onChange={(value) => onChange("loadType", value)}
          options={LOAD_TYPES}
          value={values.loadType}
        />
        <NumberField
          className="md:col-span-3"
          error={errors.powerFactor}
          hint={unitIsApparent ? "Utilisé pour ΔU uniquement" : undefined}
          label="cos φ"
          max="1"
          min="0"
          onChange={(value) => onChange("powerFactor", value)}
          step="0.01"
          value={values.powerFactor}
        />
        <NumberField
          className="md:col-span-3"
          error={errors.efficiency}
          hint={unitIsApparent ? "Non utilisé pour une puissance en kVA" : undefined}
          label="Rendement η"
          max="1"
          min="0"
          onChange={(value) => onChange("efficiency", value)}
          step="0.01"
          value={values.efficiency}
        />
        <NumberField
          className="md:col-span-3"
          error={errors.cableLength}
          label="Longueur du câble"
          min="0"
          onChange={(value) => onChange("cableLength", value)}
          unit="m"
          value={values.cableLength}
        />
        <NumberField
          className="md:col-span-3"
          error={errors.maxVoltageDrop}
          hint="Partagée avec le formulaire 6"
          label="ΔU maximale admissible"
          max="100"
          min="0"
          onChange={(value) => onChange("maxVoltageDrop", value)}
          unit="%"
          value={values.maxVoltageDrop}
        />
      </div>
      <div className="flex flex-wrap items-center gap-space-sm rounded-lg bg-surface-container-low p-space-md font-body-sm text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">functions</span>
        <span>
          Courant d'emploi {currentFormula(values, circuitType)}
          {designCurrent !== null && designCurrent !== undefined && (
            <>
              {" "}=&nbsp;
              <strong className="font-tech-data-md text-tech-data-md text-secondary" data-testid="ib-inline">
                {designCurrent}
              </strong>
            </>
          )}
        </span>
      </div>
    </FormCard>
  );
}

export default LoadForm;
