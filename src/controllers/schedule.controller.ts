import { Request, Response } from "express";
import Interview from "../models/interview.model";
import Room from "../models/room.model";
import Panel from "../models/panel.model";
import Disruption from "../models/disruption.model";
import { computeMetrics } from "../services/metrics.service";
import { explainInterview } from "../services/explanation.service";

/**
 * GET /api/schedule
 * Returns all interviews (with optional status filter via ?status=scheduled)
 */
export const getScheduleController = async (req: Request, res: Response) => {
    try {
        const { status, companyId } = req.query;
        const filter: Record<string, string> = {};
        if (status)    filter.status    = status as string;
        if (companyId) filter.companyId = companyId as string;

        const interviews = await Interview.find(filter).sort({ startTime: 1 });
        return res.status(200).json({ count: interviews.length, interviews });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch schedule" });
    }
};

/**
 * GET /api/schedule/diff
 * Returns the most recent disruption diff (or all diffs if ?all=true)
 */
export const getScheduleDiffController = async (req: Request, res: Response) => {
    try {
        const all = req.query.all === "true";
        if (all) {
            const disruptions = await Disruption.find().sort({ createdAt: -1 });
            return res.status(200).json({ count: disruptions.length, disruptions });
        }
        const latest = await Disruption.findOne().sort({ createdAt: -1 });
        if (!latest) {
            return res.status(200).json({ message: "No disruptions recorded yet", diff: [] });
        }
        return res.status(200).json({
            disruptionId: latest.disruptionId,
            type:         latest.type,
            payload:      latest.payload,
            metrics:      latest.metrics,
            diff:         latest.diff,
            createdAt:    latest.createdAt
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch diff" });
    }
};

/**
 * GET /api/metrics
 * Returns computed schedule quality metrics
 */
export const getMetricsController = async (req: Request, res: Response) => {
    try {
        const [interviews, rooms, panels] = await Promise.all([
            Interview.find(),
            Room.find(),
            Panel.find()
        ]);
        const metrics = computeMetrics(interviews, rooms, panels);
        return res.status(200).json(metrics);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to compute metrics" });
    }
};

/**
 * GET /api/explanations/:interviewId
 * Returns a structured explanation for a specific interview
 */
export const getExplanationController = async (req: Request, res: Response) => {
    try {
        const { interviewId } = req.params;
        const explanation = await explainInterview(interviewId as string);
        return res.status(200).json(explanation);
    } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        console.error(err);
        return res.status(500).json({ message: "Failed to generate explanation" });
    }
};
