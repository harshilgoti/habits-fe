import express from "express";
import {
  createHabit,
  habits,
  habitStatus,
  isCompleteHabit,
} from "../controllers/habits.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const habitsRouter = express.Router();

habitsRouter.route("/").get(verifyJWT, habits); // get all habits
habitsRouter.route("/status/:id").get(verifyJWT, habitStatus); // get habit status
habitsRouter.route("/").post(verifyJWT, createHabit); // create route
habitsRouter.route("/:id").patch(verifyJWT, isCompleteHabit);

export default habitsRouter;
