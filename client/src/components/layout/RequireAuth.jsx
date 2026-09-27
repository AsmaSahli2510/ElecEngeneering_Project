import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

// Porte d'entrée de l'espace applicatif : sans session valide, on repart vers /login (avec le chemin visé,
// pour y revenir après connexion) — c'est ce qui garantit qu'on ne voit jamais que son propre espace.
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="font-body-sm text-body-sm text-on-surface-variant">Chargement…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

export default RequireAuth;
