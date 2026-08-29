import React from "react";
import { ArrowRight, Info, AlertTriangle, Eye } from "lucide-react";

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

interface DiffViewerProps {
  diff: IDiffEntry[];
  type?: string;
  metrics?: {
    interviewsMoved: number;
    interviewsCancelled: number;
    interviewsUnscheduled: number;
    interviewsUnchanged: number;
  };
  companies: any[];
  onSelectInterview: (interviewId: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  type,
  metrics,
  companies,
  onSelectInterview,
}) => {
  const getCompanyName = (companyId: string) => {
    const comp = companies.find((c) => c.companyId === companyId || c._id === companyId);
    return comp ? comp.name : companyId;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "None";
    const date = new Date(isoString);
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (!diff || diff.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-8 shadow-sm text-center text-stone-400 text-xs">
        <Info className="h-6 w-6 text-stone-300 mx-auto mb-2" />
        No disruption replanning diff recorded. Apply a disruption to view changes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-stone-50 border border-stone-200 p-4 rounded-lg text-xs">
        <div className="space-y-1">
          <span className="font-semibold text-stone-850">
            Latest Replan Event: <span className="font-mono text-stone-600 bg-stone-150 px-1 rounded-sm">{type}</span>
          </span>
          <p className="text-stone-450">
            Below is the minimum-disturbance output showing exactly which interviews were rescheduled or cancelled.
          </p>
        </div>

        {metrics && (
          <div className="flex flex-wrap gap-3 text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
            <span className="bg-stone-100 px-2 py-0.5 border border-stone-200 rounded-sm">
              Moved: {metrics.interviewsMoved}
            </span>
            <span className="bg-red-50 text-red-750 px-2 py-0.5 border border-red-200/50 rounded-sm">
              Cancelled: {metrics.interviewsCancelled}
            </span>
            <span className="bg-stone-200/50 px-2 py-0.5 border border-stone-300 rounded-sm">
              Unscheduled: {metrics.interviewsUnscheduled}
            </span>
            <span className="bg-stone-50 px-2 py-0.5 border border-stone-200 rounded-sm">
              Unchanged: {metrics.interviewsUnchanged}
            </span>
          </div>
        )}
      </div>

      {/* Diff Table / Cards */}
      <div className="space-y-3">
        {diff.map((entry) => {
          const isCancelled = entry.changes.status?.to === "cancelled";
          const isUnscheduled = entry.changes.status?.to === "unscheduled";

          return (
            <div
              key={entry.interviewId}
              onClick={() => onSelectInterview(entry.interviewId)}
              className={`bg-white border rounded-lg shadow-sm p-4 text-xs transition-all duration-200 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:shadow-md cursor-pointer hover:border-stone-400 ${
                isCancelled
                  ? "border-red-250 bg-red-50/5"
                  : isUnscheduled
                  ? "border-amber-200 bg-amber-50/5"
                  : "border-stone-200"
              }`}
            >
              {/* Interview info */}
              <div className="space-y-1 md:max-w-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-stone-700">{entry.interviewId}</span>
                  <span className="text-[10px] text-stone-400">|</span>
                  <span className="font-semibold text-stone-600">Student: {entry.studentId}</span>
                </div>
                <div className="font-medium text-stone-850">{getCompanyName(entry.companyId)}</div>
                <div className="flex items-center space-x-1.5 text-[10px] text-stone-450 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md w-fit">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span>{entry.reasonDetails}</span>
                </div>
              </div>

              {/* Changes visualization */}
              <div className="flex-1 space-y-1.5 md:pl-6 border-l border-stone-100">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Changes:</span>
                
                <div className="space-y-1">
                  {entry.changes.status && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-stone-500 w-16">Status:</span>
                      <span className="bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-mono text-[10px]">
                        {entry.changes.status.from}
                      </span>
                      <ArrowRight className="h-3 w-3 text-stone-400" />
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold ${
                          isCancelled
                            ? "bg-red-100 text-red-800"
                            : isUnscheduled
                            ? "bg-amber-100 text-amber-805"
                            : "bg-stone-900 text-stone-50"
                        }`}
                      >
                        {entry.changes.status.to}
                      </span>
                    </div>
                  )}

                  {entry.changes.time && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-stone-500 w-16">Time:</span>
                      <span className="text-stone-600 bg-stone-50 px-1 rounded border border-stone-200/50">
                        {formatTime(entry.changes.time.from)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-stone-400" />
                      <span className="font-semibold text-stone-850 bg-stone-100 px-1 rounded border border-stone-300/60">
                        {formatTime(entry.changes.time.to)}
                      </span>
                    </div>
                  )}

                  {entry.changes.room && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-stone-500 w-16">Room:</span>
                      <span className="text-stone-500">{entry.changes.room.from || "None"}</span>
                      <ArrowRight className="h-3 w-3 text-stone-400" />
                      <span className="font-semibold text-stone-800 bg-stone-100 px-1 rounded">
                        {entry.changes.room.to || "None"}
                      </span>
                    </div>
                  )}

                  {entry.changes.panel && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-stone-500 w-16">Panel:</span>
                      <span className="text-stone-500">{entry.changes.panel.from || "None"}</span>
                      <ArrowRight className="h-3 w-3 text-stone-400" />
                      <span className="font-semibold text-stone-800 bg-stone-100 px-1 rounded">
                        {entry.changes.panel.to || "None"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end w-full md:w-auto">
                <button
                  onClick={() => onSelectInterview(entry.interviewId)}
                  className="inline-flex items-center space-x-1 bg-stone-100 hover:bg-stone-250 text-stone-700 border border-stone-200 rounded px-3 py-1.5 font-medium transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Explain Decision</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
