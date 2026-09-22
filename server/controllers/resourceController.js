// hooks.afterCreate(document) : effet de bord après une création réussie (ex. événement d'historique).
function createResourceController(Model, hooks = {}) {
  return {
    list: async (req, res, next) => {
      try {
        const filter = Object.fromEntries(
          Object.entries(req.query).filter(([, value]) => value),
        );
        const documents = await Model.find(filter).sort({ createdAt: -1 });
        res.json(documents);
      } catch (error) {
        next(error);
      }
    },
    getById: async (req, res, next) => {
      try {
        const document = await Model.findById(req.params.id);
        if (!document)
          return res.status(404).json({ message: "Resource not found" });
        res.json(document);
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        const document = await Model.create(req.body);
        await hooks.afterCreate?.(document);
        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const document = await Model.findByIdAndUpdate(
          req.params.id,
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
        const document = await Model.findByIdAndDelete(req.params.id);
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
