"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaVideo, FaTimes, FaHandPaper, FaPaperPlane, FaDownload, FaUsers, FaClock, FaChalkboardTeacher
} from "react-icons/fa";
import { 
  getStudentLiveClasses,
  getStudentLiveClassDetail,
  joinStudentLiveClass,
  leaveStudentLiveClass,
  raiseHandStudentLiveClass
} from "@/features/students/services/module.service";
import { toast } from "sonner";

export default function StudentLiveClassesPage() {
  const [filter, setFilter] = useState("upcoming"); // "upcoming" | "today" | "all" | "past"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);

  // Active Live Class Drawer State
  const [activeClass, setActiveClass] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadClasses = async () => {
    try {
      setListLoading(true);
      const data = await getStudentLiveClasses({ filter });
      setLiveClasses(data.live_classes || data.classes || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("Failed to load live classes: " + (err.message || err));
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [filter]);

  // Open Drawer / Inspector
  const handleOpenDetail = async (lc) => {
    try {
      setIsDrawerOpen(true);
      setActiveClass(lc);
      const detailed = await getStudentLiveClassDetail(lc.id);
      setActiveClass(detailed.live_class || detailed.data || detailed || lc);
    } catch (err) {
      toast.error("Failed to load class details: " + (err.message || err));
    }
  };

  const handleJoinClass = async (lc) => {
    try {
      const res = await joinStudentLiveClass(lc.id);
      toast.success("Joined live class successfully!");

      const meetUrl = res.meeting_url || lc.meeting_url;
      if (meetUrl) {
        window.open(meetUrl, "_blank");
      } else {
        toast.info("Meeting portal launched in app.");
      }
      loadClasses();
    } catch (err) {
      toast.error("Failed to join live class: " + (err.message || err));
    }
  };

  const handleLeaveClass = async () => {
    if (!activeClass) return;
    try {
      await leaveStudentLiveClass(activeClass.id);
      toast.success("Left live class session.");
      setIsDrawerOpen(false);
      loadClasses();
    } catch (err) {
      toast.error("Failed to leave class: " + (err.message || err));
    }
  };

  const handleRaiseHand = async () => {
    if (!activeClass) return;
    try {
      await raiseHandStudentLiveClass(activeClass.id);
      toast.success("Hand raised! Teacher notified.");
    } catch (err) {
      toast.error("Failed to raise hand: " + (err.message || err));
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <PageHeader 
        title="Student Live Classes"
        subtitle="Join interactive online lectures, download course materials, and participate in live chats."
      />

      {/* Filter Toolbar */}
      <div className="flex border-b border-zinc-200">
        {["upcoming", "today", "all", "past"].map(fKey => (
          <button
            key={fKey}
            onClick={() => setFilter(fKey)}
            className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer capitalize ${
              filter === fKey ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {fKey} Classes
          </button>
        ))}
      </div>

      {/* Roster Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : liveClasses.length === 0 ? (
        <EmptyState title="No Live Classes Found" desc="No scheduled live classes match this filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveClasses.map(lc => {
                const teacherName = typeof lc.teacher === "string" ? lc.teacher : (lc.teacher_name || lc.teacher?.full_name || lc.teacher?.name || "Faculty Teacher");
                const subjectName = typeof lc.subject === "string" ? lc.subject : (lc.subject_name || lc.subject?.name || "—");
                const className = typeof lc.class === "string" ? lc.class : (lc.class_name || lc.school_class?.name || "—");
                const sectionName = typeof lc.section === "string" ? lc.section : (lc.section?.name || "");
                const scheduleLabel = lc.scheduled_at_label || (lc.date ? `${lc.date} (${lc.start_time} - ${lc.end_time})` : "Scheduled");
                
                const now = new Date();
                const startTimeVal = lc.scheduled_at ? new Date(lc.scheduled_at) : null;
                const endTimeVal = lc.ends_at ? new Date(lc.ends_at) : (startTimeVal && lc.duration_minutes ? new Date(startTimeVal.getTime() + lc.duration_minutes * 60000) : null);
                
                let isJoinActive = false;
                let joinButtonText = "Join & Attend";
                let isUpcoming = false;
                let isCompleted = false;

                if (lc.status === "completed" || lc.status === "cancelled" || (endTimeVal && now > endTimeVal)) {
                  isJoinActive = false;
                  joinButtonText = lc.status === "cancelled" ? "Cancelled" : "Class Ended";
                  isCompleted = true;
                } else if (lc.is_live || lc.status === "live") {
                  isJoinActive = true;
                  joinButtonText = "Join & Attend";
                } else if (startTimeVal && endTimeVal) {
                  const fiveMinutesBeforeStart = new Date(startTimeVal.getTime() - 5 * 60 * 1000);
                  if (now >= fiveMinutesBeforeStart && now <= endTimeVal) {
                    isJoinActive = true;
                    joinButtonText = "Join & Attend";
                  } else if (now < fiveMinutesBeforeStart) {
                    isJoinActive = false;
                    joinButtonText = "Upcoming";
                    isUpcoming = true;
                  } else {
                    isJoinActive = false;
                    joinButtonText = "Class Ended";
                    isCompleted = true;
                  }
                } else {
                  isJoinActive = true;
                  joinButtonText = "Join & Attend";
                }

                return (
                  <div key={lc.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="inline-flex px-2 py-0.5 rounded-lg border border-purple-100 bg-purple-50 text-[8px] font-black text-purple-700 uppercase">
                          {lc.platform_label || lc.platform || "Video"} Live
                        </span>
                        {isJoinActive && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg animate-pulse uppercase">
                            ● Live Now
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-zinc-800 text-sm mb-1">{lc.title}</h4>
                      {lc.topic && <span className="text-[10px] text-zinc-500 font-semibold block mb-3">Topic: {lc.topic}</span>}

                      <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div className="flex justify-between"><span>Teacher:</span><span className="font-bold text-zinc-800">{teacherName}</span></div>
                        <div className="flex justify-between"><span>Subject / Class:</span><span className="font-bold text-zinc-800">{subjectName} • {className}{sectionName ? ` (${sectionName})` : ""}</span></div>
                        <div className="flex justify-between"><span>Schedule:</span><span className="font-bold text-zinc-800">{scheduleLabel}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinClass(lc)}
                        disabled={!isJoinActive}
                        className={`flex-1 py-2.5 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs ${
                          isJoinActive
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        }`}
                        title={!isJoinActive ? "This class is not available to join right now" : "Join Class"}
                      >
                        <FaVideo className="w-3.5 h-3.5" /> {joinButtonText}
                      </button>

                      <button
                        onClick={() => handleOpenDetail(lc)}
                        className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                        title="Class Details & Chat"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* Interactive Live Class Drawer / Modal */}
      {isDrawerOpen && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaVideo className="text-violet-500" /> Live Class Interactive Portal
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <div>
                  <h4 className="font-extrabold text-zinc-800 text-sm">{activeClass.title}</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold block">
                    Teacher: {typeof activeClass.teacher === "string" ? activeClass.teacher : (activeClass.teacher_name || activeClass.teacher?.full_name || "Faculty")}
                    {activeClass.subject ? ` • ${typeof activeClass.subject === "string" ? activeClass.subject : activeClass.subject?.name}` : ""}
                  </span>
                </div>
                <button
                  onClick={handleRaiseHand}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer"
                >
                  <FaHandPaper className="w-3 h-3 text-amber-500" /> Raise Hand
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={handleLeaveClass}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Leave Class Session
              </button>

              <button onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
