import mongoose, { Document, Model } from "mongoose";

interface IHabitCompletion extends Document {
  habitId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  completionDate: Date;
}

export interface IHabitCompletionModel extends Model<IHabitCompletion> {
  findCompletionByDate(
    habitId: string,
    userId: string,
    date: Date
  ): Promise<IHabitCompletion | null>;
}

const habitCompletionSchema = new mongoose.Schema<IHabitCompletion>(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "HabitCompletion",
  }
);

habitCompletionSchema.index(
  { habitId: 1, userId: 1, completionDate: 1 },
  { unique: true }
);

habitCompletionSchema.statics.findCompletionByDate = async function (
  habitId: string,
  userId: string,
  date: Date
): Promise<IHabitCompletion | null> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return this.findOne({
    habitId,
    userId,
    completionDate: { $gte: startOfDay, $lte: endOfDay },
  });
};

export const HabitCompletion = mongoose.model<
  IHabitCompletion,
  IHabitCompletionModel
>("HabitCompletion", habitCompletionSchema);
