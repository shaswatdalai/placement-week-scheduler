import { ITimeSlot } from "../models/timeslot.model";
import { IPanel } from "../models/panel.model";
import { IRoom } from "../models/room.model";
import { IInterview } from "../models/interview.model";
import { ICompany } from "../models/company.model";
import { IStudent } from "../models/student.model";


// true if any scheduled interview in the list overlaps [start, end)
const hasInterviewConflict = (
    interviews: IInterview[],
    startTime: Date,
    endTime: Date
): boolean => {
    return interviews.some(
        (interview) =>
            interview.status === "scheduled" &&
            interview.startTime !== undefined &&
            interview.endTime !== undefined &&
            interview.startTime < endTime &&
            interview.endTime > startTime
    );
};


const hasStudentConflict = (
    interviews: IInterview[],
    studentId: string,
    startTime: Date,
    endTime: Date
): boolean => {
    const studentInterviews = interviews.filter(
        (interview) => interview.studentId === studentId
    );
    return hasInterviewConflict(studentInterviews, startTime, endTime);
};


const hasPanelConflict = (
    interviews: IInterview[],
    panelId: string,
    startTime: Date,
    endTime: Date
): boolean => {
    const panelInterviews = interviews.filter(
        (interview) => interview.panelId === panelId
    );
    return hasInterviewConflict(panelInterviews, startTime, endTime);
};


const hasRoomConflict = (
    interviews: IInterview[],
    roomId: string,
    startTime: Date,
    endTime: Date
): boolean => {
    const roomInterviews = interviews.filter(
        (interview) => interview.roomId === roomId
    );
    return hasInterviewConflict(roomInterviews, startTime, endTime);
};


interface ITimeWindow {
    startTime: Date;
    endTime: Date;
}


// Scans AVAILABLE slots (sorted chronologically) and finds every consecutive
// block whose total length >= interview duration.
const findPossibleTimeWindows = (
    timeSlots: ITimeSlot[],
    duration: number
): ITimeWindow[] => {
    const availableSlots = timeSlots
        .filter((slot) => slot.status === "AVAILABLE")
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const possibleWindows: ITimeWindow[] = [];

    for (let i = 0; i < availableSlots.length; i++) {
        const startTime = availableSlots[i].startTime;
        let endTime = startTime;

        for (let j = i; j < availableSlots.length; j++) {
            const currentSlot = availableSlots[j];

            // Slots must be contiguous — no gaps allowed
            if (currentSlot.startTime.getTime() !== endTime.getTime()) {
                break;
            }

            endTime = currentSlot.endTime;

            const durationInMinutes =
                (endTime.getTime() - startTime.getTime()) / (1000 * 60);

            if (durationInMinutes >= duration) {
                possibleWindows.push({
                    startTime,
                    endTime: new Date(startTime.getTime() + duration * 60 * 1000)
                });
                break;
            }
        }
    }

    return possibleWindows;
};


const findAvailablePanelForTime = (
    panels: IPanel[],
    interviews: IInterview[],
    companyId: string,
    startTime: Date,
    endTime: Date
): IPanel | null => {
    const availablePanel = panels.find(
        (panel) =>
            panel.companyId === companyId &&
            panel.status === "available" &&
            !hasPanelConflict(interviews, panel.panelId, startTime, endTime)
    );
    return availablePanel || null;
};


const findAvailableRoomForTime = (
    rooms: IRoom[],
    interviews: IInterview[],
    startTime: Date,
    endTime: Date
): IRoom | null => {
    const availableRoom = rooms.find(
        (room) =>
            room.status === "AVAILABLE" &&
            !hasRoomConflict(interviews, room.roomId, startTime, endTime)
    );
    return availableRoom || null;
};


// Mutates the interview in-place with the chosen slot, panel, and room.
const assignInterview = (
    interview: IInterview,
    timeWindow: ITimeWindow,
    panel: IPanel,
    room: IRoom
): IInterview => {
    interview.startTime = timeWindow.startTime;
    interview.endTime = timeWindow.endTime;
    interview.panelId = panel.panelId;
    interview.roomId = room.roomId;
    interview.status = "scheduled";
    return interview;
};


// Schedules every "pending" interview in company-priority order.
// For each interview: eligibility → time windows → student/panel/room conflicts → assign.
// Records a reasonTrace on every interview regardless of outcome.
const generateSchedule = (
    interviews: IInterview[],
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[],
    companies: ICompany[],
    students: IStudent[]
): IInterview[] => {

    const pendingInterviews = interviews
        .filter((interview) => interview.status === "pending")
        .sort((a, b) => {
            const companyA = companies.find((c) => c.companyId === a.companyId);
            const companyB = companies.find((c) => c.companyId === b.companyId);
            // 999 fallback when company not found → lowest priority
            return (companyA?.priority ?? 999) - (companyB?.priority ?? 999);
        });

    for (const interview of pendingInterviews) {
        const trace: string[] = [];
        let failureReason = "";
        let failureDetails = "";

        // eligibility
        const student = students.find((s) => s.studentId === interview.studentId);
        const company = companies.find((c) => c.companyId === interview.companyId);

        if (!student || !company) {
            interview.status = "unscheduled";
            interview.failureReason = "NO_FEASIBLE_ASSIGNMENT";
            interview.failureDetails = `Student ${interview.studentId} or Company ${interview.companyId} not found.`;
            interview.reasonTrace = ["UNSCHEDULED: student or company record missing"];
            continue;
        }

        // CGPA check
        if (student.cgpa < company.minimumCGPA) {
            interview.status = "unscheduled";
            interview.failureReason = "INELIGIBLE_CGPA";
            interview.failureDetails =
                `Student CGPA ${student.cgpa} is below the required ${company.minimumCGPA} for ${company.name}.`;
            interview.reasonTrace = [
                `UNSCHEDULED: INELIGIBLE_CGPA — student CGPA ${student.cgpa} < required ${company.minimumCGPA}`
            ];
            continue;
        }

        // Branch eligibility check
        if (!company.eligibleBranches.includes(student.branch)) {
            interview.status = "unscheduled";
            interview.failureReason = "INELIGIBLE_BRANCH";
            interview.failureDetails =
                `Student branch '${student.branch}' is not eligible for ${company.name}. Eligible: ${company.eligibleBranches.join(", ")}.`;
            interview.reasonTrace = [
                `UNSCHEDULED: INELIGIBLE_BRANCH — branch '${student.branch}' not in [${company.eligibleBranches.join(", ")}]`
            ];
            continue;
        }

        trace.push(`Eligible: CGPA ${student.cgpa} >= ${company.minimumCGPA}, branch '${student.branch}' accepted`);

        // find feasible time windows
        const possibleTimeWindows = findPossibleTimeWindows(timeSlots, interview.duration);

        if (possibleTimeWindows.length === 0) {
            interview.status = "unscheduled";
            interview.failureReason = "NO_TIME_WINDOW";
            interview.failureDetails = `No available time window found for ${interview.duration} minutes.`;
            trace.push(`UNSCHEDULED: NO_TIME_WINDOW — no ${interview.duration}-min block in available slots`);
            interview.reasonTrace = trace;
            continue;
        }

        trace.push(`Found ${possibleTimeWindows.length} candidate time window(s)`);

        for (const timeWindow of possibleTimeWindows) {
            const windowLabel = `${timeWindow.startTime.toISOString()}`;

            // 1. student conflict
            const studentConflict = hasStudentConflict(
                interviews,
                interview.studentId,
                timeWindow.startTime,
                timeWindow.endTime
            );

            if (studentConflict) {
                failureReason = "STUDENT_CONFLICT";
                failureDetails = `Student ${interview.studentId} already has an interview during this time.`;
                trace.push(`Rejected ${windowLabel} — STUDENT_CONFLICT`);
                continue;
            }

            // 2. panel
            const panel = findAvailablePanelForTime(
                panels,
                interviews,
                interview.companyId,
                timeWindow.startTime,
                timeWindow.endTime
            );

            if (!panel) {
                failureReason = "PANEL_UNAVAILABLE";
                failureDetails = `No available panel for company ${interview.companyId} during this time.`;
                trace.push(`Rejected ${windowLabel} — PANEL_UNAVAILABLE`);
                continue;
            }

            // 3. room
            const room = findAvailableRoomForTime(
                rooms,
                interviews,
                timeWindow.startTime,
                timeWindow.endTime
            );

            if (!room) {
                failureReason = "ROOM_UNAVAILABLE";
                failureDetails = `No available room during this time.`;
                trace.push(`Rejected ${windowLabel} — ROOM_UNAVAILABLE`);
                continue;
            }

            // all checks passed — assign
            assignInterview(interview, timeWindow, panel, room);

            trace.push(
                `SCHEDULED at ${windowLabel} — Panel ${panel.panelId}, Room ${room.roomId}`
            );
            interview.reasonTrace = trace;
            break;
        }

        if (interview.status !== "scheduled") {
            interview.status = "unscheduled";
            interview.failureReason = failureReason || "NO_FEASIBLE_ASSIGNMENT";
            interview.failureDetails =
                failureDetails || "No suitable slot, panel, or room was found.";
            interview.reasonTrace = trace;
        }
    }

    return interviews;
};

export {
    hasInterviewConflict,
    hasStudentConflict,
    hasPanelConflict,
    hasRoomConflict,
    findPossibleTimeWindows,
    findAvailablePanelForTime,
    findAvailableRoomForTime,
    assignInterview
};

export default generateSchedule;