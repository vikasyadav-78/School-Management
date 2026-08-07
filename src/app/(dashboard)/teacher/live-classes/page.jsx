"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaVideo, FaEye, FaCalendarAlt, FaClock, FaSearch, FaTimesCircle, 
  FaCheckCircle, FaExclamationTriangle, FaTimes, FaCalendarDay, FaPlus 
} from "react-icons/fa";
import { 
  getTeacherManageLiveClassesMeta,
  getTeacherManageLiveClasses
} from "@/features/teachers/services/teacher.service";
import { fetchTeacherProfile } from "@/features/teachers/redux/teacherThunk";
import { toast } from "sonner";

export default function TeacherMyLiveClassesPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  // Profile data from Redux
  const { profile } = useSelector((state) => state.teachers);
  
  // Local state
  const [liveClasses, setLiveClasses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch profile if not loaded
      if (!profile) {
        await dispatch(fetchTeacherProfile()).unwrap();
      }
      
      const metaData = await getTeacherManageLiveClassesMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getTeacherManageLiveClasses();
      setLiveClasses(listData.live_classes || listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      toast.error("Failed to load your live classes: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshList = async () => {
    try {
      setListLoading(true);
      const listData = await getTeacherManageLiveClasses();
      setLiveClasses(listData.live_classes || listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.warn("Failed to refresh live classes:", err);
    } finally {
      setListLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const teacherId = profile?.teacher?.id;

  // 1. Filter: teacher_id == logged_in_teacher
  let ownClasses = liveClasses.filter(lc => lc.teacher_id === teacherId);

  // 2. Filter: Search and other fields
  const filteredClasses = ownClasses.filter(lc => {
    // Search term
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const metaTeacher = meta?.teachers?.find(t => t.id === lc.teacher_id);
      const metaSubject = meta?.subjects?.find(s => s.id === lc.subject_id);
      const metaClass = meta?.classes?.find(c => c.id === lc.school_class_id || c.id === lc.class_id);

      const title = (lc.title || "").toLowerCase();
      const topic = (lc.topic || "").toLowerCase();
      const subject = (typeof lc.subject === "string" ? lc.subject : lc.subject_name || metaSubject?.name || "").toLowerCase();
      const className = (typeof lc.class === "string" ? lc.class : lc.class_name || metaClass?.name || "").toLowerCase();

      if (!title.includes(q) && !topic.includes(q) && !subject.includes(q) && !className.includes(q)) {
        return false;
      }
    }

    // Class Filter
    if (classFilter) {
      const classIdMatch = lc.school_class_id === classFilter || lc.class_id === classFilter;
      if (!classIdMatch) return false;
    }

    // Platform Filter
    if (platformFilter && lc.platform !== platformFilter) {
      return false;
    }

    // Date Filter
    if (dateFilter) {
      const classDateStr = lc.date || (lc.scheduled_at ? lc.scheduled_at.split("T")[0] : "");
      if (classDateStr !== dateFilter) return false;
    }

    // Status Filter (All, Upcoming, Live, Completed, Cancelled)
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

    if (statusFilter) {
      if (statusFilter === "upcoming" && computedStatus !== "upcoming") return false;
      if (statusFilter === "live" && computedStatus !== "live") return false;
      if (statusFilter === "completed" && computedStatus !== "completed") return false;
      if (statusFilter === "cancelled" && computedStatus !== "cancelled") return false;
    }

    return true;
  });

  const hasManageLiveClassesPermission = 
    profile?.can_manage_live_classes === true || 
    profile?.can_manage_live_classes === "true" ||
    profile?.can_manage_live_classes === 1 ||
    profile?.can_manage_live_classes === "1" ||
    profile?.enabled_features?.includes("live_classes");

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="My Live Classes"
          subtitle="Manage and launch your assigned virtual class meetings."
        />
        {hasManageLiveClassesPermission && (
          <button
            onClick={() => router.push("/teacher/admin/live-classes?schedule=true")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Schedule Live Class
          </button>
        )}
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
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="">All Classes</option>
            {meta?.classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
          >
            <option value="">All Platforms</option>
            {meta?.platforms?.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          {/* Date Filter */}
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-zinc-50"
          />
        </div>
      </div>

      {/* Grid List */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState 
          title="No Live Classes Found" 
          desc="You do not have any live classes matching the selected filters." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((lc) => {
            const metaSubject = meta?.subjects?.find(s => s.id === lc.subject_id);
            const metaClass = meta?.classes?.find(c => c.id === lc.school_class_id || c.id === lc.class_id);

            const subjectName = typeof lc.subject === "string" ? lc.subject : (lc.subject_name || lc.subject?.name || metaSubject?.name || "Subject");
            const className = typeof lc.class === "string" ? lc.class : (lc.class_name || lc.school_class?.name || metaClass?.name || "Class");
            const sectionName = typeof lc.section === "string" ? lc.section : (lc.section_name || lc.section?.name || "");

            const subjectClassLabel = `${subjectName} • ${className}${sectionName ? ` (${sectionName})` : ""}`;
            const scheduleLabel = lc.scheduled_at_label || (lc.date ? `${lc.date} ${lc.start_time || ""}`.trim() : null) || (lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "Scheduled");
            const joinUrl = lc.meeting_url || lc.join_url || lc.url;
            
            const now = new Date();
            const startTimeVal = lc.scheduled_at ? new Date(lc.scheduled_at) : null;
            const endTimeVal = lc.ends_at ? new Date(lc.ends_at) : (startTimeVal && lc.duration_minutes ? new Date(startTimeVal.getTime() + lc.duration_minutes * 60000) : null);
             
            let isJoinable = false;
            let joinButtonText = "Join Class";
            let computedStatus = lc.status || "scheduled";

            if (computedStatus === "completed" || computedStatus === "cancelled" || (endTimeVal && now > endTimeVal)) {
              isJoinable = false;
              joinButtonText = computedStatus === "cancelled" ? "Cancelled" : "View Report";
              computedStatus = computedStatus === "cancelled" ? "cancelled" : "completed";
            } else if (lc.is_live || computedStatus === "live") {
              isJoinable = true;
              joinButtonText = "Join Class";
              computedStatus = "live";
            } else if (startTimeVal && now < startTimeVal) {
              isJoinable = false;
              joinButtonText = "Upcoming";
              computedStatus = "upcoming";
            } else {
              isJoinable = true;
              joinButtonText = "Join Class";
              computedStatus = "live";
            }

            const isCompleted = computedStatus === "completed";

            return (
              <div key={lc.id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                      computedStatus === "live" ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse" :
                      computedStatus === "completed" ? "bg-zinc-100 border-zinc-200 text-zinc-600" :
                      computedStatus === "cancelled" ? "bg-red-50 border-red-100 text-red-600" :
                      "bg-violet-50 border-violet-100 text-violet-600"
                    }`}>
                      {lc.platform_label || lc.platform || "LIVE"} • {computedStatus.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-zinc-800 text-sm mb-1">{lc.title}</h4>
                  {lc.topic && <span className="text-[10px] text-zinc-500 font-semibold block mb-3">Topic: {lc.topic}</span>}

                  <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="flex justify-between">
                      <span>Subject / Class:</span>
                      <span className="font-bold text-zinc-800">{subjectClassLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span className="font-bold text-zinc-800">{scheduleLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-bold text-zinc-800">{lc.duration_minutes || 0} Mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isCompleted ? (
                    <button
                      onClick={() => router.push(`/teacher/admin/live-classes/reports/${lc.id}`)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-zinc-200"
                    >
                      <FaEye className="w-3.5 h-3.5" /> View Report
                    </button>
                  ) : (
                    joinUrl && (
                      isJoinable ? (
                        <a
                          href={joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer text-xs"
                        >
                          <FaVideo className="w-3.5 h-3.5" /> {joinButtonText}
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex-1 py-2 bg-zinc-100 text-zinc-400 font-bold rounded-xl border border-zinc-200 transition-all flex items-center justify-center gap-1 cursor-not-allowed text-xs"
                        >
                          <FaVideo className="w-3.5 h-3.5" /> {joinButtonText}
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
