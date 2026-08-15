"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { fetchStudentAttendance } from "@/features/students/redux/studentThunk";

export default function StudentAttendancePage() {
  const dispatch = useDispatch();
  const { attendance, loading, error } = useSelector((state) => state.students);

  useEffect(() => {
    dispatch(fetchStudentAttendance());
  }, [dispatch]);

  if (loading || !attendance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load attendance logs: {error}
      </div>
    );
  }

  const stats = attendance.stats || {};
  const records = attendance.records || [];
  const monthLabel = attendance.month_label || "N/A";

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <PageHeader
        title={`My Attendance Logs (${monthLabel})`}
        description="Review your monthly attendance history, marked present days, leaves, and absence logs."
      />

      {/* Aggregate Header Grid - Original Colored Format */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* Total Days */}
        <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Days
          </span>
          <h3 className="text-2xl font-black text-zinc-800 mt-1">
            {stats.total || 0}
          </h3>
        </div>

        {/* Present */}
        <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Present
          </span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">
            {stats.present || 0}
          </h3>
        </div>

        {/* Absent */}
        <div className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Absent
          </span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">
            {stats.absent || 0}
          </h3>
        </div>

        {/* Late */}
        <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Late
          </span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">
            {stats.late || 0}
          </h3>
        </div>

        {/* Half Day */}
        <div className="bg-violet-50 border border-violet-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block">
            Half Day
          </span>
          <h3 className="text-2xl font-black text-violet-700 mt-1">
            {stats.half_day || stats.halfDay || 0}
          </h3>
        </div>

        {/* Leave */}
        <div className="bg-blue-50 border border-blue-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Leave
          </span>
          <h3 className="text-2xl font-black text-blue-700 mt-1">
            {stats.leave || 0}
          </h3>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Chronological Attendance Sheet
          </h3>
          <span className="text-[11px] font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-3 py-0.5 rounded-full uppercase tracking-wider">
            {monthLabel}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 pl-4 pr-6">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
              {records.map((r, idx) => {
                let badgeClass = "bg-zinc-50 text-zinc-500 border-zinc-200";
                const statusStr = r.status_label || r.status || "N/A";

                if (statusStr === "Present") badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                else if (statusStr === "Absent") badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                else if (statusStr === "Late") badgeClass = "bg-amber-50 text-amber-600 border-amber-100";
                else if (["Leave", "Paid Leave", "Unpaid Leave"].includes(statusStr)) badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                else if (statusStr === "Half Day") badgeClass = "bg-violet-50 text-violet-650 border-violet-100";

                return (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-bold text-zinc-800 whitespace-nowrap">
                      {r.date_label || r.date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${badgeClass}`}>
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-semibold whitespace-nowrap capitalize">
                      {r.method || "Manual"}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-zinc-500 font-normal whitespace-nowrap">
                      {r.remarks || "—"}
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                    No Attendance Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}