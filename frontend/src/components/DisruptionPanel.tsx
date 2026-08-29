import React, { useState } from "react";
import { AlertCircle, Zap, ShieldAlert, Clock, UserCheck } from "lucide-react";

interface DisruptionPanelProps {
  companies: any[];
  panels: any[];
  students: any[];
  rooms: any[];
  onApplyDisruption: (type: string, payload: any) => Promise<void>;
  onGenerateSchedule: () => Promise<void>;
}

export const DisruptionPanel: React.FC<DisruptionPanelProps> = ({
  companies,
  panels,
  students,
  rooms,
  onApplyDisruption,
  onGenerateSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<"company" | "panel" | "student" | "room" | "compound">("company");
  const [loading, setLoading] = useState(false);

  // States for inputs
  const [companyId, setCompanyId] = useState("");
  const [delayHours, setDelayHours] = useState<number>(2);

  const [panelId, setPanelId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");

  // Compound state
  const [compCompanyEnabled, setCompCompanyEnabled] = useState(false);
  const [compCompanyId, setCompCompanyId] = useState("");
  const [compDelayHours, setCompDelayHours] = useState<number>(2);

  const [compPanelEnabled, setCompPanelEnabled] = useState(false);
  const [compPanelId, setCompPanelId] = useState("");

  const [compStudentEnabled, setCompStudentEnabled] = useState(false);
  const [compStudentId, setCompStudentId] = useState("");

  const [compRoomEnabled, setCompRoomEnabled] = useState(false);
  const [compRoomId, setCompRoomId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === "company") {
        await onApplyDisruption("company-delay", { companyId, delayHours: Number(delayHours) });
      } else if (activeTab === "panel") {
        await onApplyDisruption("panel-unavailable", { panelId });
      } else if (activeTab === "student") {
        await onApplyDisruption("student-withdrawal", { studentId });
      } else if (activeTab === "room") {
        await onApplyDisruption("room-unavailable", { roomId });
      } else if (activeTab === "compound") {
        const payload: any = {};
        if (compCompanyEnabled && compCompanyId) {
          payload.companyDelay = { companyId: compCompanyId, delayHours: Number(compDelayHours) };
        }
        if (compPanelEnabled && compPanelId) {
          payload.panelUnavailable = { panelId: compPanelId };
        }
        if (compStudentEnabled && compStudentId) {
          payload.studentWithdrawal = { studentId: compStudentId };
        }
        if (compRoomEnabled && compRoomId) {
          payload.roomUnavailable = { roomId: compRoomId };
        }
        await onApplyDisruption("compound", payload);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFullReplan = async () => {
    setLoading(true);
    try {
      await onGenerateSchedule();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-stone-850">Inject Disruptions & Replan</h2>
          <p className="text-[10px] text-stone-400">Apply disruption conditions to trigger minimum-disturbance repair.</p>
        </div>
        <button
          onClick={handleFullReplan}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-stone-50 text-xs px-3 py-1.5 rounded font-medium transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Full Replan / Generate</span>
        </button>
      </div>

      <div className="flex border-b border-stone-100 text-xs">
        <button
          onClick={() => setActiveTab("company")}
          className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
            activeTab === "company" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          Company Delay
        </button>
        <button
          onClick={() => setActiveTab("panel")}
          className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
            activeTab === "panel" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          Panel Dropout
        </button>
        <button
          onClick={() => setActiveTab("student")}
          className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
            activeTab === "student" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          Student Exit
        </button>
        <button
          onClick={() => setActiveTab("room")}
          className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
            activeTab === "room" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          Room Block
        </button>
        <button
          onClick={() => setActiveTab("compound")}
          className={`flex-1 py-3 text-center border-b-2 font-medium transition-colors ${
            activeTab === "compound" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          Compound
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Tab contents */}
        {activeTab === "company" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md flex space-x-3 text-xs text-stone-600">
              <Clock className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Company Delay</strong> shifts the starting slot of a company N hours later. Only this company's interviews are touched, preserving others.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Select Company</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-400 focus:bg-white"
                >
                  <option value="">Choose...</option>
                  {companies.map((c) => (
                    <option key={c.companyId || c._id} value={c.companyId || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Delay Hours</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={delayHours}
                  onChange={(e) => setDelayHours(Number(e.target.value))}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-400 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "panel" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md flex space-x-3 text-xs text-stone-600">
              <ShieldAlert className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Panel Dropout</strong> marks a panel unavailable. Scheduled interviews are dynamically reassigned to alternate panels of the same company.
              </p>
            </div>

            <div className="space-y-1.5 max-w-md">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Select Panel</label>
              <select
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-400 focus:bg-white"
              >
                <option value="">Choose...</option>
                {panels
                  .filter((p) => p.status === "available")
                  .map((p) => (
                    <option key={p.panelId} value={p.panelId}>
                      {p.panelId} ({p.companyId})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "student" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md flex space-x-3 text-xs text-stone-600">
              <UserCheck className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Student Exit</strong> cancels all upcoming interviews for the withdrawn student. There is zero side-effect on other students' slots.
              </p>
            </div>

            <div className="space-y-1.5 max-w-md">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Select Student ID</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-400 focus:bg-white"
              >
                <option value="">Choose...</option>
                {students
                  .filter((s) => s.status === "ACTIVE")
                  .map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentId} — {s.name} (CGPA: {s.cgpa}, {s.branch})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "room" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md flex space-x-3 text-xs text-stone-600">
              <AlertCircle className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Room Block</strong> closes a room. Affected interviews are migrated to other free rooms at the same time window, keeping the panel identical.
              </p>
            </div>

            <div className="space-y-1.5 max-w-md">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Select Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-400 focus:bg-white"
              >
                <option value="">Choose...</option>
                {rooms
                  .filter((r) => r.status === "AVAILABLE")
                  .map((r) => (
                    <option key={r.roomId} value={r.roomId}>
                      {r.roomId}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "compound" && (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-md flex space-x-3 text-xs text-stone-600">
              <AlertCircle className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Compound Disruption</strong> simulates a crisis: multiple simultaneous failures processed in optimal sequence (Withdrawal, then Delay, then Panel, then Room).
              </p>
            </div>

            <div className="space-y-4 divide-y divide-stone-100">
              {/* Company delay toggle */}
              <div className="pt-2 space-y-3">
                <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compCompanyEnabled}
                    onChange={(e) => setCompCompanyEnabled(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span>Include Company Delay</span>
                </label>
                {compCompanyEnabled && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <select
                      value={compCompanyId}
                      onChange={(e) => setCompCompanyId(e.target.value)}
                      required
                      className="bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Select Company...</option>
                      {companies.map((c) => (
                        <option key={c.companyId || c._id} value={c.companyId || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={compDelayHours}
                      onChange={(e) => setCompDelayHours(Number(e.target.value))}
                      required
                      placeholder="Hours..."
                      className="bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Panel toggle */}
              <div className="pt-3 space-y-3">
                <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compPanelEnabled}
                    onChange={(e) => setCompPanelEnabled(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span>Include Panel Dropout</span>
                </label>
                {compPanelEnabled && (
                  <div className="pl-6 max-w-xs">
                    <select
                      value={compPanelId}
                      onChange={(e) => setCompPanelId(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Select Panel...</option>
                      {panels.map((p) => (
                        <option key={p.panelId} value={p.panelId}>
                          {p.panelId} ({p.companyId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Student toggle */}
              <div className="pt-3 space-y-3">
                <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compStudentEnabled}
                    onChange={(e) => setCompStudentEnabled(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span>Include Student Exit</span>
                </label>
                {compStudentEnabled && (
                  <div className="pl-6 max-w-xs">
                    <select
                      value={compStudentId}
                      onChange={(e) => setCompStudentId(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Select Student ID...</option>
                      {students.map((s) => (
                        <option key={s.studentId} value={s.studentId}>
                          {s.studentId} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Room toggle */}
              <div className="pt-3 space-y-3">
                <label className="inline-flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compRoomEnabled}
                    onChange={(e) => setCompRoomEnabled(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span>Include Room Block</span>
                </label>
                {compRoomEnabled && (
                  <div className="pl-6 max-w-xs">
                    <select
                      value={compRoomId}
                      onChange={(e) => setCompRoomId(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Select Room...</option>
                      {rooms.map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                          {r.roomId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-stone-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-stone-50 text-xs px-4 py-2 rounded font-medium transition-colors"
          >
            {loading ? "Processing..." : "Inject & Replan"}
          </button>
        </div>
      </form>
    </div>
  );
};
