// hooks.afterCreate(document) : effet de bord après une création réussie (ex. événement d'historique).
// options.ownerField : nom du champ (ex. "owner") qui délimite l'espace du compte connecté sur ce modèle —
// injecté à la création, exigé sur toute lecture/modification/suppression. Absent pour les ressources qui n'ont
// pas leur propre notion de propriétaire (elles restent accessibles telles quelles, comme avant).
function createResourceController(Model, hooks = {}, options = {}) {
  const { ownerField } = options;
  const scope = (req) => (ownerField ? { [ownerField]: req.userId } : {});

  return {
    list: async (req, res, next) => {
      try {
        const filter = {
          ...Object.fromEntries(Object.entries(req.query).filter(([, value]) => value)),
          ...scope(req),
        };
        const documents = await Model.find(filter).sort({ createdAt: -1 });
        res.json(documents);
      } catch (error) {
        next(error);
      }
    },
    getById: async (req, res, next) => {
      try {
        const document = await Model.findOne({ _id: req.params.id, ...scope(req) });
        if (!document)
          return res.status(404).json({ message: "Resource not found" });
        res.json(document);
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        const document = await Model.create({ ...req.body, ...scope(req) });
        await hooks.afterCreate?.(document);
        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const document = await Model.findOneAndUpdate(
          { _id: req.params.id, ...scope(req) },
          req.body,
          { new: true, runValidators: true },
        );
        if (!document)
          return res.status(404).json({ message: "Resource not found" });
        res.json(document);
      } catch (error) {
        next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        const document = await Model.findOneAndDelete({ _id: req.params.id, ...scope(req) });
        if (!document)
          return res.status(404).json({ message: "Resource not found" });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createResourceController;
