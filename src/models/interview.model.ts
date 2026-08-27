import mongoose, { Document, Schema } from "mongoose";

export interface IInterview extends Document {
  interviewId: string;
  studentId: string;
  companyId: string;
  roomId: string;
  panelId: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  status: "pending" | "scheduled" | "completed" | "cancelled";
}

const interviewSchema = new Schema<IInterview>(
  {
    interviewId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    studentId: {
      type: String,
      required: true,
      trim: true
    },

    companyId: {
      type: String,
      required: true,
      trim: true
    },
    roomId: {
      type: String,
      required: true,
      trim: true
    },

    panelId: {
      type: String,
      required: true,
      trim: true
    },

    duration: {
      type: Number,
      required: true,
      min: 1
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
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

const Interview = mongoose.model<IInterview>(
  "Interview",
  interviewSchema
);

export default Interview;