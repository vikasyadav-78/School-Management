"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaMoneyBillWave, FaDownload, FaPrint } from "react-icons/fa";
import { fetchTeacherMyAttendance } from "@/features/teachers/redux/teacherThunk";

export default function TeacherSalaryPage() {
  const dispatch = useDispatch();
  const { myAttendance, loading, error } = useSelector((state) => state.teachers);

  useEffect(() => {
    dispatch(fetchTeacherMyAttendance());
  }, [dispatch]);

  if (loading || !myAttendance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load attendance & salary logs: {error}
      </div>
    );
  }

  const stats = myAttendance.stats || {};
  const salaryPreview = myAttendance.salary_preview || {};
  const records = myAttendance.records || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`My Attendance & Salary Ledger (${myAttendance.month_label || "N/A"})`}
        subtitle="Review salary vouchers, base pay allowances, and monthly payment transactions ledger history."
      />

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Days</label>
          <h3 className="text-xl font-extrabold text-zinc-800 mt-1">{stats.total || 0}</h3>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
          <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Present</label>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{stats.present || 0}</h3>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 text-center">
          <label className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">Absent</label>
          <h3 className="text-xl font-extrabold text-rose-700 mt-1">{stats.absent || 0}</h3>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
          <label className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Late</label>
          <h3 className="text-xl font-extrabold text-amber-700 mt-1">{stats.late || 0}</h3>
        </div>
        <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 text-center">
          <label className="text-[9px] font-bold text-violet-600 uppercase tracking-wider block">Half Day</label>
          <h3 className="text-xl font-extrabold text-violet-700 mt-1">{stats.half_day || 0}</h3>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
          <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Leave</label>
          <h3 className="text-xl font-extrabold text-blue-700 mt-1">{stats.leave || 0}</h3>
        </div>
        <div className="bg-violet-600 text-white p-4 rounded-xl shadow-sm text-center">
          <label className="text-[9px] font-bold text-violet-200 uppercase tracking-wider block">Payable Days</label>
          <h3 className="text-xl font-extrabold mt-1">{stats.payable_days || 0}</h3>
        </div>
      </div>

      {/* Salary Preview Block */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-3 flex items-center gap-2">
          <FaMoneyBillWave className="text-violet-500 w-4 h-4" /> Estimated Salary Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Monthly Salary</span>
            <span className="text-base font-extrabold text-zinc-800">₹{(salaryPreview.monthly_salary || 0).toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Working Days</span>
            <span className="text-base font-extrabold text-zinc-800">{salaryPreview.working_days || 0} Days</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Payable Days</span>
            <span className="text-base font-extrabold text-zinc-800">{salaryPreview.payable_days || 0} Days</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Gross Salary</span>
            <span className="text-base font-extrabold text-zinc-800">₹{(salaryPreview.gross_salary || 0).toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-violet-600 font-bold uppercase tracking-wider block">Net Est. Salary</span>
            <span className="text-base font-extrabold text-violet-600">₹{(salaryPreview.net_salary || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Historical Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h3 className="text-xs font-bold text-zinc-700 uppercase">Attendance Logs Table ({myAttendance.month_label || "N/A"})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-xs">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                    {r.date_label || r.date || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide border ${
                      r.status_label === "Present" || r.status === "Present" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                      r.status_label === "Absent" || r.status === "Absent" ? "text-rose-600 bg-rose-50 border-rose-100" :
                      r.status_label === "Late" || r.status === "Late" ? "text-amber-600 bg-amber-50 border-amber-100" :
                      r.status_label === "Half Day" || r.status === "Half Day" ? "text-violet-600 bg-violet-50 border-violet-100" :
                      "text-zinc-600 bg-zinc-50 border-zinc-100"
                    }`}>
                      {r.status_label || r.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-medium">
                    {r.remarks || "N/A"}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-zinc-450 font-bold uppercase tracking-wider">
                    No Attendance Records Found
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
