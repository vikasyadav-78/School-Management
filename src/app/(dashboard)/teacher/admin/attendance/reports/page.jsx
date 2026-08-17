"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FaCalendarAlt, FaCalendarCheck, FaUserTie } from "react-icons/fa";
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
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader 
          title="Attendance Reports"
          subtitle="View class-wise rosters and monthly staff log summaries."
        />

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200">
          <button 
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "class" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaCalendarAlt className="inline mr-1" /> Class Attendance
          </button>
          <button 
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "staff" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaUserTie className="inline mr-1" /> Staff Attendance History
          </button>
        </div>

        {activeTab === "class" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
              <span className="font-extrabold text-zinc-800">Class Attendance Summary</span>
              <div className="flex items-center gap-2">
                <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Month</label>
                <input 
                  type="month"
                  value={classMonth}
                  onChange={(e) => {
                    setClassMonth(e.target.value);
                    loadClassReport(e.target.value);
                  }}
                  className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-850 outline-none font-bold"
                />
              </div>
            </div>

            {loading ? <PageLoader /> : (
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                    <tr>
                      <th className="p-3">Class</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Present</th>
                      <th className="p-3">Absent</th>
                      <th className="p-3">Late</th>
                      <th className="p-3">Half Day</th>
                      <th className="p-3 text-right">Total Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                    {classAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-zinc-400">No logs found.</td>
                      </tr>
                    ) : (
                      classAttendance.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800 capitalize">{row.class_name}</td>
                          <td className="p-3 font-bold text-zinc-800">{row.section_name}</td>
                          <td className="p-3 text-emerald-600 font-bold">{row.present}</td>
                          <td className="p-3 text-rose-500 font-bold">{row.absent}</td>
                          <td className="p-3">{row.late}</td>
                          <td className="p-3">{row.half_day}</td>
                          <td className="p-3 font-bold text-zinc-850 text-right">{row.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
              <span className="font-extrabold text-zinc-800">Staff Attendance Log History</span>
              <div className="flex items-center gap-2">
                <label className="font-bold text-zinc-455 uppercase text-[9px]">Select Month</label>
                <input 
                  type="month"
                  value={staffMonth}
                  onChange={(e) => {
                    setStaffMonth(e.target.value);
                    loadStaffReport(e.target.value);
                  }}
                  className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-850 outline-none font-bold"
                />
              </div>
            </div>

            {loading ? <PageLoader /> : (
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                    {staffHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-zinc-400">No logs found.</td>
                      </tr>
                    ) : (
                      staffHistory.map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800">{row.date_label}</td>
                          <td className="p-3 font-bold text-zinc-800">{row.staff_name}</td>
                          <td className="p-3">{row.employee_id}</td>
                          <td className="p-3 capitalize">{row.designation}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              row.status === "present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
