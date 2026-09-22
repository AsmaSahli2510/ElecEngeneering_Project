import { CIRCUIT_TYPES, NEUTRAL_SYSTEMS } from "../../domain/calculation/constants.js";
import FormCard from "./FormCard.jsx";
import { NumberField, SelectField } from "../ui/fields.jsx";

// Formulaire 1 — Circuit
function CircuitForm({ values, errors, issues, onChange, cabinetReference }) {
  return (
    <FormCard
      errors={errors}
      icon="electric_bolt"
      id="circuit"
      issues={issues}
      number="1"
      subtitle={`Tension et régime de neutre repris du départ et de l'armoire ${cabinetReference ?? ""}`.trim()}
      title="Circuit">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <NumberField
          className="md:col-span-4"
          error={errors.nominalVoltage}
          label="Tension nominale"
          min="0"
          onChange={(value) => onChange("nominalVoltage", value)}
          unit="V"
          value={values.nominalVoltage}
        />
        <SelectField
          className="md:col-span-4"
          error={errors.circuitType}
          label="Type de circuit"
          onChange={(value) => onChange("circuitType", value)}
          options={CIRCUIT_TYPES}
          value={values.circuitType}
        />
        <SelectField
          className="md:col-span-4"
          error={errors.neutralSystem}
          label="Régime de neutre"
          onChange={(value) => onChange("neutralSystem", value)}
          options={NEUTRAL_SYSTEMS}
          value={values.neutralSystem}
        />
      </div>
    </FormCard>
  );
}

export default CircuitForm;
