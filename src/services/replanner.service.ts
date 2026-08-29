// In-memory replanning engine for handling schedule disruptions.

import { IInterview } from "../models/interview.model";
import { IPanel } from "../models/panel.model";
import { IRoom } from "../models/room.model";
import { ITimeSlot } from "../models/timeslot.model";
import { ICompany } from "../models/company.model";
import {
    hasStudentConflict,
    hasPanelConflict,
    hasRoomConflict,
    findAvailablePanelForTime,
    findAvailableRoomForTime,
    findPossibleTimeWindows
} from "./scheduler.service";

export interface IDiffEntry {
    interviewId: string;
    studentId: string;
    companyId: string;
    changes: {
        time?: { from: string | undefined; to: string | undefined };
        room?: { from: string | undefined; to: string | undefined };
        panel?: { from: string | undefined; to: string | undefined };
        status?: { from: string; to: string };
    };
    reasonCode: string;
    reasonDetails: string;
    affectedPeople: string[];
}

export interface IReplanResult {
    changedInterviews: IInterview[];
    unchangedInterviews: IInterview[];
    newlyUnscheduled: IInterview[];
    cancelledInterviews: IInterview[];
    diff: IDiffEntry[];
}

export interface ICompoundDisruption {
    companyDelay?: { companyId: string; delayHours: number };
    panelUnavailable?: { panelId: string };
    studentWithdrawal?: { studentId: string };
    roomUnavailable?: { roomId: string };
}

function captureSnapshot(interview: IInterview) {
    interview.snapshotBefore = {
        startTime: interview.startTime,
        endTime: interview.endTime,
        roomId: interview.roomId,
        panelId: interview.panelId,
        status: interview.status
    };
}

function buildDiffEntry(
    interview: IInterview,
    reasonCode: string,
    reasonDetails: string
): IDiffEntry {
    const snap = interview.snapshotBefore || {};
    const changes: IDiffEntry["changes"] = {};

    if (snap.startTime?.toISOString() !== interview.startTime?.toISOString()) {
        changes.time = {
            from: snap.startTime?.toISOString(),
            to: interview.startTime?.toISOString()
        };
    }
    if (snap.roomId !== interview.roomId) {
        changes.room = { from: snap.roomId, to: interview.roomId };
    }
    if (snap.panelId !== interview.panelId) {
        changes.panel = { from: snap.panelId, to: interview.panelId };
    }
    if (snap.status !== interview.status) {
        changes.status = { from: snap.status as string, to: interview.status };
    }

    const affectedPeople: string[] = [interview.studentId];
    if (interview.panelId) affectedPeople.push(interview.panelId);
    if (snap.panelId && snap.panelId !== interview.panelId)
        affectedPeople.push(snap.panelId);

    return {
        interviewId: interview.interviewId,
        studentId: interview.studentId,
        companyId: interview.companyId,
        changes,
        reasonCode,
        reasonDetails,
        affectedPeople
    };
}

function sortByPriority(
    interviews: IInterview[],
    companies: ICompany[]
): IInterview[] {
    return [...interviews].sort((a, b) => {
        const pa = companies.find((c) => c.companyId === a.companyId)?.priority ?? 999;
        const pb = companies.find((c) => c.companyId === b.companyId)?.priority ?? 999;
        return pa - pb;
    });
}


export function replanCompanyDelay(
    interviews: IInterview[],
    companyId: string,
    delayHours: number,
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[],
    companies: ICompany[]
): IReplanResult {

    const result: IReplanResult = {
        changedInterviews: [],
        unchangedInterviews: [],
        newlyUnscheduled: [],
        cancelledInterviews: [],
        diff: []
    };

    const companyScheduled = interviews.filter(
        (i) => i.companyId === companyId && i.status === "scheduled" && i.startTime
    );
    if (companyScheduled.length === 0) return result;

    const firstStart = companyScheduled.reduce((min, i) =>
        i.startTime! < min ? i.startTime! : min, companyScheduled[0].startTime!);

    const cutoff = new Date(firstStart.getTime() + delayHours * 3600 * 1000);

    // interviews that fall before the new cutoff need to move
    const affected = companyScheduled.filter((i) => i.startTime! < cutoff);
    const unaffected = interviews.filter(
        (i) => !(i.companyId === companyId && affected.includes(i))
    );

    // sort by original start so relative order is preserved
    const sorted = [...affected].sort(
        (a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
    );
    const committedInterviews = [...unaffected];

    for (const interview of sorted) {
        captureSnapshot(interview);

        const laterSlots = timeSlots.filter(
            (s) => s.status === "AVAILABLE" && s.startTime >= cutoff
        );
        const windows = findPossibleTimeWindows(laterSlots, interview.duration);

        let rescheduled = false;

        for (const win of windows) {
            if (hasStudentConflict(committedInterviews, interview.studentId, win.startTime, win.endTime))
                continue;

            // try to keep the same panel first
            const currentPanel = panels.find((p) => p.panelId === interview.panelId);
            let chosenPanel: IPanel | null = null;

            if (
                currentPanel &&
                currentPanel.status === "available" &&
                !hasPanelConflict(committedInterviews, currentPanel.panelId, win.startTime, win.endTime)
            ) {
                chosenPanel = currentPanel;
            } else {
                chosenPanel = findAvailablePanelForTime(
                    panels, committedInterviews, companyId, win.startTime, win.endTime
                );
            }
            if (!chosenPanel) continue;

            // try to keep the same room
            const currentRoom = rooms.find((r) => r.roomId === interview.roomId);
            let chosenRoom: IRoom | null = null;

            if (
                currentRoom &&
                currentRoom.status === "AVAILABLE" &&
                !hasRoomConflict(committedInterviews, currentRoom.roomId, win.startTime, win.endTime)
            ) {
                chosenRoom = currentRoom;
            } else {
                chosenRoom = findAvailableRoomForTime(rooms, committedInterviews, win.startTime, win.endTime);
            }
            if (!chosenRoom) continue;

            interview.startTime = win.startTime;
            interview.endTime = win.endTime;
            interview.panelId = chosenPanel.panelId;
            interview.roomId = chosenRoom.roomId;
            interview.status = "scheduled";

            const trace = `COMPANY_DELAY: moved from ${interview.snapshotBefore?.startTime?.toISOString()} to ${win.startTime.toISOString()} — ${companyId} arrived ${delayHours}h late`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            committedInterviews.push(interview);
            result.changedInterviews.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "COMPANY_DELAY",
                `${companyId} arrived ${delayHours} hour(s) late. Interview moved to earliest feasible slot after ${cutoff.toISOString()}.`
            ));
            rescheduled = true;
            break;
        }

        if (!rescheduled) {
            interview.status = "unscheduled";
            interview.failureReason = "NO_TIME_WINDOW";
            interview.failureDetails =
                `No feasible slot found after ${cutoff.toISOString()} for this interview following ${delayHours}h company delay.`;
            const trace = `COMPANY_DELAY: could not reschedule — no feasible window after ${cutoff.toISOString()}`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            result.newlyUnscheduled.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "COMPANY_DELAY",
                `Could not reschedule after company delay — no feasible slot found.`
            ));
        }
    }

    result.unchangedInterviews = interviews.filter(
        (i) => !affected.includes(i)
    );

    return result;
}

export function replanPanelUnavailable(
    interviews: IInterview[],
    panelId: string,
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[],
    companies: ICompany[]
): IReplanResult {

    const result: IReplanResult = {
        changedInterviews: [],
        unchangedInterviews: [],
        newlyUnscheduled: [],
        cancelledInterviews: [],
        diff: []
    };

    const affected = interviews.filter(
        (i) => i.panelId === panelId && i.status === "scheduled"
    );

    if (affected.length === 0) return result;

    const disruptedPanel = panels.find((p) => p.panelId === panelId);
    if (disruptedPanel) disruptedPanel.status = "disrupted";

    const sorted = sortByPriority(affected, companies);
    const committedInterviews = interviews.filter((i) => !affected.includes(i));

    for (const interview of sorted) {
        captureSnapshot(interview);

        const companyId = interview.companyId;

        // try the same time slot first, then fall back to other windows
        const sameWindowCandidates: { startTime: Date; endTime: Date }[] = [];
        if (interview.startTime && interview.endTime) {
            sameWindowCandidates.push({
                startTime: interview.startTime,
                endTime: interview.endTime
            });
        }

        // then everything else as fallback
        const otherWindows = findPossibleTimeWindows(timeSlots, interview.duration)
            .filter((w) => w.startTime.getTime() !== interview.startTime?.getTime());

        const candidates = [...sameWindowCandidates, ...otherWindows];
        let rescheduled = false;

        for (const win of candidates) {
            if (hasStudentConflict(committedInterviews, interview.studentId, win.startTime, win.endTime))
                continue;

            const availablePanels = panels.filter(
                (p) => p.panelId !== panelId &&
                    p.companyId === companyId &&
                    p.status === "available" &&
                    !hasPanelConflict(committedInterviews, p.panelId, win.startTime, win.endTime)
            );
            if (availablePanels.length === 0) continue;

            const chosenPanel = availablePanels[0];

            const currentRoom = rooms.find((r) => r.roomId === interview.roomId);
            let chosenRoom: IRoom | null = null;

            if (
                currentRoom &&
                currentRoom.status === "AVAILABLE" &&
                !hasRoomConflict(committedInterviews, currentRoom.roomId, win.startTime, win.endTime)
            ) {
                chosenRoom = currentRoom;
            } else {
                chosenRoom = findAvailableRoomForTime(rooms, committedInterviews, win.startTime, win.endTime);
            }
            if (!chosenRoom) continue;

            interview.startTime = win.startTime;
            interview.endTime = win.endTime;
            interview.panelId = chosenPanel.panelId;
            interview.roomId = chosenRoom.roomId;
            interview.status = "scheduled";

            const trace = `PANEL_UNAVAILABLE: panel ${panelId} dropped out. Reassigned to ${chosenPanel.panelId}`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            committedInterviews.push(interview);
            result.changedInterviews.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "PANEL_UNAVAILABLE",
                `Panel ${panelId} became unavailable. Reassigned to panel ${chosenPanel.panelId}.`
            ));
            rescheduled = true;
            break;
        }

        if (!rescheduled) {
            interview.status = "unscheduled";
            interview.failureReason = "PANEL_UNAVAILABLE";
            interview.failureDetails =
                `Panel ${panelId} is unavailable and no replacement panel was found for company ${companyId}.`;
            const trace = `PANEL_UNAVAILABLE: no replacement panel found for company ${companyId}`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            result.newlyUnscheduled.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "PANEL_UNAVAILABLE",
                `Panel ${panelId} unavailable and no replacement found.`
            ));
        }
    }

    result.unchangedInterviews = interviews.filter((i) => !affected.includes(i));
    return result;
}

export function replanStudentWithdrawal(
    interviews: IInterview[],
    studentId: string
): IReplanResult {

    const result: IReplanResult = {
        changedInterviews: [],
        unchangedInterviews: [],
        newlyUnscheduled: [],
        cancelledInterviews: [],
        diff: []
    };

    const now = new Date();

    const affected = interviews.filter(
        (i) =>
            i.studentId === studentId &&
            (i.status === "pending" || i.status === "scheduled") &&
            (i.startTime === undefined || i.startTime > now)
    );

    for (const interview of affected) {
        captureSnapshot(interview);
        interview.status = "cancelled";
        interview.failureReason = "STUDENT_WITHDRAWAL";
        interview.failureDetails = `Student ${studentId} has withdrawn from placement.`;
        const trace = `STUDENT_WITHDRAWAL: interview cancelled — student ${studentId} withdrew`;
        interview.reasonTrace = [...(interview.reasonTrace || []), trace];

        result.cancelledInterviews.push(interview);
        result.diff.push(buildDiffEntry(
            interview,
            "STUDENT_WITHDRAWAL",
            `Student ${studentId} withdrew from placement. All pending/scheduled interviews cancelled.`
        ));
    }

    result.unchangedInterviews = interviews.filter((i) => !affected.includes(i));
    return result;
}


export function replanRoomUnavailable(
    interviews: IInterview[],
    roomId: string,
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[],
    companies: ICompany[]
): IReplanResult {

    const result: IReplanResult = {
        changedInterviews: [],
        unchangedInterviews: [],
        newlyUnscheduled: [],
        cancelledInterviews: [],
        diff: []
    };

    const unavailableRoom = rooms.find((r) => r.roomId === roomId);
    if (unavailableRoom) unavailableRoom.status = "UNAVAILABLE";

    const affected = interviews.filter(
        (i) => i.roomId === roomId && i.status === "scheduled"
    );

    if (affected.length === 0) return result;

    const sorted = sortByPriority(affected, companies);
    const committedInterviews = interviews.filter((i) => !affected.includes(i));

    for (const interview of sorted) {
        captureSnapshot(interview);

        // same time window first, then fall through
        const sameTimeWindow = interview.startTime && interview.endTime
            ? [{ startTime: interview.startTime, endTime: interview.endTime }]
            : [];

        const otherWindows = findPossibleTimeWindows(timeSlots, interview.duration)
            .filter((w) => w.startTime.getTime() !== interview.startTime?.getTime());

        const candidates = [...sameTimeWindow, ...otherWindows];
        let rescheduled = false;

        for (const win of candidates) {
            if (hasStudentConflict(committedInterviews, interview.studentId, win.startTime, win.endTime))
                continue;

            const currentPanel = panels.find((p) => p.panelId === interview.panelId);
            let chosenPanel: IPanel | null = null;

            if (
                currentPanel &&
                currentPanel.status === "available" &&
                !hasPanelConflict(committedInterviews, currentPanel.panelId, win.startTime, win.endTime)
            ) {
                chosenPanel = currentPanel;
            } else {
                chosenPanel = findAvailablePanelForTime(
                    panels, committedInterviews, interview.companyId, win.startTime, win.endTime
                );
            }
            if (!chosenPanel) continue;

            // different room required
            const alternateRoom = rooms.find(
                (r) =>
                    r.roomId !== roomId &&
                    r.status === "AVAILABLE" &&
                    !hasRoomConflict(committedInterviews, r.roomId, win.startTime, win.endTime)
            );
            if (!alternateRoom) continue;

            interview.startTime = win.startTime;
            interview.endTime = win.endTime;
            interview.panelId = chosenPanel.panelId;
            interview.roomId = alternateRoom.roomId;
            interview.status = "scheduled";

            const trace = `ROOM_UNAVAILABLE: room ${roomId} unavailable. Moved to room ${alternateRoom.roomId}`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            committedInterviews.push(interview);
            result.changedInterviews.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "ROOM_UNAVAILABLE",
                `Room ${roomId} became unavailable. Reassigned to room ${alternateRoom.roomId}.`
            ));
            rescheduled = true;
            break;
        }

        if (!rescheduled) {
            interview.status = "unscheduled";
            interview.failureReason = "ROOM_UNAVAILABLE";
            interview.failureDetails =
                `Room ${roomId} is unavailable and no alternative room was found.`;
            const trace = `ROOM_UNAVAILABLE: no alternate room found — interview unscheduled`;
            interview.reasonTrace = [...(interview.reasonTrace || []), trace];

            result.newlyUnscheduled.push(interview);
            result.diff.push(buildDiffEntry(
                interview,
                "ROOM_UNAVAILABLE",
                `Room ${roomId} unavailable and no alternative room found.`
            ));
        }
    }

    result.unchangedInterviews = interviews.filter((i) => !affected.includes(i));
    return result;
}


export function replanCompound(
    interviews: IInterview[],
    disruption: ICompoundDisruption,
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[],
    companies: ICompany[]
): IReplanResult {

    const combinedResult: IReplanResult = {
        changedInterviews: [],
        unchangedInterviews: [],
        newlyUnscheduled: [],
        cancelledInterviews: [],
        diff: []
    };

    // step 1: withdrawal (fewest side-effects, run first)
    if (disruption.studentWithdrawal) {
        const r = replanStudentWithdrawal(interviews, disruption.studentWithdrawal.studentId);
        combinedResult.cancelledInterviews.push(...r.cancelledInterviews);
        combinedResult.diff.push(...r.diff);
    }

    // step 2: company delay
    if (disruption.companyDelay) {
        const r = replanCompanyDelay(
            interviews,
            disruption.companyDelay.companyId,
            disruption.companyDelay.delayHours,
            timeSlots, panels, rooms, companies
        );
        combinedResult.changedInterviews.push(...r.changedInterviews);
        combinedResult.newlyUnscheduled.push(...r.newlyUnscheduled);
        combinedResult.diff.push(...r.diff);
    }

    // step 3: panel
    if (disruption.panelUnavailable) {
        const r = replanPanelUnavailable(
            interviews,
            disruption.panelUnavailable.panelId,
            timeSlots, panels, rooms, companies
        );
        combinedResult.changedInterviews.push(...r.changedInterviews);
        combinedResult.newlyUnscheduled.push(...r.newlyUnscheduled);
        combinedResult.diff.push(...r.diff);
    }

    // step 4: room
    if (disruption.roomUnavailable) {
        const r = replanRoomUnavailable(
            interviews,
            disruption.roomUnavailable.roomId,
            timeSlots, panels, rooms, companies
        );
        combinedResult.changedInterviews.push(...r.changedInterviews);
        combinedResult.newlyUnscheduled.push(...r.newlyUnscheduled);
        combinedResult.diff.push(...r.diff);
    }

    const allChangedIds = new Set([
        ...combinedResult.changedInterviews.map((i) => i.interviewId),
        ...combinedResult.cancelledInterviews.map((i) => i.interviewId),
        ...combinedResult.newlyUnscheduled.map((i) => i.interviewId)
    ]);
    combinedResult.unchangedInterviews = interviews.filter(
        (i) => !allChangedIds.has(i.interviewId)
    );

    return combinedResult;
}
