import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel.jsx";
import { formInputClass } from "../components/ui/FormField.jsx";
import Notice from "../components/ui/Notice.jsx";
import { useAuth } from "../hooks/useAuth.js";

// Layout split-screen : bandeau de marque à gauche (40%), formulaire centré à droite (60%).
function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    return <Navigate replace to={location.state?.from?.pathname ?? "/dashboard"} />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-5">
      <AuthBrandPanel />

      <div className="flex flex-col justify-center bg-background px-space-xl py-space-2xl lg:col-span-3 lg:px-space-2xl">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-space-xl flex items-center gap-space-md lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary">
              <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
            </div>
            <p className="font-headline-sm text-headline-sm font-bold text-on-surface">ELEC Engineering</p>
          </div>

          <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Espace Bureau d'Études
          </div>
          <h2 className="mt-space-2xs font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
            Bon retour
          </h2>
          <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
            Connectez-vous pour accéder à vos projets et calculs.
          </p>

          {error && (
            <Notice className="mt-space-lg" tone="error">
              {error}
            </Notice>
          )}

          <form className="mt-space-xl space-y-space-lg" onSubmit={handleSubmit}>
            <label className="block space-y-space-xs">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">Adresse e-mail</span>
              <input
                autoComplete="email"
                className={formInputClass}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="prenom.nom@elecproject.tn"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block space-y-space-xs">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">Mot de passe</span>
              <input
                autoComplete="current-password"
                className={formInputClass}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </label>

            <button
              className="flex h-11 w-full items-center justify-center gap-space-xs rounded-lg bg-secondary font-headline-sm text-headline-sm font-semibold text-on-secondary shadow-sm transition-colors hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit">
              {submitting ? "Connexion…" : "Se connecter"}
              {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          <p className="mt-space-xl text-center font-body-sm text-body-sm text-on-surface-variant">
            Pas encore de compte ?{" "}
            <Link className="font-semibold text-secondary hover:underline" to="/register">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
