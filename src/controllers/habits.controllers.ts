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

const unmarkHabitComplete = asyncHandler(
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

    const startOfDay = new Date(completionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(completionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const result = await HabitCompletion.deleteOne({
      habitId: id,
      userId: userId,
      completionDate: { $gte: startOfDay, $lte: endOfDay },
    });

    if (result.deletedCount === 0) {
      throw new ErrorResponse(
        404,
        "Habit was not marked as complete for this date"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { success: true }, "Habit completion removed")
      );
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

const habitStreak = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
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

    const completions = await HabitCompletion.find({
      habitId: id,
      userId: userId,
    }).sort({ completionDate: -1 });

    if (completions.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { streak: 0 }, "No streak found"));
    }

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let latestDate = new Date(completions[0].completionDate);
    latestDate.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (latestDate < yesterday) {
      return res
        .status(200)
        .json(new ApiResponse(200, { streak: 0 }, "Streak broken"));
    }

    for (let i = 1; i < completions.length; i++) {
      const currentDate = new Date(completions[i - 1].completionDate);
      currentDate.setHours(0, 0, 0, 0);

      const prevDate = new Date(completions[i].completionDate);
      prevDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { streak }, "Habit streak fetched successfully")
      );
  }
);

const monthlyCompletions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { year, month } = req.query;
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

    const targetYear = year
      ? parseInt(year as string)
      : new Date().getFullYear();
    const targetMonth = month
      ? parseInt(month as string) - 1
      : new Date().getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const completions = await HabitCompletion.find({
      habitId: id,
      userId: userId,
      completionDate: { $gte: startDate, $lte: endDate },
    }).sort({ completionDate: 1 });

    const days = Array(31).fill(false);

    completions.forEach((completion) => {
      const day = completion.completionDate.getDate() - 1;
      days[day] = true;
    });

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthData = days.slice(0, daysInMonth);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          habit: habit.title,
          year: targetYear,
          month: targetMonth + 1,
          completions: monthData,
        },
        "Monthly completions fetched successfully"
      )
    );
  }
);

export {
  createHabit,
  habits,
  markHabitComplete,
  unmarkHabitComplete,
  habitStatus,
  habitStreak,
  monthlyCompletions,
};
