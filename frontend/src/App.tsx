import { useState, useEffect, useCallback } from "react";
import { ScheduleTable } from "./components/ScheduleTable";
import { MetricsPanel } from "./components/MetricsPanel";
import { DisruptionPanel } from "./components/DisruptionPanel";
import { DiffViewer } from "./components/DiffViewer";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { useScheduleSocket } from "./hooks/useScheduleSocket";
import { CalendarRange, Activity, RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"interviews" | "metrics" | "diff">("interviews");
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  // Entities state
  const [students, setStudents] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Schedule state
  const [interviews, setInterviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [latestDiff, setLatestDiff] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch all entities
  const fetchEntities = async () => {
    try {
      const [stuRes, compRes, pnlRes, rmRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/companies"),
        fetch("/api/panels"),
        fetch("/api/rooms"),
      ]);

      const stuData = await stuRes.json();
      const compData = await compRes.json();
      const pnlData = await pnlRes.json();
      const rmData = await rmRes.json();

      if (stuData.success) setStudents(stuData.data);
      if (compData.success) setCompanies(compData.data);
      if (pnlData.success) setPanels(pnlData.data);
      if (rmData.success) setRooms(rmData.data);
    } catch (err) {
      console.error("Failed to fetch entities:", err);
    }
  };

  // Fetch schedule and metrics
  const refreshScheduleData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, metRes, diffRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/schedule/metrics"),
        fetch("/api/schedule/diff"),
      ]);

      const sched = await schedRes.json();
      const met = await metRes.json();
      const diff = await diffRes.json();

      setInterviews(sched.interviews || []);
      setMetrics(met);
      if (diff.diff) {
        setLatestDiff(diff);
      } else {
        setLatestDiff(null);
      }
    } catch (err) {
      console.error("Failed to refresh schedule data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount logic
  useEffect(() => {
    fetchEntities();
    refreshScheduleData();
  }, [refreshScheduleData]);

  // Hook WebSocket update
  useScheduleSocket(() => {
    setStatusMessage("Schedule updated in real-time.");
    refreshScheduleData();
    fetchEntities(); // refetch panels/rooms to reflect status changes
    setTimeout(() => setStatusMessage(null), 5000);
  });

  const handleApplyDisruption = async (type: string, payload: any) => {
    try {
      const response = await fetch(`/api/disruptions/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to apply disruption");
      }

      const data = await response.json();
      setStatusMessage(`Success: ${data.message}`);
      setActiveTab("diff");
      await refreshScheduleData();
      await fetchEntities();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      const response = await fetch("/api/scheduler/generate", {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to generate schedule");
      }

      const data = await response.json();
      setStatusMessage(`Success: ${data.message}`);
      setActiveTab("interviews");
      await refreshScheduleData();
      await fetchEntities();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 md:px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <CalendarRange className="h-6 w-6 text-stone-800" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-stone-850">
              MIRAI LABS
            </h1>
            <p className="text-[10px] text-stone-400 font-medium tracking-wide uppercase">
              Placement Week Scheduler
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {loading && (
            <div className="flex items-center space-x-1.5 text-stone-400 text-xs">
              <Activity className="h-3.5 w-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          <button
            onClick={() => {
              refreshScheduleData();
              fetchEntities();
            }}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-all"
            title="Refresh database state"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Schedule, Metrics, Diffs */}
        <section className="lg:col-span-8 space-y-6">
          {statusMessage && (
            <div className="bg-stone-900 text-stone-100 px-4 py-3 rounded-lg text-xs shadow-md border border-stone-800 flex justify-between items-center animate-fade-in">
              <span>{statusMessage}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-[10px] uppercase font-bold text-accent-300 hover:text-accent-400"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-stone-150/70 p-1 rounded-lg w-fit text-xs border border-stone-200/50">
            <button
              onClick={() => setActiveTab("interviews")}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                activeTab === "interviews"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Interview Grid
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                activeTab === "metrics"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Utilization Metrics
            </button>
            <button
              onClick={() => setActiveTab("diff")}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                activeTab === "diff"
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Disruption Diff
            </button>
          </div>

          {/* Dynamic tabs render */}
          <div className="transition-all duration-300">
            {activeTab === "interviews" && (
              <ScheduleTable
                interviews={interviews}
                companies={companies}
                onSelectInterview={(id) => setSelectedInterviewId(id)}
              />
            )}
            {activeTab === "metrics" && <MetricsPanel metrics={metrics} />}
            {activeTab === "diff" && (
              <DiffViewer
                diff={latestDiff?.diff || []}
                type={latestDiff?.type}
                metrics={latestDiff?.metrics}
                companies={companies}
                onSelectInterview={(id) => setSelectedInterviewId(id)}
              />
            )}
          </div>
        </section>

        {/* Right Side: Disruption Panel */}
        <section className="lg:col-span-4 space-y-6">
          <DisruptionPanel
            companies={companies}
            panels={panels}
            students={students}
            rooms={rooms}
            onApplyDisruption={handleApplyDisruption}
            onGenerateSchedule={handleGenerateSchedule}
          />
        </section>
      </main>

      {/* Slide Drawer for Explanation */}
      <ExplanationPanel
        interviewId={selectedInterviewId}
        onClose={() => setSelectedInterviewId(null)}
      />
    </div>
  );
}
