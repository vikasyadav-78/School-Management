"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaFilter, FaSearch, FaArrowLeft } from "react-icons/fa";
import { getTeacherReportsStaffAttendanceHistory } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function StaffAttendanceReportsPage() {
  const getActiveMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [month, setMonth] = useState(getActiveMonthStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 30;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        month,
        page: currentPage,
        per_page: itemsPerPage
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getTeacherReportsStaffAttendanceHistory(params);
      setRecords(data.records || data.items || data.data || []);
      setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });
      setTotalRecords(data.count || data.total || 0);
    } catch (err) {
      toast.error("Failed to load staff attendance logs: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [month, searchQuery, currentPage]);

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Staff Attendance History"
          subtitle="View monthly staff attendance records, leave remarks, and aggregated attendance summaries."
        />
        <Link href="/teacher/admin/attendance/reports">
          <Button variant="outline" className="text-xs font-bold py-2 px-3">
            <FaArrowLeft className="mr-1.5" /> Back
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
          <FaFilter className="text-sky-500 w-3.5 h-3.5" /> Filters:
        </div>

        <div className="relative flex-1 min-w-50 max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search by staff name or employee ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:border-sky-500 font-semibold text-black"
          />
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white text-black font-semibold cursor-pointer"
        />
      </div>

      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Records</span>
            <span className="text-xl font-extrabold text-zinc-800 mt-1 block">{stats.total || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">Present</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block">{stats.present || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-600">Absent</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{stats.absent || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-600">Late</span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">{stats.late || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-600">Half Day</span>
            <span className="text-xl font-extrabold text-indigo-600 mt-1 block">{stats.half_day || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-sky-800">Leave</span>
            <span className="text-xl font-extrabold text-sky-800 mt-1 block">{stats.leave || 0}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <PageLoader />
        </div>
      ) : records.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider bg-white rounded-2xl border border-zinc-200 shadow-sm">
          No staff attendance history records found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150/60 text-zinc-700">
                {records.map((rec) => {
                  const status = String(rec.status || "").toLowerCase();
                  return (
                    <tr key={rec.id || `${rec.staff_id}-${rec.date}`} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-zinc-500 uppercase tracking-wider">{rec.date_label || rec.date}</td>
                      <td className="px-6 py-3.5 font-extrabold text-zinc-800 uppercase tracking-wide">{rec.staff_name || rec.name || "Staff Member"}</td>
                      <td className="px-6 py-3.5 font-bold text-zinc-500 uppercase tracking-wider">{rec.employee_id || rec.employee_code || "N/A"}</td>
                      <td className="px-6 py-3.5 capitalize text-zinc-600 whitespace-nowrap">{rec.designation || "Staff"}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${
                            status === "present" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            status === "absent" ? "bg-rose-50 border-rose-100 text-rose-600" :
                            status === "late" ? "bg-amber-50 border-amber-100 text-amber-600" :
                            status === "half_day" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                            status === "leave" ? "bg-sky-50 border-sky-100 text-sky-600" :
                            "bg-zinc-50 border-zinc-100 text-zinc-600"
                          }`}>{rec.status || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-zinc-500">{rec.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalRecords > itemsPerPage && (
            <div className="p-4 border-t border-zinc-150/60 bg-zinc-50/50">
              <Pagination
                currentPage={currentPage}
                totalCount={totalRecords}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
