import { computeMetrics } from "../src/services/metrics.service";
import { IInterview } from "../src/models/interview.model";
import { IRoom } from "../src/models/room.model";
import { IPanel } from "../src/models/panel.model";

describe("Metrics Service", () => {
  const makeDate = (offsetMin: number) => {
    return new Date(new Date("2025-11-03T09:00:00.000Z").getTime() + offsetMin * 60 * 1000);
  };

  let mockInterviews: IInterview[];
  let mockRooms: IRoom[];
  let mockPanels: IPanel[];

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
        status: "scheduled"
      } as any,
      // Consecutive student interview for STU-01 (gap of 30 mins)
      {
        interviewId: "INT-02",
        studentId: "STU-01",
        companyId: "COMP-02",
        roomId: "ROOM-02",
        panelId: "PANEL-02",
        duration: 30,
        startTime: makeDate(60),
        endTime: makeDate(90),
        status: "scheduled"
      } as any,
      {
        interviewId: "INT-03",
        studentId: "STU-02",
        companyId: "COMP-01",
        roomId: "ROOM-01",
        panelId: "PANEL-01",
        duration: 45,
        startTime: makeDate(30),
        endTime: makeDate(75),
        status: "scheduled"
      } as any,
      {
        interviewId: "INT-04",
        studentId: "STU-03",
        companyId: "COMP-02",
        status: "unscheduled"
      } as any,
    ];

    mockRooms = [
      { roomId: "ROOM-01", status: "AVAILABLE" },
      { roomId: "ROOM-02", status: "AVAILABLE" },
    ] as any[];

    mockPanels = [
      { panelId: "PANEL-01", companyId: "COMP-01", status: "available" },
      { panelId: "PANEL-02", companyId: "COMP-02", status: "available" },
    ] as any[];
  });

  test("should compute correct overall scheduling metrics", () => {
    const result = computeMetrics(mockInterviews, mockRooms, mockPanels);

    expect(result.totalInterviews).toBe(4);
    expect(result.scheduledCount).toBe(3);
    expect(result.unscheduledCount).toBe(1);
    expect(result.scheduledPercent).toBe(75); // 3 out of 4
  });

  test("should compute correct room utilization details", () => {
    const result = computeMetrics(mockInterviews, mockRooms, mockPanels);

    // ROOM-01 has INT-01 (30m) + INT-03 (45m) = 75m total
    const room01 = result.roomUtilization.find((r) => r.roomId === "ROOM-01")!;
    expect(room01.totalMinutesUsed).toBe(75);
    expect(room01.scheduledInterviews).toBe(2);

    // ROOM-02 has INT-02 (30m) = 30m total
    const room02 = result.roomUtilization.find((r) => r.roomId === "ROOM-02")!;
    expect(room02.totalMinutesUsed).toBe(30);
    expect(room02.scheduledInterviews).toBe(1);
  });

  test("should compute correct student wait times", () => {
    const result = computeMetrics(mockInterviews, mockRooms, mockPanels);

    // STU-01 has INT-01 (ending at 09:30, i.e. offset 30) and INT-02 (starting at 10:00, i.e. offset 60)
    // Wait time gap = 60 - 30 = 30 mins
    expect(result.averageWaitTimeMinutes).toBe(30);
  });
});
