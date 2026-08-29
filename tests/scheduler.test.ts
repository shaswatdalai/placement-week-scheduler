import generateSchedule from "../src/services/scheduler.service";
import { IInterview } from "../src/models/interview.model";
import { IStudent } from "../src/models/student.model";
import { ICompany } from "../src/models/company.model";
import { IPanel } from "../src/models/panel.model";
import { IRoom } from "../src/models/room.model";
import { ITimeSlot } from "../src/models/timeslot.model";

describe("Deterministic Scheduler Service", () => {
  // Helper to make Date objects
  const makeDate = (offsetMin: number) => {
    return new Date(new Date("2025-11-03T09:00:00.000Z").getTime() + offsetMin * 60 * 1000);
  };

  let mockStudents: IStudent[];
  let mockCompanies: ICompany[];
  let mockPanels: IPanel[];
  let mockRooms: IRoom[];
  let mockTimeSlots: ITimeSlot[];
  let mockInterviews: IInterview[];

  beforeEach(() => {
    mockStudents = [
      { studentId: "STU-01", name: "Student 1", cgpa: 9.0, branch: "CSE", status: "ACTIVE" },
      { studentId: "STU-02", name: "Student 2", cgpa: 6.5, branch: "ECE", status: "ACTIVE" },
      { studentId: "STU-03", name: "Student 3", cgpa: 8.0, branch: "ME", status: "ACTIVE" },
    ] as any[];

    mockCompanies = [
      { companyId: "COMP-01", name: "Google", minimumCGPA: 8.5, eligibleBranches: ["CSE"], interviewDuration: 60, priority: 1 },
      { companyId: "COMP-02", name: "Infosys", minimumCGPA: 6.0, eligibleBranches: ["CSE", "ECE", "ME"], interviewDuration: 30, priority: 3 },
    ] as any[];

    mockPanels = [
      { panelId: "PANEL-01", companyId: "COMP-01", status: "available" },
      { panelId: "PANEL-02", companyId: "COMP-02", status: "available" },
    ] as any[];

    mockRooms = [
      { roomId: "ROOM-01", status: "AVAILABLE" },
      { roomId: "ROOM-02", status: "AVAILABLE" },
    ] as any[];

    // 4 time slots of 30 mins each: 09:00, 09:30, 10:00, 10:30
    mockTimeSlots = [
      { slotId: "SLOT-01", startTime: makeDate(0), endTime: makeDate(30), status: "AVAILABLE" },
      { slotId: "SLOT-02", startTime: makeDate(30), endTime: makeDate(60), status: "AVAILABLE" },
      { slotId: "SLOT-03", startTime: makeDate(60), endTime: makeDate(90), status: "AVAILABLE" },
      { slotId: "SLOT-04", startTime: makeDate(90), endTime: makeDate(120), status: "AVAILABLE" },
    ] as any[];

    mockInterviews = [];
  });

  test("should successfully schedule eligible student interview", () => {
    mockInterviews = [
      { interviewId: "INT-01", studentId: "STU-01", companyId: "COMP-01", duration: 60, status: "pending", reasonTrace: [] } as any
    ];

    const result = generateSchedule(
      mockInterviews,
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies,
      mockStudents
    );

    expect(result[0].status).toBe("scheduled");
    expect(result[0].roomId).toBe("ROOM-01");
    expect(result[0].panelId).toBe("PANEL-01");
    expect(result[0].startTime).toEqual(makeDate(0));
    expect(result[0].endTime).toEqual(makeDate(60)); // 60 mins duration requires SLOT-01 + SLOT-02
  });

  test("should fail with INELIGIBLE_CGPA when student CGPA is too low", () => {
    mockInterviews = [
      { interviewId: "INT-01", studentId: "STU-03", companyId: "COMP-01", duration: 60, status: "pending", reasonTrace: [] } as any
    ];

    const result = generateSchedule(
      mockInterviews,
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies,
      mockStudents
    );

    expect(result[0].status).toBe("unscheduled");
    expect(result[0].failureReason).toBe("INELIGIBLE_CGPA");
    expect(result[0].reasonTrace![0]).toContain("INELIGIBLE_CGPA");
  });

  test("should fail with INELIGIBLE_BRANCH when student branch is not eligible", () => {
    mockInterviews = [
      { interviewId: "INT-01", studentId: "STU-03", companyId: "COMP-01", duration: 60, status: "pending", reasonTrace: [] } as any
    ];
    // Change Student 3 CGPA to pass CGPA check but fail branch check (branch ME not in Google CSE list)
    mockStudents[2].cgpa = 9.5;

    const result = generateSchedule(
      mockInterviews,
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies,
      mockStudents
    );

    expect(result[0].status).toBe("unscheduled");
    expect(result[0].failureReason).toBe("INELIGIBLE_BRANCH");
  });

  test("should prioritize scheduling priority 1 company interviews before priority 3", () => {
    // Both STU-01 interviews are pending.
    // Google is priority 1, Infosys is priority 3.
    // They both request STU-01 and there is a conflict.
    mockInterviews = [
      { interviewId: "INT-02", studentId: "STU-01", companyId: "COMP-02", duration: 30, status: "pending", reasonTrace: [] } as any,
      { interviewId: "INT-01", studentId: "STU-01", companyId: "COMP-01", duration: 60, status: "pending", reasonTrace: [] } as any,
    ];

    const result = generateSchedule(
      mockInterviews,
      mockTimeSlots,
      mockPanels,
      mockRooms,
      mockCompanies,
      mockStudents
    );

    const intGoogle = result.find(i => i.interviewId === "INT-01")!;
    const intInfosys = result.find(i => i.interviewId === "INT-02")!;

    // Google (priority 1) schedules first, takes 09:00 - 10:00 (SLOT-01 and SLOT-02)
    expect(intGoogle.status).toBe("scheduled");
    expect(intGoogle.startTime).toEqual(makeDate(0));

    // Infosys (priority 3) schedules next, finds Student Conflict at 09:00 and 09:30, and schedules at 10:00 (SLOT-03)
    expect(intInfosys.status).toBe("scheduled");
    expect(intInfosys.startTime).toEqual(makeDate(60));
  });
});
