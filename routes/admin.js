const { Router } = require("express");

const adminController = require("../controllers/adminController.js");
const subscriptionsController = require("../controllers/subscriptionsController.js");

const adminRouter = Router();

adminRouter.post("/auth/signin", adminController.signin);

adminRouter.get("/user/:id?", adminController.getUser);
adminRouter.put("/user/:id?", adminController.updateUser);
adminRouter.delete("/user/:id", adminController.removeUser);

adminRouter.get("/subscriptions/:id?", subscriptionsController.get);
adminRouter.post("/subscriptions/", subscriptionsController.add);
adminRouter.put("/subscriptions/:id", subscriptionsController.update);
adminRouter.delete("/subscriptions/:id", subscriptionsController.remove);

module.exports = adminRouter;
