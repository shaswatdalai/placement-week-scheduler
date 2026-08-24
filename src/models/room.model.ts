import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  roomId: string;
  status: "AVAILABLE" | "UNAVAILABLE";
}

const roomSchema = new Schema<IRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "UNAVAILABLE"],
      default: "AVAILABLE"
    }
  },
  {
    timestamps: true
  }
);

const Room = mongoose.model<IRoom>("Room", roomSchema);

export default Room;