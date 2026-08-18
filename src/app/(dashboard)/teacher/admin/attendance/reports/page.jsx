"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaCalendarAlt, FaUserTie, FaUsers, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import {
  getTeacherReportsStaffAttendanceHistory,
  getTeacherClassReportsAttendance
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherAdminAttendanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("class"); // class, staff

  const [classAttendance, setClassAttendance] = useState([]);
  const [classMonth, setClassMonth] = useState("2026-08");

  const [staffHistory, setStaffHistory] = useState([]);
  const [staffMonth, setStaffMonth] = useState("2026-08");

  const loadClassReport = async (month) => {
    try {
      setLoading(true);
      const res = await getTeacherClassReportsAttendance({ month });
      setClassAttendance(res.rows || []);
    } catch (err) {
      toast.error("Failed to load class attendance report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadStaffReport = async (month) => {
    try {
      setLoading(true);
      const res = await getTeacherReportsStaffAttendanceHistory({ month });
      setStaffHistory(res.records || []);
    } catch (err) {
      toast.error("Failed to load staff attendance history: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "class") {
      loadClassReport(classMonth);
    } else {
      loadStaffReport(staffMonth);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full pb-10">

      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Attendance Reports"
          subtitle="View class-wise rosters and monthly staff log summaries."
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab("class")}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${activeTab === "class"
            ? "border-violet-600 text-violet-600 bg-violet-50/60 rounded-t-xl"
            : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaCalendarAlt className="w-3.5 h-3.5" /> Class Attendance
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${activeTab === "staff"
            ? "border-violet-600 text-violet-600 bg-violet-50/60 rounded-t-xl"
            : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaUserTie className="w-3.5 h-3.5" /> Staff Attendance History
        </button>
      </div>

      {/* TAB 1: CLASS ATTENDANCE */}
      {activeTab === "class" ? (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-zinc-200/80 rounded-2xl shadow-sm gap-4">
            <div className="flex items-center gap-2 font-bold text-zinc-800 text-sm">
              <FaUsers className="text-violet-600" />
              <span>Class Attendance Summary</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <label className="font-extrabold text-zinc-400 uppercase text-[10px] tracking-wider">
                Select Month
              </label>
              <input
                type="month"
                value={classMonth}
                onChange={(e) => {
                  setClassMonth(e.target.value);
                  loadClassReport(e.target.value);
                }}
                className="bg-transparent text-zinc-800 outline-none font-bold text-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div className="py-20 flex justify-center"><PageLoader /></div>
          ) : classAttendance.length === 0 ? (
            <EmptyState title="No Attendance Logs" desc="No class attendance records found for this month." />
          ) : (
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-4">Class</th>
                      <th className="p-4">Section</th>
                      <th className="p-4 text-center">Present</th>
                      <th className="p-4 text-center">Absent</th>
                      <th className="p-4 text-center">Late</th>
                      <th className="p-4 text-center">Half Day</th>
                      <th className="p-4 text-right">Total Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {classAttendance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-violet-50/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 capitalize">
                          {row.class_name}
                        </td>
                        <td className="p-4 font-bold text-zinc-600">
                          <span className="px-2.5 py-1 bg-zinc-100 rounded-lg text-zinc-700 font-extrabold">
                            {row.section_name}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 text-[11px]">
                            <FaCheckCircle className="text-emerald-500 w-3 h-3" />
                            {row.present || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border text-[11px] ${row.absent > 0
                            ? "bg-rose-50 text-rose-700 border-rose-200/60"
                            : "bg-zinc-50 text-zinc-400 border-zinc-200/60"
                            }`}>
                            <FaTimesCircle className={row.absent > 0 ? "text-rose-500 w-3 h-3" : "text-zinc-300 w-3 h-3"} />
                            {row.absent || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="text-amber-600 font-bold">
                            {row.late || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="text-purple-600 font-bold">
                            {row.half_day || 0}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-zinc-900 text-right">
                          <span className="px-3 py-1 bg-zinc-100 text-zinc-800 rounded-xl">
                            {row.total || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: STAFF ATTENDANCE */
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-zinc-200/80 rounded-2xl shadow-sm gap-4">
            <div className="flex items-center gap-2 font-bold text-zinc-800 text-sm">
              <FaUserTie className="text-violet-600" />
              <span>Staff Attendance Log History</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200">
              <label className="font-extrabold text-zinc-400 uppercase text-[10px] tracking-wider">
                Select Month
              </label>
              <input
                type="month"
                value={staffMonth}
                onChange={(e) => {
                  setStaffMonth(e.target.value);
                  loadStaffReport(e.target.value);
                }}
                className="bg-transparent text-zinc-800 outline-none font-bold text-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div className="py-20 flex justify-center"><PageLoader /></div>
          ) : staffHistory.length === 0 ? (
            <EmptyState title="No Staff History" desc="No staff attendance records logged for this month." />
          ) : (
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {staffHistory.map((row) => (
                      <tr key={row.id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="p-4 font-bold text-zinc-800 whitespace-nowrap">
                          {row.date_label}
                        </td>
                        <td className="p-4 font-bold text-zinc-900 whitespace-nowrap">
                          {row.staff_name}
                        </td>
                        <td className="p-4 font-semibold text-zinc-500 whitespace-nowrap">
                          {row.employee_id || "—"}
                        </td>
                        <td className="p-4 capitalize text-zinc-600 whitespace-nowrap">
                          {row.designation || "Faculty"}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${row.status === "present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : row.status === "absent"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {row.status}
                          </span>
                        </td>
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