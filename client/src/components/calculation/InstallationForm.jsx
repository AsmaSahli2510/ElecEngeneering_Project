import FormCard from "./FormCard.jsx";
import { NumberField, SelectField } from "../ui/fields.jsx";

// Formulaire 4 — Conditions d'installation
// Ces paramètres alimentent la recherche des coefficients K3, K4 et K5 (formulaire 5).
function InstallationForm({ values, errors, issues, onChange }) {
  return (
    <FormCard
      errors={errors}
      icon="foundation"
      id="installation"
      issues={issues}
      number="4"
      subtitle="Utilisées pour déterminer les coefficients de correction"
      title="Conditions d'installation">
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
        <NumberField
          className="md:col-span-4"
          error={errors.ambientTemperature}
          label="Température ambiante"
          onChange={(value) => onChange("ambientTemperature", value)}
          unit="°C"
          value={values.ambientTemperature}
        />
        <NumberField
          className="md:col-span-4"
          error={errors.groupedCircuits}
          label="Nombre de circuits groupés"
          min="1"
          onChange={(value) => onChange("groupedCircuits", value)}
          step="1"
          value={values.groupedCircuits}
        />
        <SelectField
          className="md:col-span-4"
          error={errors.specialInstallation}
          label="Installation particulière"
          onChange={(value) => onChange("specialInstallation", value === "Oui")}
          options={["Non", "Oui"]}
          value={values.specialInstallation ? "Oui" : "Non"}
        />
      </div>
    </FormCard>
  );
}

export default InstallationForm;
