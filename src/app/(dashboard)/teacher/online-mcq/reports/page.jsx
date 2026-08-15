"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaLaptopCode,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaGraduationCap
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";
import { getTeacherOnlineMcqReports, getTeacherOnlineMcqMeta } from "@/features/teachers/services/teacher.service";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/common/PageHeader";

export default function TeacherOnlineMcqReportsPage() {
  const router = useRouter();
  const dialog = useAppDialog();

  const [reports, setReports] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 30,
    count: 0
  });

  const [filterClass, setFilterClass] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMeta = async () => {
    try {
      const response = await getTeacherOnlineMcqMeta();
      if (response?.success) {
        setMeta(response);
      }
    } catch (err) {
      console.error("Failed to load meta:", err);
    }
  };

  const fetchReports = useCallback(async (page = 1, classId = filterClass) => {
    try {
      if (page === 1) setLoading(true);
      else setIsRefreshing(true);

      const params = {
        page,
        per_page: 30
      };
      if (classId) {
        params.class_id = classId;
      }

      const response = await getTeacherOnlineMcqReports(params);

      if (response?.success) {
        setReports(response.exams || []);
        setPagination({
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 30,
          count: response.count || 0
        });
      } else {
        throw new Error(response?.message || "Failed to load reports");
      }
    } catch (err) {
      setError(err.message || "Error fetching reports");
      dialog.showError("Error", err.message || "Error fetching reports");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filterClass, dialog]);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchReports(newPage);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10';
      case 'expired':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-white rounded-2xl border border-zinc-100 shadow-sm">
        <Loader size="lg" />
        <p className="mt-4 text-sm font-semibold text-zinc-600 tracking-wide">Loading performance reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <PageHeader
        title="Online MCQ Reports"
        subtitle="View student performance and analytics for your exams"
      />

      {/* Filters & Control Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-500 text-xs font-semibold">
            <FaFilter className="text-zinc-400" />
            <span>Filter By:</span>
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold text-zinc-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
          >
            <option value="">All Classes</option>
            {meta?.classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          Total Reports: <span className="font-bold text-zinc-800">{pagination.count}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900 mb-1">Error Loading Reports</h3>
          <p className="text-xs text-rose-600 mb-5">{error}</p>
          <button
            onClick={() => fetchReports(1)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 active:scale-[0.98] transition-all shadow-sm shadow-rose-200"
          >
            Try Again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-200/60">
            <FaLaptopCode className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 mb-1">No Reports Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            You haven't created any exams yet, or there are no exams matching your selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader size="md" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200/80">
                  <th className="py-3.5 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Exam Details</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Class Info</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Schedule</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Performance</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {reports.map((exam) => {
                  const totalPassed = exam.report?.pass_count || 0;
                  const totalFailed = exam.report?.fail_count || 0;
                  const totalStudents = totalPassed + totalFailed;
                  const passPercentage = totalStudents > 0 ? Math.round((totalPassed / totalStudents) * 100) : 0;

                  return (
                    <tr key={exam.id} className="hover:bg-zinc-50/60 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {exam.title}
                          </span>
                          <span className="text-xs font-medium text-zinc-500 mt-0.5">{exam.subject}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${getStatusBadge(exam.status)}`}>
                              {exam.status || "Unknown"}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-md">
                              {exam.total_questions} Qs • {exam.total_marks} Marks
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-800 capitalize flex items-center gap-1.5">
                            <FaGraduationCap className="text-zinc-400" />
                            {exam.class}
                          </span>
                          <span className="text-[11px] font-medium text-zinc-500 mt-1">
                            Section: <span className="text-zinc-700 font-semibold">{exam.section || "—"}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-xs font-medium text-zinc-600">
                            <FaCalendarAlt className="mr-1.5 text-emerald-500 shrink-0" />
                            <span>{exam.starts_at_label}</span>
                          </div>
                          <div className="flex items-center text-xs font-medium text-zinc-600">
                            <FaClock className="mr-1.5 text-rose-400 shrink-0" />
                            <span>{exam.ends_at_label}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                            Duration: {exam.duration_minutes} Mins
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {exam.report ? (
                          <div className="flex flex-col space-y-1.5 max-w-[180px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-zinc-500">Attempts:</span>
                              <span className="font-bold text-zinc-900">{exam.report.total_attempts}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-zinc-500">Avg Score:</span>
                              <span className="font-bold text-emerald-600">
                                {exam.report.avg_score} <span className="text-[10px] text-emerald-700 font-normal">({exam.report.avg_percentage}%)</span>
                              </span>
                            </div>

                            {/* Pass/Fail Visual Bar */}
                            <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden flex">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${passPercentage}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 pt-0.5">
                              <span className="flex items-center text-emerald-600">
                                <FaCheckCircle className="mr-1 text-[9px]" /> {exam.report.pass_count} Pass
                              </span>
                              <span className="flex items-center text-rose-600">
                                <FaTimesCircle className="mr-1 text-[9px]" /> {exam.report.fail_count} Fail
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 inline-block">
                            No Data Yet
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/teacher/online-mcq/reports/${exam.id}`}
                          className="inline-flex items-center justify-center px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
                        >
                          <span>View Report</span>
                          <FaArrowRight className="ml-1.5 w-2.5 h-2.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-zinc-50/80 border-t border-zinc-200/80 gap-3">
              <span className="text-xs font-semibold text-zinc-500">
                Page <span className="text-zinc-900 font-bold">{pagination.current_page}</span> of <span className="text-zinc-900 font-bold">{pagination.last_page}</span> ({pagination.count} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <FaChevronLeft className="w-2.5 h-2.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <span>Next</span>
                  <FaChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}