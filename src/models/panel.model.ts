import mongoose, { Document, Schema } from "mongoose";

export interface IPanel extends Document {
  panelId: string;
  companyId: string;
  status: "available" | "disrupted" | "inactive";
}

const panelSchema = new Schema<IPanel>(
  {
    panelId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    companyId: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["available", "disrupted", "inactive"],
      default: "available"
    }
  },
  {
    timestamps: true
  }
);

const Panel = mongoose.model<IPanel>("Panel", panelSchema);

export default Panel;