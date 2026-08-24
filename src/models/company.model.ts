import mongoose, { Document, Schema } from "mongoose";

export interface ICompany extends Document {
  companyId: string;
  name: string;
  minimumCGPA: number;
  eligibleBranches: string[];
  interviewDuration: number;
  priority: number;
}

const companySchema = new Schema<ICompany>(
  {
    companyId: {
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

    minimumCGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    eligibleBranches: {
      type: [String],
      required: true
    },

    interviewDuration: {
      type: Number,
      required: true,
      min: 1
    },

    priority: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

const Company = mongoose.model<ICompany>("Company", companySchema);

export default Company;