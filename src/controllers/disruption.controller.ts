import { Request, Response } from "express";
import {
    runCompanyDelay,
    runPanelUnavailable,
    runStudentWithdrawal,
    runRoomUnavailable,
    runCompound
} from "../services/replanner-db.service";
import { broadcast } from "../services/websocket.service";

/**
 * POST /api/disruptions/company-delay
 * Body: { companyId: string, delayHours: number }
 */
export const companyDelayController = async (req: Request, res: Response) => {
    try {
        const { companyId, delayHours } = req.body;
        if (!companyId || delayHours === undefined) {
            return res.status(400).json({ message: "companyId and delayHours are required" });
        }
        const { disruption, result } = await runCompanyDelay(companyId, Number(delayHours));
        
        broadcast("SCHEDULE_UPDATED", {
            type: "COMPANY_DELAY",
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics
        });

        return res.status(200).json({
            message: `Company delay disruption applied for ${companyId} (+${delayHours}h)`,
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics,
            diff: result.diff
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to apply company delay" });
    }
};

/**
 * POST /api/disruptions/panel-unavailable
 * Body: { panelId: string }
 */
export const panelUnavailableController = async (req: Request, res: Response) => {
    try {
        const { panelId } = req.body;
        if (!panelId) {
            return res.status(400).json({ message: "panelId is required" });
        }
        const { disruption, result } = await runPanelUnavailable(panelId);

        broadcast("SCHEDULE_UPDATED", {
            type: "PANEL_UNAVAILABLE",
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics
        });

        return res.status(200).json({
            message: `Panel unavailable disruption applied for ${panelId}`,
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics,
            diff: result.diff
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to apply panel unavailable" });
    }
};

/**
 * POST /api/disruptions/student-withdrawal
 * Body: { studentId: string }
 */
export const studentWithdrawalController = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: "studentId is required" });
        }
        const { disruption, result } = await runStudentWithdrawal(studentId);

        broadcast("SCHEDULE_UPDATED", {
            type: "STUDENT_WITHDRAWAL",
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics
        });

        return res.status(200).json({
            message: `Student withdrawal applied for ${studentId}`,
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics,
            diff: result.diff
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to apply student withdrawal" });
    }
};

/**
 * POST /api/disruptions/room-unavailable
 * Body: { roomId: string }
 */
export const roomUnavailableController = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.body;
        if (!roomId) {
            return res.status(400).json({ message: "roomId is required" });
        }
        const { disruption, result } = await runRoomUnavailable(roomId);

        broadcast("SCHEDULE_UPDATED", {
            type: "ROOM_UNAVAILABLE",
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics
        });

        return res.status(200).json({
            message: `Room unavailable disruption applied for ${roomId}`,
            disruptionId: disruption.disruptionId,
            summary: disruption.metrics,
            diff: result.diff
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to apply room unavailable" });
    }
};

/**
 * POST /api/disruptions/compound
 * Body: {
 *   companyDelay?:      { companyId, delayHours },
 *   panelUnavailable?:  { panelId },
 *   studentWithdrawal?: { studentId },
 *   roomUnavailable?:   { roomId }
 * }
 */
export const compoundDisruptionController = async (req: Request, res: Response) => {
    try {
        const disruption = req.body;
        const { disruption: record, result } = await runCompound(disruption);

        broadcast("SCHEDULE_UPDATED", {
            type: "COMPOUND",
            disruptionId: record.disruptionId,
            summary: record.metrics
        });

        return res.status(200).json({
            message: "Compound disruption applied",
            disruptionId: record.disruptionId,
            summary: record.metrics,
            diff: result.diff
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to apply compound disruption" });
    }
};
