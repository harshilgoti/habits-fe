import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../utils/ErrorResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/AppResponse";
import { Habit } from "../models/habits.models";
import { HabitCompletion } from "../models/habitCompletion.models";
import mongoose from "mongoose";

const createHabit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body;
    if (!title) {
      throw new ErrorResponse(400, "Title is required");
    }
    if (!req?.user?._id) {
      throw new ErrorResponse(401, "Unauthorized");
    }
    const createdHabit = await Habit.create({
      title,
      createdBy: req.user._id,
    });
    const habit = await Habit.findById(createdHabit._id);
    if (!habit) {
      throw new ErrorResponse(404, "Habit not found");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, habit, "Habit created successfully"));
  }
);

const habits = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ErrorResponse(401, "Unauthorized");
    }

    const habits = await Habit.find({ createdBy: userId });

    if (habits.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No habits found"));
    }

    const habitIds = habits.map((habit) => habit._id);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const completionsToday = await HabitCompletion.find({
      userId,
      habitId: { $in: habitIds },
      completionDate: { $gte: today, $lte: endOfDay },
    });

    const completedHabitIds = new Set(
      completionsToday.map((c) => c.habitId.toString())
    );

    const habitsWithCompletion = habits.map((habit) => ({
      ...habit.toObject(),
      isTodayCompleted: completedHabitIds.has(habit._id.toString()),
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          habitsWithCompletion,
          "Habits fetched successfully"
        )
      );
  }
);

const markHabitComplete = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ErrorResponse(401, "Unauthorized");
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ErrorResponse(400, "Valid habit ID is required");
    }

    const habit = await Habit.findOne({ _id: id, createdBy: userId });
    if (!habit) {
      throw new ErrorResponse(
        404,
        "Habit not found or you don't have permission"
      );
    }

    const completionDate = date ? new Date(date) : new Date();

    const existingCompletion = await HabitCompletion.findCompletionByDate(
      id,
      userId.toString(),
      completionDate
    );

    if (existingCompletion) {
      throw new ErrorResponse(
        400,
        "Habit already marked as complete for this date"
      );
    }

    const newCompletion = await HabitCompletion.create({
      habitId: id,
      userId: userId,
      completionDate: completionDate,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newCompletion, "Habit marked as complete"));
  }
);

const habitStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const dateStr = req.query.date as string;
    const userId = req.user?._id;

    if (!userId) {
      throw new ErrorResponse(401, "Unauthorized");
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ErrorResponse(400, "Valid habit ID is required");
    }

    if (!dateStr) {
      throw new ErrorResponse(400, "Date is required");
    }

    const habit = await Habit.findOne({ _id: id, createdBy: userId });
    if (!habit) {
      throw new ErrorResponse(
        404,
        "Habit not found or you don't have permission"
      );
    }

    const date = new Date(dateStr);
    const completion = await HabitCompletion.findCompletionByDate(
      id,
      userId.toString(),
      date
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          habit: habit,
          isCompleted: !!completion,
          completionDate: completion ? completion.completionDate : null,
        },
        "Habit status fetched successfully"
      )
    );
  }
);

export { createHabit, habits, markHabitComplete, habitStatus };
