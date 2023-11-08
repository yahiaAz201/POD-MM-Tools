const { Router } = require("express");

const userController = require("../controllers/userController.js");
const auth = require("../middlewares/auth.js");

const userRouter = Router();

userRouter.post("/signin", userController.signin);
userRouter.post("/signup", userController.signup);

userRouter.get("/subscriptionsList", userController.listSubscriptions);
userRouter.get("/subscriptions", auth, userController.getMySubscriptions);
userRouter.get("/subscription/:id?", auth, userController.loadSubscription);

module.exports = userRouter;
