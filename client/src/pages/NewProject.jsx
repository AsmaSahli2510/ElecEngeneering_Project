import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NewProjectStepper from "../components/projects/NewProjectStepper.jsx";
import ProjectContextCard from "../components/projects/ProjectContextCard.jsx";
import FormField, {
  formInputClass,
  formSelectClass,
} from "../components/ui/FormField.jsx";
import { api } from "../lib/api.js";

const initialProject = {
  name: "Extension atelier de production",
  reference: "PROJ-2026-001",
  client: "ABC Industrie",
  installationSite: "Usine Tunis",
  siteAddress: "Ben Arous, Tunis",
  description: "Alimentation d'une nouvelle ligne de production",
  creationDate: "2026-09-20",
  status: "active",
};

function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialProject);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const missing = [
      ["name", "le nom du projet"],
      ["reference", "la référence du projet"],
      ["client", "le client"],
      ["installationSite", "le site d'installation"],
    ].find(([field]) => !form[field].trim());
    if (missing) return setError(`Renseignez ${missing[1]}.`);
    setSaving(true);
    try {
      const project = await api.projects.create(form);
      navigate(`/projects/${project._id}/cabinet`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-space-lg pb-24">
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            <button
              className="font-medium text-secondary hover:underline"
              onClick={() => navigate("/projects")}
              type="button">
              Projets
            </button>
            <span className="mx-space-xs">/</span>
            <strong className="text-on-surface">Nouveau projet</strong>
          </div>
          <span className="rounded bg-surface-container-high px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold uppercase text-on-surface">
            Statut : Brouillon initial
          </span>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
            Créer un nouveau projet
          </h1>
          <p className="mt-space-2xs max-w-3xl font-body-md text-body-md text-on-surface-variant">
            Renseignez les informations générales du projet avant de configurer
            son armoire et ses départs.
          </p>
        </div>
        <NewProjectStepper current="project" />
      </div>
      <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        <form
          className="space-y-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-8 lg:p-space-xl"
          onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">
                  assignment
                </span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  1. Informations Générales du Projet
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Uniquement les données nécessaires au démarrage du projet
                </p>
              </div>
            </div>
            <span className="rounded bg-surface-container px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold text-secondary">
              Obligatoire
            </span>
          </div>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-12">
            <FormField className="md:col-span-8" label="Nom du projet" required>
              <input
                className={formInputClass}
                onChange={update("name")}
                value={form.name}
              />
            </FormField>
            <FormField
              className="md:col-span-4"
              label="Référence du projet"
              required>
              <input
                className={`${formInputClass} font-tech-data-md font-bold`}
                onChange={update("reference")}
                value={form.reference}
              />
            </FormField>
            <FormField className="md:col-span-6" label="Client" required>
              <input
                className={formInputClass}
                onChange={update("client")}
                value={form.client}
              />
            </FormField>
            <FormField
              className="md:col-span-6"
              label="Site d'installation"
              required>
              <input
                className={formInputClass}
                onChange={update("installationSite")}
                value={form.installationSite}
              />
            </FormField>
            <FormField className="md:col-span-12" label="Adresse du site">
              <input
                className={formInputClass}
                onChange={update("siteAddress")}
                value={form.siteAddress}
              />
            </FormField>
            <FormField className="md:col-span-6" label="Date de création">
              <input
                className={formInputClass}
                onChange={update("creationDate")}
                type="date"
                value={form.creationDate}
              />
            </FormField>
            <FormField className="md:col-span-6" label="Statut du projet">
              <select
                className={formSelectClass}
                onChange={update("status")}
                value={form.status}>
                <option value="draft">Brouillon</option>
                <option value="active">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </FormField>
            <FormField className="md:col-span-12" label="Description">
              <textarea
                className={`${formInputClass} h-auto py-space-md`}
                onChange={update("description")}
                rows="4"
                value={form.description}
              />
            </FormField>
          </div>
          {error && (
            <p className="rounded-lg bg-error-container p-space-md font-body-sm text-body-sm text-on-error-container">
              {error}
            </p>
          )}
          <div className="flex justify-end border-t border-surface-container-low pt-space-md">
            <button
              className="flex h-10 items-center gap-space-xs rounded-lg bg-secondary px-space-lg font-headline-sm text-headline-sm font-bold text-on-secondary hover:bg-secondary-container disabled:opacity-60"
              disabled={saving}
              type="submit">
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
              {saving
                ? "Création..."
                : "Créer le projet et configurer l’armoire"}
            </button>
          </div>
        </form>
        <div className="lg:col-span-4">
          <ProjectContextCard project={form} />
        </div>
      </div>
    </div>
  );
}

export default NewProject;
