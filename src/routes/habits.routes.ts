import express from "express";
import {
  createHabit,
  habits,
  markHabitComplete,
  unmarkHabitComplete,
  habitStatus,
  habitStreak,
  monthlyCompletions,
} from "../controllers/habits.controllers";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyJWT);

router.get("/", habits);

router.post("/", createHabit);

router.post("/:id/complete", markHabitComplete);
router.post("/:id/uncomplete", unmarkHabitComplete);
router.get("/:id/status", habitStatus);
router.get("/:id/streak", habitStreak);
router.get("/:id/monthly", monthlyCompletions);

export default router;
