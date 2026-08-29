import { IInterview } from "../models/interview.model";
import { IRoom } from "../models/room.model";
import { IPanel } from "../models/panel.model";


export interface IRoomUtilization {
    roomId: string;
    scheduledInterviews: number;
    totalMinutesUsed: number;
}

export interface IPanelUtilization {
    panelId: string;
    companyId: string;
    scheduledInterviews: number;
    totalMinutesUsed: number;
}

export interface IScheduleMetrics {
    totalInterviews: number;
    scheduledCount: number;
    unscheduledCount: number;
    cancelledCount: number;
    pendingCount: number;
    scheduledPercent: number;
    roomUtilization: IRoomUtilization[];
    overallRoomUtilPct: number;
    panelUtilization: IPanelUtilization[];
    overallPanelUtilPct: number;
    averageWaitTimeMinutes: number;
    computedAt: string;
}


export function computeMetrics(
    interviews: IInterview[],
    rooms: IRoom[],
    panels: IPanel[]
): IScheduleMetrics {

    const scheduled = interviews.filter((i) => i.status === "scheduled");
    const unscheduled = interviews.filter((i) => i.status === "unscheduled");
    const cancelled = interviews.filter((i) => i.status === "cancelled");
    const pending = interviews.filter((i) => i.status === "pending");

    // room utilization
    const roomUtil: IRoomUtilization[] = rooms.map((room) => {
        const roomInterviews = scheduled.filter((i) => i.roomId === room.roomId);
        const totalMins = roomInterviews.reduce((sum, i) => {
            if (!i.startTime || !i.endTime) return sum;
            return sum + (i.endTime.getTime() - i.startTime.getTime()) / 60000;
        }, 0);
        return {
            roomId: room.roomId,
            scheduledInterviews: roomInterviews.length,
            totalMinutesUsed: totalMins
        };
    });

    // 9 hours × 2 days per room/panel
    const AVAILABLE_MINS_PER_ROOM = 9 * 60 * 2;
    const totalRoomMins = rooms.length * AVAILABLE_MINS_PER_ROOM;
    const usedRoomMins = roomUtil.reduce((s, r) => s + r.totalMinutesUsed, 0);
    const overallRoomUtilPct = totalRoomMins > 0
        ? Math.round((usedRoomMins / totalRoomMins) * 100)
        : 0;

    // panel utilization
    const panelUtil: IPanelUtilization[] = panels.map((panel) => {
        const panelInterviews = scheduled.filter((i) => i.panelId === panel.panelId);
        const totalMins = panelInterviews.reduce((sum, i) => {
            if (!i.startTime || !i.endTime) return sum;
            return sum + (i.endTime.getTime() - i.startTime.getTime()) / 60000;
        }, 0);
        return {
            panelId: panel.panelId,
            companyId: panel.companyId,
            scheduledInterviews: panelInterviews.length,
            totalMinutesUsed: totalMins
        };
    });

    const totalPanelMins = panels.length * AVAILABLE_MINS_PER_ROOM;
    const usedPanelMins = panelUtil.reduce((s, p) => s + p.totalMinutesUsed, 0);
    const overallPanelUtilPct = totalPanelMins > 0
        ? Math.round((usedPanelMins / totalPanelMins) * 100)
        : 0;

    // average student wait time
    // gap between consecutive interviews for each student
    const studentIds = [...new Set(scheduled.map((i) => i.studentId))];
    let totalWait = 0;
    let waitCount = 0;

    for (const studentId of studentIds) {
        const studentInterviews = scheduled
            .filter((i) => i.studentId === studentId && i.startTime && i.endTime)
            .sort((a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0));

        for (let k = 1; k < studentInterviews.length; k++) {
            const gap =
                (studentInterviews[k].startTime!.getTime() -
                    studentInterviews[k - 1].endTime!.getTime()) / 60000;
            if (gap >= 0) {
                totalWait += gap;
                waitCount++;
            }
        }
    }

    const averageWaitTimeMinutes = waitCount > 0
        ? Math.round(totalWait / waitCount)
        : 0;

    return {
        totalInterviews: interviews.length,
        scheduledCount: scheduled.length,
        unscheduledCount: unscheduled.length,
        cancelledCount: cancelled.length,
        pendingCount: pending.length,
        scheduledPercent:
            interviews.length > 0
                ? Math.round((scheduled.length / interviews.length) * 100)
                : 0,
        roomUtilization: roomUtil,
        overallRoomUtilPct,
        panelUtilization: panelUtil,
        overallPanelUtilPct,
        averageWaitTimeMinutes,
        computedAt: new Date().toISOString()
    };
}
