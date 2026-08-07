"use client";

import { useEffect, useState, useRef } from "react";
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
  getTeacherLiveClassReports,
  getTeacherManageLiveClassesMeta
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherLiveClassReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // API Data
  const [reportsData, setReportsData] = useState(null);
  const [classesMeta, setClassesMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Filters State (Initialized from URL parameters if present)
  const [classId, setClassId] = useState(searchParams.get("class_id") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [perPage, setPerPage] = useState(parseInt(searchParams.get("per_page")) || 30);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const searchTimeoutRef = useRef(null);

  // 1. Handle search input debounce
  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // 2. Fetch metadata on mount
  const fetchMeta = async () => {
    try {
      const metaData = await getTeacherManageLiveClassesMeta();
      setClassesMeta(metaData.classes || []);
    } catch (err) {
      console.warn("Failed to load metadata classes:", err);
    }
  };

  // 3. Fetch reports based on active filters and pagination
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

      // Sync URL
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (classId) current.set("class_id", classId); else current.delete("class_id");
      if (status) current.set("status", status); else current.delete("status");
      if (debouncedSearch.trim()) current.set("search", debouncedSearch.trim()); else current.delete("search");
      current.set("per_page", perPage.toString());
      current.set("page", page.toString());
      router.push(`${pathname}?${current.toString()}`);

      const data = await getTeacherLiveClassReports(params);
      setReportsData(data);
    } catch (err) {
      toast.error("Failed to load live class reports: " + (err.message || err));
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  // Load Metadata once
  useEffect(() => {
    fetchMeta();
  }, []);

  // Fetch reports when filters or page change
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
  const liveClassesList = reportsData?.live_classes || [];
  const totalCount = reportsData?.count || 0;
  const lastPage = reportsData?.last_page || 1;

  // Frontend-side search and status filter to guarantee cards update correctly
  const filteredClassesList = liveClassesList.filter(lc => {
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

  // Calculate dynamic summaries based on the currently filtered list
  const totalClasses = filteredClassesList.length;
  const totalRecordings = filteredClassesList.reduce((acc, c) => acc + (c.recordings_count || (c.recording_url ? 1 : 0)), 0);
  const totalPresent = filteredClassesList.reduce((acc, c) => acc + (c.join_stats?.joined || 0), 0);
  const totalAbsent = filteredClassesList.reduce((acc, c) => acc + (c.join_stats?.not_joined || 0), 0);
  const totalLate = filteredClassesList.reduce((acc, c) => acc + (c.join_stats?.late || c.attendance_summary?.late || 0), 0);
  const totalEarlyExit = filteredClassesList.reduce((acc, c) => acc + (c.join_stats?.early_exit || c.attendance_summary?.early_exit || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <PageHeader 
        title="Live Class Reports"
        subtitle="Track student attendance and join statistics across scheduled and completed virtual classes."
      />

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Classes */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Classes</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-zinc-800">{totalClasses}</span>
            <FaVideo className="text-violet-500 w-4 h-4" />
          </div>
        </div>

        {/* Total Recordings */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Recordings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-zinc-800">{totalRecordings}</span>
            <FaFileAlt className="text-blue-500 w-4 h-4" />
          </div>
        </div>

        {/* Present Students */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Present</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-emerald-600">{totalPresent}</span>
            <FaCheckCircle className="text-emerald-500 w-4 h-4" />
          </div>
        </div>

        {/* Late Students */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Late</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-amber-600">{totalLate}</span>
            <FaClockIcon className="text-amber-500 w-4 h-4" />
          </div>
        </div>

        {/* Absent Students */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Absent</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-rose-600">{totalAbsent}</span>
            <FaTimesCircle className="text-rose-500 w-4 h-4" />
          </div>
        </div>

        {/* Early Exit */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Early Exit</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-extrabold text-purple-600">{totalEarlyExit}</span>
            <FaExclamationTriangle className="text-purple-500 w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input 
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search title, topic, subject, class..."
              className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl outline-none text-xs font-bold text-zinc-700 bg-zinc-50"
            />
            <FaSearch className="absolute left-3.5 top-3 text-zinc-400 w-3.5 h-3.5" />
          </div>

          {/* Class Filter */}
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="">All Classes</option>
            {classesMeta.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live Now</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Per Page */}
          <select
            value={perPage}
            onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="30">30 Per Page</option>
            <option value="50">50 Per Page</option>
            <option value="100">100 Per Page</option>
          </select>
        </div>
      </div>

      {/* Roster / Reports Grid */}
      {listLoading ? (
        <div className="flex justify-center py-20"><PageLoader /></div>
      ) : filteredClassesList.length === 0 ? (
        <EmptyState title="No Reports Found" desc="No live classes match your query parameters." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClassesList.map((lc) => {
              const stats = lc.join_stats || { total_students: 0, joined: 0, not_joined: 0 };
              
              const now = new Date();
              const startTimeVal = lc.scheduled_at ? new Date(lc.scheduled_at) : null;
              const endTimeVal = lc.ends_at ? new Date(lc.ends_at) : (startTimeVal && lc.duration_minutes ? new Date(startTimeVal.getTime() + lc.duration_minutes * 60000) : null);
              
              let computedStatus = lc.status || "scheduled";
              if (computedStatus === "completed" || computedStatus === "cancelled" || (endTimeVal && now > endTimeVal)) {
                computedStatus = computedStatus === "cancelled" ? "cancelled" : "completed";
              } else if (lc.is_live || computedStatus === "live") {
                computedStatus = "live";
              } else if (startTimeVal && now < startTimeVal) {
                computedStatus = "upcoming";
              } else {
                computedStatus = "live";
              }

              return (
                <div key={lc.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                        computedStatus === "live" ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse" :
                        computedStatus === "completed" ? "bg-zinc-100 border-zinc-200 text-zinc-600" :
                        "bg-violet-50 border-violet-100 text-violet-600"
                      }`}>
                        {lc.platform_label || lc.platform || "LIVE"} • {computedStatus.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-zinc-800 text-sm mb-1">{lc.title}</h4>
                    {lc.topic && <span className="text-[10px] text-zinc-500 font-semibold block mb-3">Topic: {lc.topic}</span>}

                    <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <div className="flex justify-between"><span>Subject / Class:</span><span className="font-bold text-zinc-800">{lc.subject || "—"} • {lc.class || "—"}{lc.section ? ` (${lc.section})` : ""}</span></div>
                      <div className="flex justify-between"><span>Scheduled:</span><span className="font-bold text-zinc-800">{lc.scheduled_at_label || "—"}</span></div>
                      <div className="flex justify-between"><span>Duration:</span><span className="font-bold text-zinc-800">{lc.duration_minutes || 0} Mins</span></div>
                    </div>

                    {/* Join Statistics */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                        <span>Join Statistics</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                          <span className="block text-xs">{stats.joined}</span>
                          Joined
                        </div>
                        <div className="p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                          <span className="block text-xs">{stats.not_joined}</span>
                          Not Joined
                        </div>
                        <div className="p-2 bg-zinc-50 text-zinc-700 rounded-xl border border-zinc-200">
                          <span className="block text-xs">{stats.total_students}</span>
                          Total
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/teacher/admin/live-classes/reports/${lc.id}`)}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-violet-600/10"
                  >
                    View Report
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs font-bold text-zinc-600">
              <span>Showing {filteredClassesList.length} of {totalCount} records</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <span>Page {page} of {lastPage}</span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
