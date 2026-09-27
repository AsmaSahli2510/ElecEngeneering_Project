const express = require("express");
const createResourceController = require("../controllers/resourceController");

function createResourceRoutes(Model, hooks, options) {
  const router = express.Router();
  const controller = createResourceController(Model, hooks, options);

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

module.exports = createResourceRoutes;
