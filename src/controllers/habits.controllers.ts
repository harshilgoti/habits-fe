import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../utils/ErrorResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/AppResponse";
import { Habit } from "../models/habits.models";

const createHabit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body;

    if (!title) {
      throw new ErrorResponse(400, "Title is required");
    }
    if (!req?.user?._id) {
      throw new ErrorResponse(400, "Unauthorized");
    }

    const createdHabit = await Habit.create({
      title,
      createdBy: req.user._id,
    });

    const habit = await Habit.findById(createdHabit._id);

    if (!habit) {
      throw new Error("Habit not found");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, habit, "Habit created successfully"));
  }
);

const isCompleteHabit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { isCompleted } = req.body;
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { isCompleted },
      { new: true }
    );

    if (!habit) {
      throw new Error("Habit not found or you don't have permission");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, habit, "Habit updated successfully"));
  }
);

const habits = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ErrorResponse(403, "Unauthorized");
      return;
    }
    const habits = await Habit.find({ createdBy: userId });

    return res
      .status(201)
      .json(new ApiResponse(200, habits, "Habit fetched successfully"));
  }
);

const habitStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) {
      throw new ErrorResponse(404, "Invalid Date");
    }
    const givenDate = new Date(date as string);

    const startOfDay = new Date(givenDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(givenDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const habit = await Habit.find({
      _id: id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!habit) {
      throw new Error("Habit not found");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, habit, "Habit status fetched successfully"));
  }
);

export { createHabit, habits, isCompleteHabit, habitStatus };
