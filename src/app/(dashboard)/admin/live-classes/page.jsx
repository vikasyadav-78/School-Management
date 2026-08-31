"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaPlus, FaTimes, FaVideo, FaTrash, FaEye, FaCalendarAlt, FaClock, FaUser, FaBook, FaChalkboard, FaSearch
} from "react-icons/fa";
import {
  getAdminManageLiveClassesMeta,
  getAdminManageLiveClasses,
  addAdminManageLiveClass,
  getAdminManageLiveClassDetail,
  updateAdminManageLiveClassRecording,
  deleteAdminManageLiveClass,
  getAdminClassStreams
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

function AdminManageLiveClassesContent() {
  const dialog = useAppDialog();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [liveClasses, setLiveClasses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

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

  const [activeClass, setActiveClass] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [recordingUrlDraft, setRecordingUrlDraft] = useState("");
  const [recordingSubmitting, setRecordingSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [platform, setPlatform] = useState("jitsi");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [dynamicStreams, setDynamicStreams] = useState([]);
  const [stream, setStream] = useState("");
  const [streamId, setStreamId] = useState("");

  const selectedClassObj = meta?.classes?.find(c => String(c.id) === String(classId));
  const cleanClassName = selectedClassObj ? selectedClassObj.name.replace(/class\s*-?/i, '').trim() : "";
  const showStreamField = cleanClassName.includes("11") || cleanClassName.includes("12");

  useEffect(() => {
    if (showStreamField && classId) {
      getAdminClassStreams(classId)
        .then(res => {
          const streamsList = res.streams || res.data || (Array.isArray(res) ? res : []);
          setDynamicStreams(streamsList);
        })
        .catch(err => {
          console.error("Failed to load class streams:", err);
          setDynamicStreams([]);
        });
    } else {
      setDynamicStreams([]);
      setStream("");
      setStreamId("");
    }
  }, [showStreamField, classId]);

  const loadLiveClasses = async () => {
    try {
      setLoading(true);
      const metaData = await getAdminManageLiveClassesMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getAdminManageLiveClasses();
      setLiveClasses(listData.live_classes || listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load live classes manager: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveClasses();
  }, []);

  useEffect(() => {
    if (searchParams.get("schedule") === "true") {
      resetForm();
      setIsFormModalOpen(true);
    }
  }, [searchParams]);

  const refreshList = async () => {
    try {
      setListLoading(true);
      const listData = await getAdminManageLiveClasses();
      setLiveClasses(listData.live_classes || listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenDetail = async (lc) => {
    try {
      const detailed = await getAdminManageLiveClassDetail(lc.id);
      const detail = detailed.live_class || detailed.data || detailed || lc;
      setActiveClass(detail);
      setRecordingUrlDraft(detail.recording_url || "");
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load live class details: " + (err.message || err));
    }
  };

  const handleUpdateRecording = async (e) => {
    e.preventDefault();

    if (!activeClass?.id) return;

    try {
      setRecordingSubmitting(true);
      await updateAdminManageLiveClassRecording(activeClass.id, {
        recording_url: recordingUrlDraft.trim()
      });
      toast.success("Recording URL updated successfully.");
      setActiveClass((prev) => ({ ...prev, recording_url: recordingUrlDraft.trim() }));
      refreshList();
    } catch (err) {
      toast.error("Failed to update recording URL: " + (err.message || err));
    } finally {
      setRecordingSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setTopic("");
    setTeacherId("");
    setSubjectId("");
    setClassId("");
    setSectionId("");
    setPlatform("jitsi");
    setMeetingUrl("");
    setDate("");
    setStartTime("10:00");
    setEndTime("11:00");
    setFormError("");
    setStream("");
    setStreamId("");
    setDynamicStreams([]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !topic.trim() || !teacherId || !subjectId || !classId || !date || !meetingUrl.trim()) {
      setFormError("Title, Topic, Teacher, Subject, Class, Date, and Meeting URL are required.");
      return;
    }

    const cleanUrl = meetingUrl.trim();
    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      setFormError("Please enter a valid Meeting URL starting with http:// or https://");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        topic: topic.trim(),
        teacher_id: teacherId,
        subject_id: subjectId,
        school_class_id: classId,
        class_id: classId,
        platform: platform || "google_meet",
        meeting_url: cleanUrl,
        join_url: cleanUrl,
        date,
        start_time: startTime,
        end_time: endTime
      };

      if (sectionId) {
        payload.section_id = sectionId;
      }

      if (showStreamField && stream) {
        const selectedStreamObj = dynamicStreams.find(s => String(s.id) === String(stream));
        if (selectedStreamObj) {
          payload.stream = selectedStreamObj.name;
          payload.stream_id = selectedStreamObj.id;
        } else {
          payload.stream = stream;
          payload.stream_id = "";
        }
      }

      await addAdminManageLiveClass(payload);
      toast.success("Live class scheduled successfully!");
      setIsFormModalOpen(false);
      router.replace("/admin/live-classes");
      refreshList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to schedule live class.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (liveClassId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Live Class",
      message: "Are you sure you want to delete this live class session?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteAdminManageLiveClass(liveClassId);
      toast.success("Live class session deleted!");
      if (activeClass?.id === liveClassId) setIsDetailModalOpen(false);
      refreshList();
    } catch (err) {
      toast.error("Failed to delete live class: " + (err.message || err));
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Manage Live Classes feature is not enabled for your account. Contact school admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const filteredClasses = liveClasses.filter((lc) => {
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const metaTeacher = meta?.teachers?.find((t) => t.id === lc.teacher_id);
      const metaSubject = meta?.subjects?.find((s) => s.id === lc.subject_id);
      const metaClass = meta?.classes?.find((c) => c.id === lc.school_class_id || c.id === lc.class_id);

      const title = (lc.title || "").toLowerCase();
      const topic = (lc.topic || "").toLowerCase();
      const subject = (typeof lc.subject === "string" ? lc.subject : lc.subject_name || metaSubject?.name || "").toLowerCase();
      const className = (typeof lc.class === "string" ? lc.class : lc.class_name || metaClass?.name || "").toLowerCase();

      if (!title.includes(q) && !topic.includes(q) && !subject.includes(q) && !className.includes(q)) {
        return false;
      }
    }

    if (classFilter) {
      const classIdMatch = lc.school_class_id === classFilter || lc.class_id === classFilter;
      if (!classIdMatch) return false;
    }

    if (platformFilter && lc.platform !== platformFilter) {
      return false;
    }

    if (dateFilter) {
      const classDateStr = lc.date || (lc.scheduled_at ? lc.scheduled_at.split("T")[0] : "");
      if (classDateStr !== dateFilter) return false;
    }

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

  const baseStreamOptions = dynamicStreams.length > 0
    ? dynamicStreams.map(stm => ({ value: stm.id, label: stm.name }))
    : [
        { value: "Science", label: "Science" },
        { value: "Commerce", label: "Commerce" },
        { value: "Arts", label: "Arts" }
      ];

  const streamOptions = [
    { value: "", label: "Select Stream" },
    ...baseStreamOptions
  ];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="School Live Classes Manager"
          subtitle="Schedule and administer video live lectures, assign host teachers, and track attendance."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Schedule Live Class
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Search</label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search title, topic..."
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl outline-none text-xs font-semibold text-black bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            />
            <FaSearch className="absolute left-3.5 top-3.5 text-zinc-400 w-3.5 h-3.5" />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
          >
            <option value="">All Classes</option>
            {meta?.classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Platform</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
          >
            <option value="">All Platforms</option>
            {meta?.platforms?.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-200 rounded-xl outline-none text-xs text-black font-semibold bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
          />
        </div>
      </div>

      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState title="No Live Classes Scheduled" desc="Schedule a live online class session for students." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((lc) => {
            const metaTeacher = meta?.teachers?.find((t) => t.id === lc.teacher_id);
            const metaSubject = meta?.subjects?.find((s) => s.id === lc.subject_id);
            const metaClass = meta?.classes?.find((c) => c.id === lc.school_class_id || c.id === lc.class_id);

            const teacherName = typeof lc.teacher === "string" ? lc.teacher : (lc.teacher_name || lc.teacher?.full_name || lc.teacher?.name || metaTeacher?.full_name || metaTeacher?.name || "—");
            const subjectName = typeof lc.subject === "string" ? lc.subject : (lc.subject_name || lc.subject?.name || metaSubject?.name || "Subject");
            const className = typeof lc.class === "string" ? lc.class : (lc.class_name || lc.school_class?.name || metaClass?.name || "Class");
            const sectionName = typeof lc.section === "string" ? lc.section : (lc.section_name || lc.section?.name || "");

            const streamLabel = lc.stream ? ` (${lc.stream})` : "";
            const subjectClassLabel = `${subjectName} • ${className}${streamLabel}${sectionName ? ` (${sectionName})` : ""}`;
            const scheduleLabel = lc.scheduled_at_label || (lc.date ? `${lc.date} ${lc.start_time || ""}`.trim() : null) || (lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "Scheduled");
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
            } else if (startTimeVal && now < startTimeVal) {
              isJoinable = false;
              joinButtonText = "Upcoming";
              computedStatus = "upcoming";
            } else {
              isJoinable = true;
              joinButtonText = "Join Class";
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
                    <button onClick={() => handleDelete(lc.id)} className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer" title="Delete Live Class">
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-zinc-800 text-sm mb-1">{lc.title}</h4>
                  {lc.topic && <span className="text-[10px] text-zinc-500 font-semibold block mb-3">Topic: {lc.topic}</span>}

                  <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="flex justify-between"><span>Teacher:</span><span className="font-bold text-zinc-800">{teacherName}</span></div>
                    <div className="flex justify-between"><span>Subject / Class:</span><span className="font-bold text-zinc-800">{subjectClassLabel}</span></div>
                    <div className="flex justify-between"><span>Scheduled:</span><span className="font-bold text-zinc-800">{scheduleLabel}</span></div>
                    <div className="flex justify-between"><span>Duration:</span><span className="font-bold text-zinc-800">{lc.duration_minutes || 0} Mins</span></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-zinc-100">
                  <button onClick={() => handleOpenDetail(lc)} className="flex-1 py-2 bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs">
                    <FaEye className="w-3.5 h-3.5" /> View
                  </button>
                  {joinUrl && isJoinable ? (
                    <a href={joinUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-sm">
                      <FaVideo className="w-3.5 h-3.5" /> {joinButtonText}
                    </a>
                  ) : (
                    <button onClick={() => router.push(`/admin/live-classes/reports/${lc.id}`)} className="flex-1 py-2 bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs">
                      <FaVideo className="w-3.5 h-3.5" /> {joinButtonText}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaVideo className="text-violet-500" />
                Schedule New Live Class
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold">{formError}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Science Revision Class" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Topic *</label>
                <input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic / Lesson focus" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Teacher *</label>
                  <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">Select Teacher</option>
                    {meta?.teachers?.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject *</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">Select Subject</option>
                    {meta?.subjects?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class *</label>
                  <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">Select Class</option>
                    {meta?.classes?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">All Sections</option>
                    {(meta?.classes?.find((c) => c.id === classId)?.sections || []).map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showStreamField && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Stream *</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 font-semibold text-black"
                  >
                    {streamOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    {meta?.platforms?.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Meeting URL *</label>
                  <input type="text" required value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Schedule Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer">{submitting ? "Scheduling..." : "Schedule Live Class"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaVideo className="text-violet-500" />
                Live Class Detail: <span className="text-violet-600">{activeClass.title}</span>
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-zinc-600">
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Teacher:</span><span className="font-extrabold text-zinc-800">{activeClass.teacher_name || activeClass.teacher || "—"}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Subject:</span><span className="font-extrabold text-zinc-800">{activeClass.subject || "—"}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Class:</span><span className="font-extrabold text-zinc-800">{activeClass.class || "—"}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Platform:</span><span className="font-extrabold text-zinc-800">{activeClass.platform_label || activeClass.platform || "—"}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Schedule:</span><span className="font-extrabold text-zinc-800">{activeClass.scheduled_at_label || activeClass.date || "—"}</span></div>
                <div className="flex justify-between border-b border-zinc-100 pb-2"><span>Status:</span><span className="font-extrabold text-zinc-800">{activeClass.status_label || activeClass.status || "—"}</span></div>
              </div>

              {activeClass.meeting_url || activeClass.join_url ? (
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl text-[10px] font-bold text-zinc-700">
                  <div className="mb-2 uppercase tracking-wider text-violet-700">Join URL</div>
                  <a href={activeClass.meeting_url || activeClass.join_url} target="_blank" rel="noreferrer" className="text-violet-600 break-all underline">{activeClass.meeting_url || activeClass.join_url}</a>
                </div>
              ) : null}

              <form onSubmit={handleUpdateRecording} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Recording URL</div>
                    <div className="text-[10px] text-zinc-500 font-semibold">Update the session recording link after the class ends.</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={recordingUrlDraft}
                    onChange={(e) => setRecordingUrlDraft(e.target.value)}
                    placeholder="https://example.com/recording.mp4"
                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={recordingSubmitting}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-70"
                  >
                    {recordingSubmitting ? "Saving..." : "Update Recording"}
                  </button>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer">Close Detail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminManageLiveClassesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      }>
        <AdminManageLiveClassesContent />
      </Suspense>
    </DashboardLayout>
  );
}