// Database orchestration for replanning.
// Loads data, runs the in-memory replanner, persists touched interviews, records the disruption.

import Interview from "../models/interview.model";
import TimeSlot from "../models/timeslot.model";
import Panel from "../models/panel.model";
import Room from "../models/room.model";
import Company from "../models/company.model";
import Student from "../models/student.model";
import Disruption, { IDisruption } from "../models/disruption.model";

import {
    replanCompanyDelay,
    replanPanelUnavailable,
    replanStudentWithdrawal,
    replanRoomUnavailable,
    replanCompound,
    ICompoundDisruption,
    IReplanResult
} from "./replanner.service";


async function saveAffectedInterviews(result: IReplanResult): Promise<void> {
    const touched = [
        ...result.changedInterviews,
        ...result.cancelledInterviews,
        ...result.newlyUnscheduled
    ];
    for (const interview of touched) {
        await interview.save();
    }
}

function computeMetricsDelta(result: IReplanResult) {
    return {
        interviewsMoved: result.changedInterviews.length,
        interviewsCancelled: result.cancelledInterviews.length,
        interviewsUnscheduled: result.newlyUnscheduled.length,
        interviewsUnchanged: result.unchangedInterviews.length
    };
}



export async function runCompanyDelay(companyId: string, delayHours: number) {
    const [interviews, timeSlots, panels, rooms, companies] = await Promise.all([
        Interview.find(),
        TimeSlot.find(),
        Panel.find(),
        Room.find(),
        Company.find()
    ]);

    const result = replanCompanyDelay(
        interviews, companyId, delayHours, timeSlots, panels, rooms, companies
    );

    await saveAffectedInterviews(result);

    const disruption = await Disruption.create({
        type: "COMPANY_DELAY",
        payload: { companyId, delayHours },
        diff: result.diff as unknown as Record<string, unknown>[],
        metrics: computeMetricsDelta(result)
    }) as IDisruption;

    return { disruption, result };
}

export async function runPanelUnavailable(panelId: string) {
    const [interviews, timeSlots, panels, rooms, companies] = await Promise.all([
        Interview.find(),
        TimeSlot.find(),
        Panel.find(),
        Room.find(),
        Company.find()
    ]);

    await Panel.findOneAndUpdate({ panelId }, { status: "disrupted" });

    const result = replanPanelUnavailable(
        interviews, panelId, timeSlots, panels, rooms, companies
    );

    await saveAffectedInterviews(result);

    const disruption = await Disruption.create({
        type: "PANEL_UNAVAILABLE",
        payload: { panelId },
        diff: result.diff as unknown as Record<string, unknown>[],
        metrics: computeMetricsDelta(result)
    }) as IDisruption;

    return { disruption, result };
}

export async function runStudentWithdrawal(studentId: string) {
    const interviews = await Interview.find();

    const result = replanStudentWithdrawal(interviews, studentId);

    await Student.findOneAndUpdate({ studentId }, { status: "WITHDRAWN" });

    await saveAffectedInterviews(result);

    const disruption = await Disruption.create({
        type: "STUDENT_WITHDRAWAL",
        payload: { studentId },
        diff: result.diff as unknown as Record<string, unknown>[],
        metrics: computeMetricsDelta(result)
    }) as IDisruption;

    return { disruption, result };
}

export async function runRoomUnavailable(roomId: string) {
    const [interviews, timeSlots, panels, rooms, companies] = await Promise.all([
        Interview.find(),
        TimeSlot.find(),
        Panel.find(),
        Room.find(),
        Company.find()
    ]);

    await Room.findOneAndUpdate({ roomId }, { status: "UNAVAILABLE" });

    const result = replanRoomUnavailable(
        interviews, roomId, timeSlots, panels, rooms, companies
    );

    await saveAffectedInterviews(result);

    const disruption = await Disruption.create({
        type: "ROOM_UNAVAILABLE",
        payload: { roomId },
        diff: result.diff as unknown as Record<string, unknown>[],
        metrics: computeMetricsDelta(result)
    }) as IDisruption;

    return { disruption, result };
}

export async function runCompound(disruption: ICompoundDisruption) {
    const [interviews, timeSlots, panels, rooms, companies] = await Promise.all([
        Interview.find(),
        TimeSlot.find(),
        Panel.find(),
        Room.find(),
        Company.find()
    ]);

    if (disruption.panelUnavailable) {
        await Panel.findOneAndUpdate(
            { panelId: disruption.panelUnavailable.panelId },
            { status: "disrupted" }
        );
    }
    if (disruption.roomUnavailable) {
        await Room.findOneAndUpdate(
            { roomId: disruption.roomUnavailable.roomId },
            { status: "UNAVAILABLE" }
        );
    }
    if (disruption.studentWithdrawal) {
        await Student.findOneAndUpdate(
            { studentId: disruption.studentWithdrawal.studentId },
            { status: "WITHDRAWN" }
        );
    }

    const result = replanCompound(
        interviews, disruption, timeSlots, panels, rooms, companies
    );

    await saveAffectedInterviews(result);

    const disruptionRecord = await Disruption.create({
        type: "COMPOUND",
        payload: disruption as unknown as Record<string, unknown>,
        diff: result.diff as unknown as Record<string, unknown>[],
        metrics: computeMetricsDelta(result)
    }) as IDisruption;

    return { disruption: disruptionRecord, result };
}
