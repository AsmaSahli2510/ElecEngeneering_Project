import { AUTO_SECTION, CONDUCTOR_MATERIALS, INSULATION_TYPES } from "../../domain/calculation/constants.js";
import { formatSection } from "../../lib/format.js";
import FormCard from "./FormCard.jsx";
import { InfoNote, NumberField, SelectField } from "../ui/fields.jsx";

// Formulaire 3 — Câble et mode de pose
// `installationMethods` et `table` viennent du fournisseur de référence : le formulaire ne connaît aucune valeur de table.
function CableForm({ values, errors, issues, onChange, installationMethods, sections, table, loadedConductors }) {
  const sectionOptions = [
    { value: AUTO_SECTION, label: "Automatique" },
    ...sections.map((section) => ({ value: String(section), label: formatSection(section) })),
  ];
  return (
    <FormCard
      errors={errors}
      icon="cable"
      id="cable"
      issues={issues}
      number="3"
      subtitle="Le câble fait partie du calcul du départ : sa section découle de Iz ≥ Ib"
      title="Câble et mode de pose">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <SelectField
          className="md:col-span-4"
          error={errors.material}
          label="Matériau du conducteur"
          onChange={(value) => onChange("material", value)}
          options={CONDUCTOR_MATERIALS}
          value={values.material}
        />
        <SelectField
          className="md:col-span-4"
          error={errors.insulation}
          label="Type d'isolant"
          onChange={(value) => onChange("insulation", value)}
          options={INSULATION_TYPES}
          value={values.insulation}
        />
        <NumberField
          className="md:col-span-4"
          error={errors.conductorCount}
          hint={`${loadedConductors} conducteurs chargés retenus pour la table Iz`}
          label="Nombre de conducteurs"
          max="5"
          min="1"
          onChange={(value) => onChange("conductorCount", value)}
          step="1"
          value={values.conductorCount}
        />
        <SelectField
          className="md:col-span-6"
          error={errors.installationMethod}
          hint={installationMethods.find((method) => method.label === values.installationMethod)?.description}
          label="Mode de pose"
          onChange={(value) => onChange("installationMethod", value)}
          options={installationMethods.map((method) => method.label)}
          value={values.installationMethod}
        />
        <SelectField
          className="md:col-span-6"
          error={errors.section}
          hint="Automatique : plus petite section vérifiant Iz ≥ Ib et ΔU"
          label="Section"
          onChange={(value) => onChange("section", value)}
          options={sectionOptions}
          value={String(values.section)}
        />
      </div>
      {table ? (
        <InfoNote>
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-secondary">table_chart</span>
            <strong className="font-tech-data-md text-tech-data-md text-on-surface">Table Iz : {table.id}</strong>
            {table.status === "prototype" && (
              <span className="rounded bg-surface-container px-space-xs py-space-2xs font-tech-unit text-tech-unit font-bold text-on-surface">
                Valeurs de prototype
              </span>
            )}
          </div>
          <p className="mt-space-2xs">{table.source}</p>
        </InfoNote>
      ) : null}
    </FormCard>
  );
}

export default CableForm;
