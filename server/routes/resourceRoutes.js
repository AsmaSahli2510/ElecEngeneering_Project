const express = require("express");
const createResourceController = require("../controllers/resourceController");

function createResourceRoutes(Model, hooks) {
  const router = express.Router();
  const controller = createResourceController(Model, hooks);

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

module.exports = createResourceRoutes;
