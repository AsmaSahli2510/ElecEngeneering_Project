import SavedProjects from '../components/projects/SavedProjects.jsx'

// Les modules d'ingénierie (calcul câbles, bilan, nomenclature…) ne sont pas des applications séparées : ils font partie
// du cycle de vie d'un projet. Cette page redirige vers le projet concerné, où l'étape correspondante est disponible.
function ProjectPickerPage({ title, description }) {
  return (
    <div className="flex w-full flex-col gap-space-lg pb-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">{title}</h1>
        <p className="mt-space-2xs max-w-3xl font-body-md text-on-surface-variant">{description}</p>
      </div>
      <SavedProjects title="Choisir un projet" />
    </div>
  )
}

export default ProjectPickerPage
