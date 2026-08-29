import React, { useState } from "react";
import { Search, Filter, Calendar, Clock, MapPin, User, Briefcase, Eye } from "lucide-react";

export interface IInterview {
  interviewId: string;
  studentId: string;
  companyId: string;
  roomId?: string;
  panelId?: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  status: "pending" | "scheduled" | "completed" | "cancelled" | "unscheduled";
  failureReason?: string;
  failureDetails?: string;
  reasonTrace?: string[];
}

interface ScheduleTableProps {
  interviews: IInterview[];
  companies: any[];
  onSelectInterview: (interviewId: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  interviews,
  companies,
  onSelectInterview,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const getCompanyName = (companyId: string) => {
    const comp = companies.find((c) => c.companyId === companyId || c._id === companyId);
    return comp ? comp.name : companyId;
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.interviewId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCompany = companyFilter === "all" || item.companyId === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const getStatusBadge = (status: IInterview["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-300/50">
            Scheduled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50/70 text-red-800 border border-red-200/50">
            Cancelled
          </span>
        );
      case "unscheduled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-200/70 text-stone-600 border border-stone-300/50">
            Unscheduled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-900 text-stone-50">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-2 border-b border-stone-200/60">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search student or interview ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-stone-100/60 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 bg-stone-100/60 px-3 py-1.5 border border-stone-200 rounded-md text-xs">
            <Filter className="h-3.5 w-3.5 text-stone-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-stone-700 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
              <option value="unscheduled">Unscheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-stone-100/60 px-3 py-1.5 border border-stone-200 rounded-md text-xs">
            <Briefcase className="h-3.5 w-3.5 text-stone-500" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-stone-700 font-medium cursor-pointer max-w-[150px]"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.companyId || c._id} value={c.companyId || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
          <thead className="bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3.5">Interview ID</th>
              <th className="px-6 py-3.5">Student</th>
              <th className="px-6 py-3.5">Company</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Date & Time</th>
              <th className="px-6 py-3.5">Location & Panel</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {filteredInterviews.length > 0 ? (
              filteredInterviews.map((item) => (
                <tr
                  key={item.interviewId}
                  onClick={() => onSelectInterview(item.interviewId)}
                  className="hover:bg-stone-100/70 cursor-pointer transition-colors group"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-stone-700">
                    {item.interviewId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2 text-stone-850">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      <span className="font-semibold">{item.studentId}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-stone-800">
                    {getCompanyName(item.companyId)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-stone-500">
                    {item.duration} mins
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {item.startTime ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-stone-700 font-medium">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>
                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-stone-400">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{formatDate(item.startTime)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {item.roomId ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-stone-700">
                          <MapPin className="h-3 w-3 text-stone-400" />
                          <span>{item.roomId}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 pl-4">
                          Panel: {item.panelId}
                        </div>
                      </div>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(item.status)}
                    {item.failureReason && (
                      <div className="text-[10px] text-stone-450 mt-1 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap" title={item.failureDetails}>
                        {item.failureReason}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInterview(item.interviewId);
                      }}
                      className="inline-flex items-center space-x-1 bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200 rounded px-2.5 py-1 text-[11px] font-medium transition-all group-hover:border-stone-300"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Trace</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-stone-400">
                  No interviews matching filters found. Generate a schedule or change filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
