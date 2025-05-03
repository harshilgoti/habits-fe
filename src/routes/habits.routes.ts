import express from "express";
import {
  createHabit,
  habits,
  markHabitComplete,
  habitStatus,
} from "../controllers/habits.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyJWT);

router.get("/", habits);
router.post("/", createHabit);
router.post("/:id/complete", markHabitComplete);
router.get("/:id/status", habitStatus);

export default router;
