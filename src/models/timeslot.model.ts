import mongoose, { Document, Schema } from "mongoose";

export interface ITimeSlot extends Document {
  slotId: string;
  startTime: Date;
  endTime: Date;
  status: "AVAILABLE" | "BLOCKED";
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    slotId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "BLOCKED"],
      default: "AVAILABLE"
    }
  },
  {
    timestamps: true
  }
);

const TimeSlot = mongoose.model<ITimeSlot>(
  "TimeSlot",
  timeSlotSchema
);

export default TimeSlot;