import {
  replanCompanyDelay,
  replanPanelUnavailable,
  replanStudentWithdrawal,
  replanRoomUnavailable,
  replanCompound
} from "../src/services/replanner.service";
import { IInterview } from "../src/models/interview.model";
import { IStudent } from "../src/models/student.model";
import { ICompany } from "../src/models/company.model";
import { IPanel } from "../src/models/panel.model";
import { IRoom } from "../src/models/room.model";
import { ITimeSlot } from "../src/models/timeslot.model";

describe("Replanner Service - Minimum Disturbance Engine", () => {
  const makeDate = (offsetMin: number) => {
    return new Date(new Date("2035-11-03T09:00:00.000Z").getTime() + offsetMin * 60 * 1000);
  };

  let mockInterviews: IInterview[];
  let mockTimeSlots: ITimeSlot[];
  let mockPanels: IPanel[];
  let mockRooms: IRoom[];
  let mockCompanies: ICompany[];

  beforeEach(() => {
    mockInterviews = [
      {
        interviewId: "INT-01",
        studentId: "STU-01",
        companyId: "COMP-01",
        roomId: "ROOM-01",
        panelId: "PANEL-01",
        duration: 30,
        startTime: makeDate(0),
        endTime: makeDate(30),
        status: "scheduled",
        reasonTrace: [],
        snapshotBefore: undefined,
        save: jest.fn()
      } as any,
      {
        interviewId: "INT-02",
        studentId: "STU-02",
        companyId: "COMP-01",
        roomId: "ROOM-01",
        panelId: "PANEL-01",
        duration: 30,
        startTime: makeDate(30),
        endTime: makeDate(60),
        status: "scheduled",
        reasonTrace: [],
        snapshotBefore: undefined,
        save: jest.fn()
      } as any,
      {
        interviewId: "INT-03",
        studentId: "STU-03",
        companyId: "COMP-02",
        roomId: "ROOM-02",
        panelId: "PANEL-02",
        duration: 30,
        startTime: makeDate(0),
        endTime: makeDate(30),
        status: "scheduled",
        reasonTrace: [],
        snapshotBefore: undefined,
        save: jest.fn()
      } as any,
    ];

    mockTimeSlots = [
      { slotId: "SLOT-01", startTime: makeDate(0), endTime: makeDate(30), status: "AVAILABLE" },
      { slotId: "SLOT-02", startTime: makeDate(30), endTime: makeDate(60), status: "AVAILABLE" },
      { slotId: "SLOT-03", startTime: makeDate(60), endTime: makeDate(90), status: "AVAILABLE" },
      { slotId: "SLOT-04", startTime: makeDate(90), endTime: makeDate(120), status: "AVAILABLE" },
    ] as any[];

    mockPanels = [
      { panelId: "PANEL-01", companyId: "COMP-01", status: "available" },
      { panelId: "PANEL-02", companyId: "COMP-02", status: "available" },
      { panelId: "PANEL-03", companyId: "COMP-01", status: "available" },
    ] as any[];

    mockRooms = [
      { roomId: "ROOM-01", status: "AVAILABLE" },
      { roomId: "ROOM-02", status: "AVAILABLE" },
      { roomId: "ROOM-03", status: "AVAILABLE" },
    ] as any[];

    mockCompanies = [
      { companyId: "COMP-01", name: "Google", minimumCGPA: 8.0, eligibleBranches: ["CSE"], interviewDuration: 30, priority: 1 },
      { companyId: "COMP-02", name: "Infosys", minimumCGPA: 6.0, eligibleBranches: ["CSE"], interviewDuration: 30, priority: 2 },
    ] as any[];
  });

  test("replanCompanyDelay should shift only target company's interviews", () => {
    const result = replanCompanyDelay(
      mockInterviews,
      "COMP-01",
      1,
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies
    );

    expect(result.unchangedInterviews.map((i) => i.interviewId)).toContain("INT-03");

    const rescheduled01 = result.changedInterviews.find((i) => i.interviewId === "INT-01")!;
    const rescheduled02 = result.changedInterviews.find((i) => i.interviewId === "INT-02")!;

    expect(rescheduled01.startTime!.getTime()).toBeGreaterThanOrEqual(makeDate(60).getTime());
    expect(rescheduled02.startTime!.getTime()).toBeGreaterThanOrEqual(makeDate(60).getTime());
    expect(rescheduled01.status).toBe("scheduled");
    expect(rescheduled02.status).toBe("scheduled");

    expect(result.diff.length).toBe(2);
    expect(result.diff[0].reasonCode).toBe("COMPANY_DELAY");
  });

  test("replanPanelUnavailable should reassign affected panel interviews to another panel", () => {
    const result = replanPanelUnavailable(
      mockInterviews,
      "PANEL-01",
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies
    );

    expect(result.unchangedInterviews.map((i) => i.interviewId)).toContain("INT-03");

    const moved01 = result.changedInterviews.find((i) => i.interviewId === "INT-01")!;
    const moved02 = result.changedInterviews.find((i) => i.interviewId === "INT-02")!;

    expect(moved01.panelId).toBe("PANEL-03");
    expect(moved02.panelId).toBe("PANEL-03");
    expect(result.diff.length).toBe(2);
  });

  test("replanStudentWithdrawal should cancel the student's interviews and affect no others", () => {
    const result = replanStudentWithdrawal(mockInterviews, "STU-01");

    const cancelled = result.cancelledInterviews.find((i) => i.interviewId === "INT-01")!;
    expect(cancelled.status).toBe("cancelled");

    expect(result.unchangedInterviews.map((i) => i.interviewId)).toContain("INT-02");
    expect(result.unchangedInterviews.map((i) => i.interviewId)).toContain("INT-03");
    expect(result.diff.length).toBe(1);
    expect(result.diff[0].reasonCode).toBe("STUDENT_WITHDRAWAL");
  });

  test("replanRoomUnavailable should migrate interviews to another room at the same time", () => {
    const result = replanRoomUnavailable(
      mockInterviews,
      "ROOM-01",
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies
    );

    expect(result.unchangedInterviews.map((i) => i.interviewId)).toContain("INT-03");

    const moved01 = result.changedInterviews.find((i) => i.interviewId === "INT-01")!;
    const moved02 = result.changedInterviews.find((i) => i.interviewId === "INT-02")!;

    // INT-01 should move to ROOM-03 because ROOM-02 is busy from 09:00 - 09:30
    expect(moved01.roomId).toBe("ROOM-03");
    expect(moved01.startTime).toEqual(makeDate(0));

    // INT-02 can move to ROOM-02 because ROOM-02 is free from 09:30 - 10:00
    expect(moved02.roomId).toBe("ROOM-02");
    expect(moved02.startTime).toEqual(makeDate(30));
  });
});
