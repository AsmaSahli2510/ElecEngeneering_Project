const FEATURES = [
  {
    icon: "bolt",
    title: "Calculs conformes IEC 60364",
    description: "Dimensionnement des départs, bilans de puissance et notes de calcul générés automatiquement.",
  },
  {
    icon: "request_quote",
    title: "Nomenclature & devis",
    description: "BOM et chiffrage produits à partir des calculs, prix catalogue fournisseur à jour.",
  },
  {
    icon: "qr_code_2",
    title: "Traçabilité des actifs",
    description: "QR code par armoire, garanties, plans de maintenance et tickets d'intervention centralisés.",
  },
];

// Bandeau de marque partagé par les pages Connexion/Inscription (40% de l'écran, masqué en mobile).
function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-primary-container px-space-2xl py-space-2xl lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-tertiary-container blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-space-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-[0_1px_8px_rgba(0,81,213,0.35)]">
          <span className="material-symbols-outlined text-[24px]">electric_bolt</span>
        </div>
        <div>
          <p className="font-headline-sm text-headline-sm font-bold leading-none text-surface-bright">
            ELEC Engineering
          </p>
          <p className="mt-space-2xs font-label-caps text-label-caps uppercase tracking-wider text-on-primary-container">
            IEC 60364 • NF C 15-100
          </p>
        </div>
      </div>

      <div className="relative mt-space-2xl">
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-surface-bright">
          La plateforme du Bureau d'Études électrique
        </h1>
        <p className="mt-space-md max-w-md font-body-md text-body-md text-on-primary-container">
          Du calcul du départ jusqu'au suivi maintenance sur site : un seul cycle de vie, connecté de bout en
          bout, conforme aux normes en vigueur.
        </p>

        <div className="mt-space-2xl space-y-space-lg">
          {FEATURES.map((feature) => (
            <div className="flex items-start gap-space-md" key={feature.title}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest/10 text-secondary-fixed-dim">
                <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-surface-bright">{feature.title}</p>
                <p className="mt-space-2xs font-body-sm text-body-sm text-on-primary-container">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-space-sm">
        <span className="inline-flex items-center gap-space-2xs rounded-full bg-surface-container-lowest/10 px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold uppercase tracking-wider text-secondary-fixed-dim">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          CEI 60364-5-52
        </span>
        <span className="inline-flex items-center gap-space-2xs rounded-full bg-surface-container-lowest/10 px-space-sm py-space-2xs font-tech-unit text-tech-unit font-bold uppercase tracking-wider text-secondary-fixed-dim">
          NF C 15-100 Amendment 5
        </span>
      </div>
    </div>
  );
}

export default AuthBrandPanel;
