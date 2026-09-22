// Paramètres du cycle de vie de l'actif (configurables par variables d'environnement).
// Ce sont des durées de prototype servant à pré-remplir la garantie ; elles restent modifiables sur l'actif.
module.exports = {
  warranty: {
    partsMonths: Number(process.env.WARRANTY_PARTS_MONTHS) || 24,
    laborMonths: Number(process.env.WARRANTY_LABOR_MONTHS) || 12,
  },
};
