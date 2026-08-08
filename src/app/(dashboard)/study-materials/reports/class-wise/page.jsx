"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaChevronLeft, FaChartBar, FaSearch } from "react-icons/fa";
import { getClassNotesReportsClass } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function ClassWiseReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchClassReports = async () => {
      try {
        setLoading(true);
        const data = await getClassNotesReportsClass();
        const list = data.rows || data.reports || data.class_reports || data.data || (Array.isArray(data) ? data : []);
        setReports(list);
      } catch (err) {
        toast.error("Failed to load class reports: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchClassReports();
  }, []);

  // Filter & search logic
  const filteredReports = reports.filter(r => 
    String(r.class_name || r.class?.name || (typeof r.class === "string" ? r.class : "") || "").toLowerCase().includes(search.toLowerCase())
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
            title="Class-wise Study Materials Reports"
            subtitle="Analyze the volume of lecture notes and study material uploads across each class."
          />
        </div>

        {/* Toolbar & Search */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text"
              placeholder="Search by Class Name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black text-xs"
            />
          </div>
          <div className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            Total Classes: {filteredReports.length}
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
                    <th className="px-6 py-3.5">Class Name</th>
                    <th className="px-6 py-3.5 text-right">Notes Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-650 font-bold">
                  {currentItems.map((r, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5 capitalize flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        {r.class_name || r.class?.name || (typeof r.class === "string" ? r.class : "") || "Unknown Class"}
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
