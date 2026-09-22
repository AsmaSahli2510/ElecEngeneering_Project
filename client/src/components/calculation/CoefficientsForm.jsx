import { COEFFICIENT_BOUNDS } from "../../domain/calculation/referenceData.js";
import { toNumber } from "../../domain/calculation/formulas.js";
import { formatNumber } from "../../lib/format.js";
import FormCard from "./FormCard.jsx";
import { InfoNote, NumberField, SelectField } from "../ui/fields.jsx";

const COEFFICIENTS = [
  { key: "k3", name: "K3", meaning: "Température ambiante" },
  { key: "k4", name: "K4", meaning: "Groupement de circuits" },
  { key: "k5", name: "K5", meaning: "Installation particulière" },
];

const MODE_OPTIONS = [
  { value: "auto", label: "Tables de référence (automatique)" },
  { value: "manual", label: "Saisie contrôlée" },
];

// Formulaire 5 — Coefficients K3, K4 et K5
// `resolved` provient du moteur (tables de référence appliquées aux conditions du formulaire 4).
// En saisie contrôlée, les valeurs des tables restent affichées à titre de comparaison.
function CoefficientsForm({ values, errors, issues, onChange, resolved, onApplyReference }) {
  const manual = values.mode === "manual";
  const reference = resolved?.reference;
  const referenceComplete = reference && COEFFICIENTS.every(({ key }) => reference[key].value !== null);

  const displayed = (key) => (manual ? toNumber(values[key]) : (resolved?.[key] ?? null));
  const total = manual ? COEFFICIENTS.reduce((product, { key }) => product * toNumber(values[key]), 1) : (resolved?.k ?? null);

  return (
    <FormCard
      errors={errors}
      icon="tune"
      id="coefficients"
      issues={issues}
      number="5"
      subtitle="K = K3 × K4 × K5 ; Iz = Iz_table × K"
      title="Coefficients K3, K4 et K5">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <SelectField
          className="md:col-span-6"
          error={errors.mode}
          label="Détermination des coefficients"
          onChange={(value) => onChange("mode", value)}
          options={MODE_OPTIONS}
          value={values.mode}
        />
        {manual && (
          <div className="flex items-end md:col-span-6">
            <button
              className="flex h-10 items-center gap-space-xs rounded-lg bg-surface-container px-space-md font-body-sm text-body-sm font-bold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!referenceComplete}
              onClick={onApplyReference}
              title={referenceComplete ? undefined : "Les tables ne fournissent pas toutes les valeurs pour ces conditions"}
              type="button">
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              Appliquer les valeurs des tables
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {COEFFICIENTS.map(({ key, name, meaning }) => {
          const factor = reference?.[key];
          return (
            <div className="space-y-space-xs rounded-lg bg-surface-container-low p-space-md" data-coefficient={key} key={key}>
              <div className="flex items-baseline justify-between">
                <span className="font-tech-data-md text-tech-data-md font-bold text-secondary">{name}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{meaning}</span>
              </div>
              {manual ? (
                <NumberField
                  error={errors[key]}
                  label={`${name} (${COEFFICIENT_BOUNDS.min} – ${COEFFICIENT_BOUNDS.max})`}
                  max={COEFFICIENT_BOUNDS.max}
                  min={COEFFICIENT_BOUNDS.min}
                  onChange={(value) => onChange(key, value)}
                  step="0.01"
                  value={values[key]}
                />
              ) : (
                <div className="font-tech-data-xl text-tech-data-xl font-bold text-on-surface" data-testid={`value-${key}`}>
                  {formatNumber(displayed(key), 2)}
                </div>
              )}
              {factor && (
                <p className="font-tech-unit text-tech-unit text-on-surface-variant">
                  {factor.value !== null ? (
                    <>
                      Table : <strong>{formatNumber(factor.value, 2)}</strong> — {factor.source}
                    </>
                  ) : (
                    factor.reason
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <InfoNote tone={total !== null && Number.isFinite(total) ? "ok" : "neutral"}>
        <span className="font-body-sm text-body-sm font-semibold">K = K3 × K4 × K5 = </span>
        <strong className="font-tech-data-lg text-tech-data-lg" data-testid="k-total">
          {Number.isFinite(total) ? formatNumber(total, 2) : "—"}
        </strong>
      </InfoNote>
      <p className="font-tech-unit text-tech-unit text-on-surface-variant">
        Les valeurs des tables sont des valeurs de prototype, à remplacer par les tables de référence du projet
        (voir <code>domain/calculation/referenceData.js</code>).
      </p>
    </FormCard>
  );
}

export default CoefficientsForm;
