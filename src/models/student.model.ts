import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  name: string;
  cgpa: number;
  branch: string;
  status: "ACTIVE" | "WITHDRAWN" | "PLACED";
}

const studentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    branch: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "WITHDRAWN", "PLACED"],
      default: "ACTIVE"
    }
  },
  {
    timestamps: true
  }
);

const Student = mongoose.model<IStudent>("Student", studentSchema);

export default Student;