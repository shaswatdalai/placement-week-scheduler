import { ITimeSlot } from "../models/timeslot.model";
import { IPanel } from "../models/panel.model";
import { IRoom } from "../models/room.model";
import { IInterview } from "../models/interview.model";



// 1. GENERIC INTERVIEW CONFLICT


const hasInterviewConflict = (
    interviews: IInterview[],
    startTime: Date,
    endTime: Date
): boolean => {

    return interviews.some(
        (interview) =>
            interview.status === "scheduled" &&
            interview.startTime < endTime &&
            interview.endTime > startTime
    );
};



// 2. STUDENT CONFLICT


const hasStudentConflict = (
    interviews: IInterview[],
    studentId: string,
    startTime: Date,
    endTime: Date
): boolean => {

    const studentInterviews = interviews.filter(
        (interview) => interview.studentId === studentId
    );

    return hasInterviewConflict(
        studentInterviews,
        startTime,
        endTime
    );
};



// 3. PANEL CONFLICT


const hasPanelConflict = (
    interviews: IInterview[],
    panelId: string,
    startTime: Date,
    endTime: Date
): boolean => {

    const panelInterviews = interviews.filter(
        (interview) => interview.panelId === panelId
    );

    return hasInterviewConflict(
        panelInterviews,
        startTime,
        endTime
    );
};


// 4. ROOM CONFLICT


const hasRoomConflict = (
    interviews: IInterview[],
    roomId: string,
    startTime: Date,
    endTime: Date
): boolean => {

    const roomInterviews = interviews.filter(
        (interview) => interview.roomId === roomId
    );

    return hasInterviewConflict(
        roomInterviews,
        startTime,
        endTime
    );
};


// 5. TIME WINDOW INTERFACE


interface ITimeWindow {
    startTime: Date;
    endTime: Date;
}



// 6. FIND POSSIBLE TIME WINDOWS


const findPossibleTimeWindows = (
    timeSlots: ITimeSlot[],
    duration: number
): ITimeWindow[] => {

    const availableSlots = timeSlots
        .filter((slot) => slot.status === "AVAILABLE")
        .sort(
            (a, b) =>
                a.startTime.getTime() -
                b.startTime.getTime()
        );

    const possibleWindows: ITimeWindow[] = [];

    for (let i = 0; i < availableSlots.length; i++) {

        const startTime = availableSlots[i].startTime;

        let endTime = startTime;

        for (let j = i; j < availableSlots.length; j++) {

            const currentSlot = availableSlots[j];

            // Check whether the slots are continuous
            if (
                currentSlot.startTime.getTime() !==
                endTime.getTime()
            ) {
                break;
            }

            endTime = currentSlot.endTime;

            const durationInMinutes =
                (endTime.getTime() - startTime.getTime()) /
                (1000 * 60);

            if (durationInMinutes >= duration) {

                possibleWindows.push({
                    startTime,
                    endTime: new Date(
                        startTime.getTime() +
                        duration * 60 * 1000
                    )
                });

                break;
            }
        }
    }

    return possibleWindows;
};



// 7. FIND AVAILABLE PANEL FOR A PARTICULAR TIME


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
            !hasPanelConflict(
                interviews,
                panel.panelId,
                startTime,
                endTime
            )
    );

    return availablePanel || null;
};



// 8. FIND AVAILABLE ROOM FOR A PARTICULAR TIME


const findAvailableRoomForTime = (
    rooms: IRoom[],
    interviews: IInterview[],
    startTime: Date,
    endTime: Date
): IRoom | null => {

    const availableRoom = rooms.find(
        (room) =>
            room.status === "AVAILABLE" &&
            !hasRoomConflict(
                interviews,
                room.roomId,
                startTime,
                endTime
            )
    );

    return availableRoom || null;
};



// 9. ASSIGN INTERVIEW


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



// 10. MAIN SCHEDULER


const generateSchedule = (
    interviews: IInterview[],
    timeSlots: ITimeSlot[],
    panels: IPanel[],
    rooms: IRoom[]
): IInterview[] => {

    // Get only interviews which still need scheduling
    const pendingInterviews = interviews.filter(
        (interview) => interview.status === "pending"
    );

    // Process one interview at a time
    for (const interview of pendingInterviews) {

        // Find every possible time window
        // that can fit this interview's duration
        const possibleTimeWindows =
            findPossibleTimeWindows(
                timeSlots,
                interview.duration
            );

        // Try each possible time window
        for (const timeWindow of possibleTimeWindows) {


            // 1. Check student


            const studentConflict =
                hasStudentConflict(
                    interviews,
                    interview.studentId,
                    timeWindow.startTime,
                    timeWindow.endTime
                );

            if (studentConflict) {
                continue;
            }



            // 2. Find suitable panel


            const panel =
                findAvailablePanelForTime(
                    panels,
                    interviews,
                    interview.companyId,
                    timeWindow.startTime,
                    timeWindow.endTime,
                    
                );

            if (!panel) {
                continue;
            }



            // 3. Find suitable room


            const room =
                findAvailableRoomForTime(
                    rooms,
                    interviews,
                    timeWindow.startTime,
                    timeWindow.endTime
                );

            if (!room) {
                continue;
            }



            // 4. Everything works


            assignInterview(
                interview,
                timeWindow,
                panel,
                room
            );



            // 5. This interview is successfully scheduled


            break;
        }
    }

    return interviews;
};

export default generateSchedule;