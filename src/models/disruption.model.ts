import mongoose, { Document, Schema } from "mongoose";

export interface IDisruption extends Document {
    disruptionId: string;
    type:
    | "COMPANY_DELAY"
    | "PANEL_UNAVAILABLE"
    | "STUDENT_WITHDRAWAL"
    | "ROOM_UNAVAILABLE"
    | "COMPOUND";
    payload: Record<string, unknown>;
    diff: Record<string, unknown>[];
    metrics: {
        interviewsMoved: number;
        interviewsCancelled: number;
        interviewsUnscheduled: number;
        interviewsUnchanged: number;
    };
    createdAt: Date;
}

const disruptionSchema = new Schema<IDisruption>(
    {
        disruptionId: {
            type: String,
            unique: true,
            default: () => `DIS-${Date.now()}`
        },
        type: {
            type: String,
            enum: [
                "COMPANY_DELAY",
                "PANEL_UNAVAILABLE",
                "STUDENT_WITHDRAWAL",
                "ROOM_UNAVAILABLE",
                "COMPOUND"
            ],
            required: true
        },
        payload: {
            type: Schema.Types.Mixed,
            required: true
        },
        // Mixed array — cast needed to satisfy Mongoose's overloaded schema types
        diff: {
            type: [Schema.Types.Mixed] as unknown as typeof Schema.Types.Mixed,
            default: []
        },
        metrics: {
            interviewsMoved: { type: Number, default: 0 },
            interviewsCancelled: { type: Number, default: 0 },
            interviewsUnscheduled: { type: Number, default: 0 },
            interviewsUnchanged: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

const Disruption = mongoose.model<IDisruption>("Disruption", disruptionSchema);

export default Disruption;
