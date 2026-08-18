"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaCalendarAlt, FaTimes, FaCheck, FaHistory, FaUserCheck, FaSave, FaCheckDouble, FaUserTimes
} from "react-icons/fa";
import {
  getTeacherManageTeacherAttendanceRoster,
  saveTeacherManageTeacherAttendance,
  getTeacherManageTeacherAttendanceHistory
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherManageTeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "history"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Date selection
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceState, setAttendanceState] = useState({}); // { teacher_id: { status, remarks } }
  const [teachersList, setTeachersList] = useState([]);

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Load Daily Roster
  const fetchRoster = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherManageTeacherAttendanceRoster({ date: selectedDate });
      const roster = data.teachers || data.roster || data.data || (Array.isArray(data) ? data : []);
      setTeachersList(roster);

      const initialMap = {};
      roster.forEach(t => {
        initialMap[t.id || t.teacher_id] = {
          status: t.status || "present",
          remarks: t.remarks || ""
        };
      });
      setAttendanceState(initialMap);
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load teacher attendance roster: " + (err.message || err));
      }
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "roster") {
      fetchRoster();
    }
  }, [selectedDate, activeTab]);

  // Load History
  const fetchHistory = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherManageTeacherAttendanceHistory();
      setHistoryList(data.history || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleStatusChange = (teacherId, newStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status: newStatus
      }
    }));
  };

  const handleRemarksChange = (teacherId, newRemarks) => {
    setAttendanceState(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        remarks: newRemarks
      }
    }));
  };

  // Quick Action: Mark All Present / Absent
  const handleBulkStatusChange = (status) => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(tId => {
        updated[tId] = { ...updated[tId], status };
      });
      return updated;
    });
    toast.info(`All staff marked as ${status.toUpperCase()}`);
  };

  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true);
      const payloadArray = Object.keys(attendanceState).map(tId => ({
        teacher_id: tId,
        status: attendanceState[tId].status,
        remarks: attendanceState[tId].remarks || null
      }));

      await saveTeacherManageTeacherAttendance({
        date: selectedDate,
        attendance: payloadArray
      });

      toast.success("Teacher attendance saved successfully!");
    } catch (err) {
      toast.error("Failed to save attendance: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Teacher Attendance feature is not enabled for your account. Contact school admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
        <PageHeader
          title="Teacher Attendance Desk"
          subtitle="Mark daily faculty attendance roster and inspect monthly attendance reports."
        />
        {activeTab === "roster" && (
          <button
            onClick={handleSaveAttendance}
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <FaSave className="w-3.5 h-3.5" />
            {submitting ? "Saving Roster..." : "Save Attendance"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "roster" ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
        >
          Daily Attendance Roster
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "history" ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
        >
          Monthly Report & History
        </button>
      </div>

      {/* TAB 1: ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-500 font-extrabold uppercase tracking-wider shrink-0">
                Target Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-800 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline-block">Quick Mark:</span>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("present")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FaCheckDouble className="w-3 h-3" /> Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("absent")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FaUserTimes className="w-3 h-3" /> Mark All Absent
              </button>
            </div>

          </div>

          {/* Table Area */}
          {listLoading ? (
            <div className="flex items-center justify-center py-20"><PageLoader /></div>
          ) : teachersList.length === 0 ? (
            <EmptyState title="No Faculty Members" desc="No teachers registered in system." />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-4 min-w-[220px]">Faculty Member</th>
                      <th className="px-6 py-4 min-w-[150px]">Employee ID</th>
                      <th className="px-6 py-4 text-center min-w-[340px]">Mark Status</th>
                      <th className="px-6 py-4 min-w-[240px]">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {teachersList.map((t) => {
                      const tId = t.id || t.teacher_id;
                      const name = t.full_name || t.name || t.teacher_name || "Faculty Member";
                      const currentStatus = attendanceState[tId]?.status || "present";
                      const currentRemarks = attendanceState[tId]?.remarks || "";

                      return (
                        <tr key={tId} className="hover:bg-zinc-50/60 transition-colors">
                          {/* Faculty Name & Avatar */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-zinc-900 text-xs">
                                {name}
                              </span>
                            </div>
                          </td>

                          {/* ID */}
                          <td className="px-6 py-4 font-semibold text-zinc-500 whitespace-nowrap">
                            {t.employee_id || "—"}
                          </td>

                          {/* Status Options */}
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {[
                                { id: "present", label: "Present", color: "bg-emerald-600 border-emerald-600" },
                                { id: "absent", label: "Absent", color: "bg-rose-600 border-rose-600" },
                                { id: "late", label: "Late", color: "bg-amber-500 border-amber-500" },
                                { id: "half_day", label: "Half Day", color: "bg-purple-600 border-purple-600" },
                                { id: "leave", label: "Leave", color: "bg-blue-600 border-blue-600" }
                              ].map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => handleStatusChange(tId, st.id)}
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer ${currentStatus === st.id
                                      ? `${st.color} text-white shadow-sm scale-105`
                                      : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                                    }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={currentRemarks}
                              onChange={(e) => handleRemarksChange(tId, e.target.value)}
                              placeholder="Add optional remark..."
                              className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {listLoading ? (
            <div className="flex items-center justify-center py-20"><PageLoader /></div>
          ) : historyList.length === 0 ? (
            <EmptyState title="No Attendance History" desc="No saved teacher attendance records found." />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {historyList.map((h) => (
                      <tr key={h.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-800">{h.date}</td>
                        <td className="px-6 py-4 font-bold text-zinc-900">{h.teacher_name || h.teacher?.full_name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${h.status === "present" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              h.status === "absent" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-500">{h.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}