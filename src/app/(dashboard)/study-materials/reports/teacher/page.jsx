"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaChevronLeft, FaUser, FaSearch, FaFilter } from "react-icons/fa";
import { getClassNotesReportsTeacher } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function TeacherReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("2026-07");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTeacherReports = async () => {
    try {
      setLoading(true);
      const data = await getClassNotesReportsTeacher({ month: month || undefined });
      const list = data.reports || data.teacher_reports || data.data || (Array.isArray(data) ? data : []);
      setReports(list);
    } catch (err) {
      toast.error("Failed to load teacher reports: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherReports();
  }, [month]);

  // Filter & search logic
  const filteredReports = reports.filter(r => 
    String(r.teacher_name || r.teacher || "").toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/class-notes" 
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="Teacher-wise Study Materials Reports"
            subtitle="Track study notes and reference handouts published by each teacher."
          />
        </div>

        {/* Toolbar, Search & Month Filter */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text"
                placeholder="Search by Teacher Name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><FaFilter className="text-violet-500" /> Month:</span>
              <input 
                type="month"
                value={month}
                onChange={(e) => { setMonth(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl outline-none font-semibold text-zinc-600 bg-zinc-50 text-xs"
              />
            </div>
          </div>
          
          <div className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] shrink-0">
            Total Teachers: {filteredReports.length}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200">
            <PageLoader />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs bg-white rounded-2xl border border-zinc-200 shadow-sm">
            No Reports Found
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Teacher Name</th>
                    <th className="px-6 py-3.5 text-right">Notes Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-650 font-bold">
                  {currentItems.map((r, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5 capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        {r.teacher_name || r.teacher || "Unknown Teacher"}
                      </td>
                      <td className="px-6 py-3.5 text-right text-violet-600 font-extrabold">
                        {r.notes_count ?? r.count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-bold text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
