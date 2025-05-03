import express from "express";
import {
  createHabit,
  habits,
  habitStatus,
  isCompleteHabit,
} from "../controllers/habits.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const habitsRouter = express.Router();

habitsRouter.route("/list").get(verifyJWT, habits); // get all habits
habitsRouter.route("/status/:id").get(verifyJWT, habitStatus); // get habit status
habitsRouter.route("/create/").post(verifyJWT, createHabit); // create route
habitsRouter.route("/update/:id").put(isCompleteHabit); // update route

export default habitsRouter;
