import React, { useEffect, useState } from "react";
import { X, Sparkles, AlertCircle, HelpCircle, Activity } from "lucide-react";

interface ExplanationPanelProps {
  interviewId: string | null;
  onClose: () => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  interviewId,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    async function fetchExplanation() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const response = await fetch(`/api/schedule/explanations/${interviewId}`);
        if (!response.ok) {
          throw new Error(`Failed to load explanation for ${interviewId}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchExplanation();
  }, [interviewId]);

  if (!interviewId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Scheduler Reasoning Trace</span>
            <h2 className="text-sm font-semibold tracking-tight text-stone-850">
              Interview: <span className="font-mono text-stone-600 bg-stone-200/50 px-1 rounded">{interviewId}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-stone-400">
              <Activity className="h-5 w-5 animate-spin" />
              <span className="text-xs">Analyzing decision logs...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex space-x-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Outcome Badges */}
              <div className="flex items-center justify-between border border-stone-200/60 p-4 rounded-lg bg-stone-50/40">
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Final Decision State</span>
                  <div className="text-xs font-semibold text-stone-800 uppercase">{data.status}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Student | Company</span>
                  <div className="text-xs font-semibold text-stone-800">
                    {data.studentId} | {data.companyId}
                  </div>
                </div>
              </div>

              {/* AI Summary Section (Llama powered by Groq) */}
              <div className="bg-stone-900 text-stone-50 rounded-lg p-5 shadow-sm border border-stone-850 space-y-3">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-accent-300" />
                  <span className="text-xs font-semibold tracking-wide text-stone-300">
                    Llama Synthesis (Groq)
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-light text-stone-200">
                  {data.aiSummary || data.summary || "No automated explanation summary generated."}
                </p>
              </div>

              {/* Deterministic trace log step by step */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Chronological Decision Path</span>
                </h3>
                
                <div className="relative border-l border-stone-200 pl-4 ml-2 space-y-4 py-1">
                  {data.reasonTrace && data.reasonTrace.length > 0 ? (
                    data.reasonTrace.map((step: string, idx: number) => {
                      const isRejection = step.includes("Rejected") || step.includes("UNSCHEDULED");
                      return (
                        <div key={idx} className="relative text-xs">
                          {/* Dot on line */}
                          <span
                            className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-white ${
                              isRejection ? "bg-red-400" : "bg-stone-800"
                            }`}
                          />
                          <p className={`leading-relaxed ${isRejection ? "text-red-800" : "text-stone-700"}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-stone-400 italic text-[11px]">No decision steps logged for this interview.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
