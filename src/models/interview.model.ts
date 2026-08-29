import mongoose, { Document, Schema } from "mongoose";

export interface IInterview extends Document {
  interviewId: string;
  studentId: string;
  companyId: string;
  roomId?: string;
  panelId?: string;
  duration: number;
  startTime?: Date;
  endTime?: Date;

  status:
  | "pending"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "unscheduled";

  failureReason?: string;
  failureDetails?: string;
  reasonTrace?: string[];
  snapshotBefore?: {
    startTime?: Date;
    endTime?: Date;
    roomId?: string;
    panelId?: string;
    status?: string;
  };
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

      trim: true
    },

    panelId: {
      type: String,

      trim: true
    },

    duration: {
      type: Number,
      required: true,
      min: 1
    },

    startTime: {
      type: Date,

    },

    endTime: {
      type: Date,

    },

    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled", "unscheduled"],
      default: "pending"
    },
    failureReason: {
      type: String,
      trim: true
    },
    failureDetails: {
      type: String,
      trim: true
    },
    reasonTrace: {
      type: [String],
      default: []
    },
    snapshotBefore: {
      startTime: { type: Date },
      endTime: { type: Date },
      roomId: { type: String },
      panelId: { type: String },
      status: { type: String }
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