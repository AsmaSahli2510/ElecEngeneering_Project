import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context.js";
import { api, setUnauthorizedHandler } from "../lib/api.js";
import { getToken, setToken } from "../lib/authToken.js";

// Session de l'utilisateur connecté : chaque compte n'accède qu'à son propre espace (projets, armoires,
// actifs, ...) — la délimitation se fait côté serveur, ce contexte porte juste le jeton et l'identité.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading | authenticated | unauthenticated — pas de jeton -> pas d'appel réseau à attendre, l'état de
  // départ est déjà connu (évite un setState synchrone dans l'effet ci-dessous).
  const [status, setStatus] = useState(() => (getToken() ? "loading" : "unauthenticated"));

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api.auth
      .me()
      .then((data) => {
        setUser(data);
        setStatus("authenticated");
      })
      .catch(() => {
        setToken(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = async (credentials) => {
    const { token, user: loggedInUser } = await api.auth.login(credentials);
    setToken(token);
    setUser(loggedInUser);
    setStatus("authenticated");
  };

  const register = async (data) => {
    const { token, user: newUser } = await api.auth.register(data);
    setToken(token);
    setUser(newUser);
    setStatus("authenticated");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  };

  // Guide de bienvenue : mis à jour localement tout de suite (le guide se ferme sans attendre le réseau),
  // puis mémorisé sur le compte pour ne plus s'afficher, quel que soit le navigateur.
  const setOnboardingDone = (done) => {
    setUser((current) => (current ? { ...current, onboardingDone: done } : current));
    api.auth.setOnboarding(done).catch(() => {});
  };

  const value = useMemo(
    () => ({ user, status, login, register, logout, setOnboardingDone }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
