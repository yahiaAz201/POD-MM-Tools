const { Router } = require("express");

const subscriptionsController = require("../controllers/subscriptionsController.js");

const subscriptionsRouter = Router();

subscriptionsRouter.get("/:id?", subscriptionsController.get);
subscriptionsRouter.post("/", subscriptionsController.add);
subscriptionsRouter.put("/:id", subscriptionsController.update);
subscriptionsRouter.delete("/:id", subscriptionsController.remove);

module.exports = subscriptionsRouter;
