const { verifyToken } = require("../utils/auth");

// Protège toutes les routes métier : un jeton Bearer valide est requis, sans quoi la requête n'a pas
// d'identité (`req.userId`) pour scoper les projets à l'espace du compte connecté.
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  try {
    req.userId = verifyToken(token).sub;
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée" });
  }
}

module.exports = requireAuth;
