import React from "react";
import { Users, Layout, Clock, CheckCircle } from "lucide-react";

interface MetricsPanelProps {
  metrics: {
    totalInterviews: number;
    scheduledCount: number;
    unscheduledCount: number;
    cancelledCount: number;
    pendingCount: number;
    scheduledPercent: number;
    roomUtilization: Array<{ roomId: string; scheduledInterviews: number; totalMinutesUsed: number }>;
    overallRoomUtilPct: number;
    panelUtilization: Array<{ panelId: string; companyId: string; scheduledInterviews: number; totalMinutesUsed: number }>;
    overallPanelUtilPct: number;
    averageWaitTimeMinutes: number;
  } | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        No metrics data available. Please generate the schedule first.
      </div>
    );
  }

  // Calculate available minutes (9 hours * 2 days = 1080 mins per room/panel)
  const TOTAL_AVAIL_MINS = 9 * 60 * 2;

  return (
    <div className="space-y-6">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Scheduled Rate</span>
            <CheckCircle className="h-4 w-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold tracking-tight text-stone-850">
              {metrics.scheduledPercent}%
            </span>
            <span className="text-[10px] text-stone-400">
              ({metrics.scheduledCount} / {metrics.totalInterviews})
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-stone-800 h-1 rounded-full"
              style={{ width: `${metrics.scheduledPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Room Utilization</span>
            <Layout className="h-4 w-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold tracking-tight text-stone-850">
              {metrics.overallRoomUtilPct}%
            </span>
            <span className="text-[10px] text-stone-400">
              ({metrics.roomUtilization.length} rooms)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-stone-800 h-1 rounded-full"
              style={{ width: `${metrics.overallRoomUtilPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Panel Utilization</span>
            <Users className="h-4 w-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold tracking-tight text-stone-850">
              {metrics.overallPanelUtilPct}%
            </span>
            <span className="text-[10px] text-stone-400">
              ({metrics.panelUtilization.length} panels)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-stone-800 h-1 rounded-full"
              style={{ width: `${metrics.overallPanelUtilPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Avg Wait Time</span>
            <Clock className="h-4 w-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold tracking-tight text-stone-850">
              {metrics.averageWaitTimeMinutes}
            </span>
            <span className="text-xs text-stone-400 font-medium">mins</span>
          </div>
          <p className="text-[10px] text-stone-400 leading-none">
            Between student's consecutive sessions
          </p>
        </div>
      </div>

      {/* Details Lists (Grid side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room utilization detailed list */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Room Performance Details
          </h3>
          <div className="divide-y divide-stone-100 max-h-[300px] overflow-y-auto pr-1">
            {metrics.roomUtilization.map((room) => {
              const utilPct = Math.round((room.totalMinutesUsed / TOTAL_AVAIL_MINS) * 100);
              return (
                <div key={room.roomId} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-stone-800">{room.roomId}</span>
                    <div className="text-[10px] text-stone-450">
                      {room.scheduledInterviews} interview(s) ({room.totalMinutesUsed} mins)
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 w-40 justify-end">
                    <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-stone-500 h-1.5 rounded-full"
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-stone-700">{utilPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel utilization detailed list */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Panel Performance Details
          </h3>
          <div className="divide-y divide-stone-100 max-h-[300px] overflow-y-auto pr-1">
            {metrics.panelUtilization.map((panel) => {
              const utilPct = Math.round((panel.totalMinutesUsed / TOTAL_AVAIL_MINS) * 100);
              return (
                <div key={panel.panelId} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-stone-800">{panel.panelId}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-1 rounded-sm">
                        {panel.companyId}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-450">
                      {panel.scheduledInterviews} interview(s) ({panel.totalMinutesUsed} mins)
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 w-40 justify-end">
                    <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-stone-500 h-1.5 rounded-full"
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-stone-700">{utilPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
