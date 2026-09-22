import { VOLTAGE_DROP_UNITS } from "../../domain/calculation/constants.js";
import { availableVoltageDrop, toNumber, upstreamDropToPercent } from "../../domain/calculation/formulas.js";
import { formatNumber } from "../../lib/format.js";
import FormCard from "./FormCard.jsx";
import { InfoNote, NumberField, SelectField } from "../ui/fields.jsx";

// Formulaire 6 — ΔU amont : chute de tension réseau
// La ΔU maximale admissible est la même donnée que dans le formulaire 2 : modifiée ici ou là, elle reste unique.
function UpstreamVoltageDropForm({ values, errors, issues, onChange, maxVoltageDrop, maxVoltageDropError, onChangeMax, nominalVoltage, feederDropPercent }) {
  const upstream = toNumber(values.value);
  const max = toNumber(maxVoltageDrop);
  const voltage = toNumber(nominalVoltage);
  const canCompute = Number.isFinite(upstream) && Number.isFinite(max) && (values.unit === "%" || voltage > 0);
  const upstreamPercent = canCompute ? upstreamDropToPercent({ value: upstream, unit: values.unit, nominalVoltage: voltage }) : null;
  const available = canCompute ? availableVoltageDrop(max, upstreamPercent) : null;
  const conform = feederDropPercent !== null && available !== null ? feederDropPercent <= available : null;

  return (
    <FormCard
      errors={errors}
      icon="trending_down"
      id="upstreamVoltageDrop"
      issues={issues}
      number="6"
      subtitle="ΔU disponible = ΔU maximale − ΔU amont"
      title="ΔU amont — Chute de tension réseau">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <NumberField
          className="md:col-span-4"
          error={errors.value}
          label="ΔU amont"
          min="0"
          onChange={(value) => onChange("value", value)}
          value={values.value}
        />
        <SelectField
          className="md:col-span-4"
          error={errors.unit}
          label="Unité"
          onChange={(value) => onChange("unit", value)}
          options={VOLTAGE_DROP_UNITS}
          value={values.unit}
        />
        <NumberField
          className="md:col-span-4"
          error={maxVoltageDropError}
          hint="Partagée avec le formulaire 2"
          label="ΔU maximale admissible"
          max="100"
          min="0"
          onChange={onChangeMax}
          unit="%"
          value={maxVoltageDrop}
        />
      </div>
      <InfoNote tone={available !== null && available <= 0 ? "error" : "neutral"}>
        ΔU disponible = {formatNumber(max, 2)} % − {formatNumber(upstreamPercent, 2)} % ={" "}
        <strong className="font-tech-data-md text-tech-data-md text-secondary" data-testid="du-available">
          {formatNumber(available, 2)} %
        </strong>
        {conform !== null && (
          <>
            {" "}• ΔU du départ <strong className="font-tech-data-md">{formatNumber(feederDropPercent, 2)} %</strong>{" "}
            {conform ? "≤" : ">"} ΔU disponible : <strong>{conform ? "Conforme" : "Non conforme"}</strong>
          </>
        )}
      </InfoNote>
    </FormCard>
  );
}

export default UpstreamVoltageDropForm;
