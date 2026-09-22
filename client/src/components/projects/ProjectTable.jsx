import ProjectRow from "./ProjectRow.jsx";

function ProjectTable({ projects }) {
  return (
    <div className="mb-space-lg flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="select-none bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="px-space-lg py-space-md font-semibold">
                Réf. Projet
              </th>
              <th className="min-w-[280px] px-space-lg py-space-md font-semibold">
                Intitulé du Projet & Domaine
              </th>
              <th className="min-w-[200px] px-space-lg py-space-md font-semibold">
                Client Donneur d'Ordre
              </th>
              <th className="min-w-[210px] px-space-lg py-space-md font-semibold">
                Armoire & Puissance
              </th>
              <th className="min-w-[190px] px-space-lg py-space-md font-semibold">
                Avancement Normatif
              </th>
              <th className="px-space-lg py-space-md font-semibold">Statut</th>
              <th className="px-space-lg py-space-md font-semibold">
                Ingénieur & Cible
              </th>
              <th className="px-space-lg py-space-md text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectRow key={project._id} project={project} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectTable;
