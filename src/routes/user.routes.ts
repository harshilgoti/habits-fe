import express from "express";
import { getUserById, login, register } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const userRouter = express.Router();

userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/me").get(verifyJWT, getUserById);

export default userRouter;
