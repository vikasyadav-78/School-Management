"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaLaptopCode, FaArrowRight, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa";
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
      if (response.success) {
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
      
      if (response.success) {
        setReports(response.exams || []);
        setPagination({
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 30,
          count: response.count || 0
        });
      } else {
        throw new Error(response.message || "Failed to load reports");
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader size="lg" />
        <p className="mt-4 text-sm font-medium text-zinc-500">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      <PageHeader 
        title="Online MCQ Reports"
        subtitle="View student performance and analytics for your exams"
      />

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer"
          >
            <option value="">All Classes</option>
            {meta?.classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <FaExclamationCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-rose-900 mb-2">Error Loading Reports</h3>
          <p className="text-sm text-rose-600">{error}</p>
          <button 
            onClick={() => fetchReports(1)}
            className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLaptopCode className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">No Reports Found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            You have not created any exams yet, or there are no exams matching your criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader size="md" />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Exam Details</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Info</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Schedule</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Performance</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {reports.map((exam) => (
                  <tr key={exam.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 text-sm">{exam.title}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{exam.subject}</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusColor(exam.status)}`}>
                            {exam.status || "Unknown"}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                            {exam.total_questions} Qs / {exam.total_marks} Marks
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-800 capitalize">{exam.class}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">Section {exam.section || "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs text-zinc-600">
                          <FaCalendarAlt className="mr-1.5 text-emerald-500" />
                          {exam.starts_at_label}
                        </div>
                        <div className="flex items-center text-xs text-zinc-600">
                          <FaClock className="mr-1.5 text-rose-500" />
                          {exam.ends_at_label}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium mt-1">
                          {exam.duration_minutes} Minutes
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {exam.report ? (
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-700">Attempts:</span>
                            <span className="text-xs font-bold text-indigo-600">{exam.report.total_attempts}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-700">Avg Score:</span>
                            <span className="text-xs font-bold text-emerald-600">{exam.report.avg_score} ({exam.report.avg_percentage}%)</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] mt-1">
                            <span className="flex items-center text-emerald-600"><FaCheckCircle className="mr-1" /> {exam.report.pass_count} Pass</span>
                            <span className="text-zinc-300">|</span>
                            <span className="flex items-center text-rose-600"><FaTimesCircle className="mr-1" /> {exam.report.fail_count} Fail</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">No Data</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/teacher/online-mcq/reports/${exam.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-colors"
                      >
                        View Report
                        <FaArrowRight className="ml-2 w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-t border-zinc-200">
              <span className="text-xs font-medium text-zinc-500">
                Showing page {pagination.current_page} of {pagination.last_page} ({pagination.count} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
