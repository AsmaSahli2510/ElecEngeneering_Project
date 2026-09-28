import { useEffect, useMemo, useState } from "react";
import { THEME_STORAGE_KEY, ThemeContext } from "./theme-context.js";

// Mode clair par défaut ; le mode sombre n'est appliqué que s'il a été choisi explicitement (Paramètres).
function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

// Fournit le thème courant (clair/sombre) à toute l'application et le reflète sur
// <html class="dark"> : le reste de l'app n'a rien à connaître de ce mécanisme, les
// jetons de couleur Tailwind (bg-surface, text-on-surface, ...) basculent d'eux-mêmes.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
