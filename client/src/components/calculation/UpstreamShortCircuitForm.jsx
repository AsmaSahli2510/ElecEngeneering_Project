import { toNumber } from "../../domain/calculation/formulas.js";
import { formatNumber } from "../../lib/format.js";
import FormCard from "./FormCard.jsx";
import { InfoNote, NumberField } from "../ui/fields.jsx";

// Formulaire 7 — Icc amont : vérification du pouvoir de coupure (Icu ≥ Icc)
function UpstreamShortCircuitForm({ values, errors, issues, onChange }) {
  const icc = toNumber(values.iccKa);
  const icu = toNumber(values.breakingCapacityKa);
  const verdict = Number.isFinite(icc) && Number.isFinite(icu) ? icu >= icc : null;

  return (
    <FormCard
      errors={errors}
      icon="flash_on"
      id="upstreamShortCircuit"
      issues={issues}
      number="7"
      subtitle="Le pouvoir de coupure de la protection doit être au moins égal à l'Icc amont"
      title="Icc amont — Vérification du pouvoir de coupure">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <NumberField
          className="md:col-span-6"
          error={errors.iccKa}
          label="Icc amont"
          min="0"
          onChange={(value) => onChange("iccKa", value)}
          unit="kA"
          value={values.iccKa}
        />
        <NumberField
          className="md:col-span-6"
          error={errors.breakingCapacityKa}
          label="Pouvoir de coupure de la protection (Icu)"
          min="0"
          onChange={(value) => onChange("breakingCapacityKa", value)}
          unit="kA"
          value={values.breakingCapacityKa}
        />
      </div>
      {verdict !== null && (
        <InfoNote tone={verdict ? "ok" : "error"}>
          <span className="flex items-center gap-space-xs font-semibold" data-testid="icu-verdict">
            <span className="material-symbols-outlined text-[18px]">{verdict ? "check_circle" : "cancel"}</span>
            Icu {formatNumber(icu, 1)} kA {verdict ? "≥" : "<"} Icc {formatNumber(icc, 1)} kA : {verdict ? "Conforme" : "Non conforme"}
          </span>
        </InfoNote>
      )}
    </FormCard>
  );
}

export default UpstreamShortCircuitForm;
