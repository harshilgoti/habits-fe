import mongoose, { Model } from "mongoose";

interface IHabit extends Document {
  title: string;
  isCompleted: boolean;
  createdBy: mongoose.Types.ObjectId;
}

export interface IHabitModel extends Model<IHabit> {}

const userSchema = new mongoose.Schema<IHabit>(
  {
    title: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "Habit",
  }
);

export const Habit = mongoose.model<IHabit, IHabitModel>("Habit", userSchema);
