import { ITimeSlot } from "../models/timeslot.model";
import { IPanel } from "../models/panel.model";
import { IRoom } from "../models/room.model";
import { IInterview } from "../models/interview.model";

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


const findAvailableRoom = (
  rooms: IRoom[]
): IRoom | null => {

  const availableRoom = rooms.find(
    (room) => room.status === "AVAILABLE"
  );

  return availableRoom || null;
};




const findAvailablePanel = (
  panels: IPanel[],
  companyId: string//the company which is looking for an available panel is passed as a parameter
): IPanel | null => {

  const availablePanel = panels.find(//first available panel for the company is returned. If no available panel is found, null is returned.
    (panel) =>
      panel.companyId === companyId &&//does this panel belong to the company which is looking for an available panel and is it available?
      panel.status === "available"
  );

  return availablePanel || null;
};



interface ITimeWindow {
  startTime: Date;
  endTime: Date;
}
const findAvailableTime = (
  timeSlots: ITimeSlot[],
  duration: number
): ITimeWindow | null => {
  const availableSlots = timeSlots
    .filter((slot) => slot.status === "AVAILABLE")//show the slots which are available
    .sort(
      (a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    );

  for (let i = 0; i < availableSlots.length; i++) {
    const startTime = availableSlots[i].startTime;

    let endTime = startTime;

    for (let j = i; j < availableSlots.length; j++) {
      const currentSlot = availableSlots[j];

      if (currentSlot.startTime.getTime() !== endTime.getTime()) {//this checks whether the next slot starts exactly when the previous slot ends. If not, it breaks the loop and moves to the next available slot.
        break;
      }

      endTime = currentSlot.endTime;

      const durationInMinutes =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      if (durationInMinutes >= duration) {
        return {
          startTime,
          endTime
        };
      }
    }
  }

  return null;
};

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

