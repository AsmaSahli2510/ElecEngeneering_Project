import SectionCard from "../components/ui/SectionCard.jsx";
import { useTheme } from "../hooks/useTheme.js";

const THEMES = [
  { value: "light", label: "Clair", icon: "light_mode" },
  { value: "dark", label: "Sombre", icon: "dark_mode" },
];

function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full flex-col gap-space-lg pb-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
          Paramètres
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Préférences d'affichage et informations du compte.
        </p>
      </div>

      <SectionCard icon="palette" subtitle="Choisissez le thème de l'interface" title="Apparence">
        <div className="inline-flex rounded-lg bg-surface-container-low p-space-2xs">
          {THEMES.map((option) => (
            <button
              className={`flex items-center gap-space-xs rounded px-space-lg py-space-sm font-body-sm text-body-sm transition-colors ${
                theme === option.value
                  ? "bg-surface-container-lowest text-secondary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              key={option.value}
              onClick={() => setTheme(option.value)}
              type="button">
              <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </SectionCard>


    </div>
  );
}

export default Settings;
