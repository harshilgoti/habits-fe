import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../utils/ErrorResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/AppResponse";
import { Habit } from "../models/habits.models";
import { Schema } from "mongoose";

const createHabit = asyncHandler(
  async (req: Request & { user: any }, res: Response, next: NextFunction) => {
    const { title } = req.body;

    if (!title) {
      throw new ErrorResponse(400, "Title is required");
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

    const habit = await Habit.findByIdAndUpdate(
      id,
      {
        $set: {
          isCompleted,
        },
      },
      { new: true }
    );

    if (!habit) {
      throw new Error("Habit not found");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, habit, "Habit Updated successfully"));
  }
);

const habits = asyncHandler(
  async (req: Request & { user: any }, res: Response, next: NextFunction) => {
    const habits = await Habit.find({ createdBy: req.user._id });

    return res
      .status(201)
      .json(new ApiResponse(200, habits, "Habit fetched successfully"));
  }
);

const habitStatus = asyncHandler(
  async (req: Request & { date: any }, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { date } = req.query;
    const givenDate = new Date(date as string); // e.g., '2025-04-29'

    const startOfDay = new Date(givenDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(givenDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const habit = await Habit.find({
      _id: id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return res
      .status(201)
      .json(new ApiResponse(200, habit, "Habit status fetched successfully"));
  }
);

export { createHabit, habits, isCompleteHabit, habitStatus };
