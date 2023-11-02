const { Router } = require("express");

const userController = require("../controllers/userController.js");

const userRouter = Router();

userRouter.post("/signin", userController.signin);
userRouter.post("/signup", userController.signup);

userRouter.get("/subscriptions", userController.getMySubscriptions);

module.exports = userRouter;
