"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaVideo, FaFileAlt, FaUsers, FaCheckCircle,
  FaTimesCircle, FaClock as FaClockIcon, FaExclamationTriangle,
  FaSearch, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import {
  getAdminLiveClassReports,
  getAdminManageLiveClassesMeta
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";

function AdminLiveClassReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [reportsData, setReportsData] = useState(null);
  const [classesMeta, setClassesMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [perPage, setPerPage] = useState(parseInt(searchParams.get("per_page")) || 30);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const fetchMeta = async () => {
    try {
      const metaData = await getAdminManageLiveClassesMeta();
      setClassesMeta(metaData.classes || []);
    } catch (err) {
      console.warn("Failed to load metadata classes:", err);
    }
  };

  const fetchReports = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setListLoading(true);

      const params = {
        per_page: perPage,
        page
      };

      if (classId) params.class_id = classId;
      if (status) params.status = status;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (classId) current.set("class_id", classId); else current.delete("class_id");
      if (status) current.set("status", status); else current.delete("status");
      if (debouncedSearch.trim()) current.set("search", debouncedSearch.trim()); else current.delete("search");
      current.set("per_page", perPage.toString());
      current.set("page", page.toString());
      router.push(`${pathname}?${current.toString()}`);

      const data = await getAdminLiveClassReports(params);
      setReportsData(data);
    } catch (err) {
      toast.error("Failed to load live class reports: " + (err.message || err));
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchReports(loading);
  }, [classId, status, debouncedSearch, perPage, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const reportSummary = reportsData?.report || {};
  const teacherActivity = reportSummary.teacher_activity || [];
  const liveClassesList = reportsData?.live_classes || [];
  const totalCount = reportsData?.count || 0;
  const lastPage = reportsData?.last_page || 1;

  const totalClasses = reportSummary.total_classes || 0;
  const totalRecordings = reportSummary.total_recordings || 0;
  const totalPresent = reportSummary.present || 0;
  const totalAbsent = reportSummary.absent || 0;
  const totalLate = reportSummary.late || 0;
  const totalEarlyExit = reportSummary.early_exit || 0;
  const liveNow = reportSummary.live_now || 0;
  const completed = reportSummary.completed || 0;

  const filteredClassesList = liveClassesList.filter((lc) => {
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const titleMatch = lc.title?.toLowerCase().includes(q);
      const topicMatch = lc.topic?.toLowerCase().includes(q);
      const subjectMatch = lc.subject?.toLowerCase().includes(q);
      const classMatch = lc.class?.toLowerCase().includes(q);

      if (!titleMatch && !topicMatch && !subjectMatch && !classMatch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <PageHeader
        title="Live Class Reports"
        subtitle="Track student attendance and join statistics across scheduled and completed virtual classes."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Classes</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-zinc-800">{totalClasses}</span>
            <FaVideo className="text-violet-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Live Now</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-rose-600">{liveNow}</span>
            <FaVideo className="text-rose-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Completed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-zinc-800">{completed}</span>
            <FaCheckCircle className="text-zinc-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Attendance Records</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-zinc-800">{reportSummary.total_attendance_records || 0}</span>
            <FaFileAlt className="text-blue-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Present</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-emerald-600">{totalPresent}</span>
            <FaCheckCircle className="text-emerald-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Late</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-amber-600">{totalLate}</span>
            <FaClockIcon className="text-amber-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Absent</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-rose-600">{totalAbsent}</span>
            <FaTimesCircle className="text-rose-500 w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Early Exit</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-purple-600">{totalEarlyExit}</span>
            <FaExclamationTriangle className="text-purple-500 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-zinc-800 text-sm">Teacher Activity</h3>
          <span className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{teacherActivity.length} Teachers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/75 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-3">Teacher</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3 text-center">Classes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700 font-semibold">
              {teacherActivity.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-zinc-400 italic">No teacher activity loaded for this report range.</td>
                </tr>
              ) : (
                teacherActivity.map((teacher) => (
                  <tr key={teacher.teacher_id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-800">{teacher.teacher || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600">{teacher.employee_id || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-violet-700 font-extrabold">{teacher.total_classes || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminLiveClassReportsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      }>
        <AdminLiveClassReportsContent />
      </Suspense>
    </DashboardLayout>
  );
}