"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaCalendarAlt, FaTimes, FaCheck, FaHistory, FaUserCheck, FaSave
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Teacher Attendance Desk"
          subtitle="Mark daily faculty attendance roster and inspect monthly attendance reports."
        />
        {activeTab === "roster" && (
          <button
            onClick={handleSaveAttendance}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <FaSave className="w-3.5 h-3.5" />
            {submitting ? "Saving..." : "Save Attendance"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "roster" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Daily Attendance Roster
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "history" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Monthly Report & History
        </button>
      </div>

      {/* TAB 1: ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Target Attendance Date:</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white"
              />
            </div>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-20"><PageLoader /></div>
          ) : teachersList.length === 0 ? (
            <EmptyState title="No Faculty Members" desc="No teachers registered in system." />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4 text-center">Mark Status</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 text-zinc-700">
                    {teachersList.map((t) => {
                      const tId = t.id || t.teacher_id;
                      const currentStatus = attendanceState[tId]?.status || "present";
                      const currentRemarks = attendanceState[tId]?.remarks || "";

                      return (
                        <tr key={tId} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800">
                            {t.full_name || t.name || t.teacher_name}
                          </td>
                          <td className="px-6 py-4 font-semibold text-zinc-500">
                            {t.employee_id || "—"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {["present", "absent", "late", "half_day", "leave"].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(tId, st)}
                                  className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase transition-all cursor-pointer ${
                                    currentStatus === st ? (
                                      st === "present" ? "bg-emerald-600 text-white border-emerald-600" :
                                      st === "absent" ? "bg-rose-600 text-white border-rose-600" :
                                      st === "late" ? "bg-amber-500 text-white border-amber-500" :
                                      st === "half_day" ? "bg-purple-600 text-white border-purple-600" :
                                      "bg-blue-600 text-white border-blue-600"
                                    ) : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                                  }`}
                                >
                                  {st.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="text"
                              value={currentRemarks}
                              onChange={(e) => handleRemarksChange(tId, e.target.value)}
                              placeholder="Optional remarks..."
                              className="w-full px-2.5 py-1 border border-zinc-200 rounded-lg text-xs outline-none focus:border-violet-500"
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
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 text-zinc-700">
                    {historyList.map((h) => (
                      <tr key={h.id} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 font-bold text-zinc-700">{h.date}</td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{h.teacher_name || h.teacher?.full_name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            h.status === "present" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            h.status === "absent" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-500">{h.remarks || "—"}</td>
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
