import { Link } from "react-router-dom";
import Notice from "./Notice.jsx";

// Affiche l'état de chargement / d'erreur d'un useLoad ; rend `children` quand les données sont prêtes.
function LoadState({ state, backTo, backLabel = "Retour", children }) {
  if (state.status === "loading") {
    return <p className="p-space-xl font-body-md text-on-surface-variant">Chargement…</p>;
  }
  if (state.status === "error") {
    return (
      <div className="space-y-space-md p-space-xl">
        <Notice tone="error" title="Chargement impossible">
          {state.error}
        </Notice>
        {backTo && (
          <Link className="font-body-md font-semibold text-secondary hover:underline" to={backTo}>
            ← {backLabel}
          </Link>
        )}
      </div>
    );
  }
  return children;
}

export default LoadState;
