"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaFileAlt, FaFilePdf, FaFileImage, FaFileVideo, FaSearch, 
  FaDownload, FaVideo, FaTimes, FaCalendarAlt, FaUser, FaFolder, FaEye
} from "react-icons/fa";
import { 
  fetchStudentClassNotes, 
  fetchStudentClassNotesSubjects, 
  fetchStudentClassNotesDetail 
} from "@/features/students/redux/studentThunk";

export default function StudentClassNotesPage() {
  const dispatch = useDispatch();
  const { 
    classNotes, 
    classNotesSubjects, 
    classNotesDetail, 
    loadingClassNotesDetail, 
    loading, 
    error 
  } = useSelector((state) => state.students);

  const [selectedSubject, setSelectedSubject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentClassNotes());
    dispatch(fetchStudentClassNotesSubjects());
  }, [dispatch]);

  if (loading && !classNotes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load class notes: {error}
      </div>
    );
  }

  // Safely extract arrays from wrapper responses
  const subjectsList = Array.isArray(classNotesSubjects) 
    ? classNotesSubjects 
    : (classNotesSubjects?.subjects || classNotesSubjects?.data || []);

  const notesList = Array.isArray(classNotes) 
    ? classNotes 
    : (classNotes?.notes || classNotes?.data || []);

  // Sort notes newest first
  const sortedNotes = [...notesList].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Client-side instant filtering based on tab subject and search query
  const filteredNotes = sortedNotes.filter((note) => {
    // 1. Subject filter
    if (selectedSubject !== "all") {
      const matchSub = note.subject?.toLowerCase() === selectedSubject.toLowerCase();
      if (!matchSub) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = note.title?.toLowerCase().includes(q);
      const subjectMatch = note.subject?.toLowerCase().includes(q);
      const teacherMatch = note.teacher_name?.toLowerCase().includes(q) || note.teacher?.toLowerCase().includes(q);
      if (!titleMatch && !subjectMatch && !teacherMatch) return false;
    }

    return true;
  });

  const getFileTypeIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (type === "pdf") {
      return <FaFilePdf className="w-8 h-8 text-rose-500 shrink-0" />;
    }
    if (["jpg", "jpeg", "png", "gif", "image"].includes(type)) {
      return <FaFileImage className="w-8 h-8 text-blue-500 shrink-0" />;
    }
    if (["mp4", "mkv", "avi", "mov", "video"].includes(type)) {
      return <FaFileVideo className="w-8 h-8 text-amber-500 shrink-0" />;
    }
    return <FaFileAlt className="w-8 h-8 text-zinc-400 shrink-0" />;
  };

  const handleOpenDetail = (id) => {
    setIsDetailOpen(true);
    dispatch(fetchStudentClassNotesDetail(id));
  };

  const activeDetail = classNotesDetail?.note || classNotesDetail?.data || classNotesDetail || {};

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <PageHeader 
        title="Class Notes & Study Materials"
        subtitle="Browse lectures, view PDF guides, and download syllabus reference materials shared by your teachers."
      />

      {/* Search & Subject Chips */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search notes by title, subject, or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>

        {/* Dynamic Subject Filter Tabs/Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setSelectedSubject("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              selectedSubject === "all"
                ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            All Subjects
          </button>
          {subjectsList.map((subject, idx) => {
            const subjectName = typeof subject === "object" ? (subject.name || subject.title) : subject;
            return (
              <button
                key={idx}
                onClick={() => setSelectedSubject(subjectName)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  selectedSubject?.toLowerCase() === subjectName?.toLowerCase()
                    ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {subjectName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Class Notes Available</span>
          <span className="text-zinc-400/80 text-[10px]">No study materials matches your filtered subject or query tags.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((n) => (
            <div 
              key={n.id} 
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group text-left"
            >
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  {getFileTypeIcon(n.file_type)}
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {n.subject || "Study Note"}
                    </span>
                    <h4 className="font-extrabold text-zinc-800 text-sm mt-1.5 group-hover:text-violet-600 transition-colors line-clamp-1">
                      {n.title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-[10px] text-zinc-600">
                  <div className="flex items-center gap-2">
                    <FaFolder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Chapter: <strong className="text-zinc-700">{n.chapter || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUser className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Instructor: <strong className="text-zinc-700">{n.teacher || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Published: <strong className="text-zinc-700">{n.created_at_label || "N/A"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-5 pt-3 border-t border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {n.file_type || "File"}
                </span>
                <button 
                  onClick={() => handleOpenDetail(n.id)}
                  className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Notes Details Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col justify-between animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileAlt className="text-violet-500" />
                Study Material Details
              </h3>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
              {loadingClassNotesDetail || !classNotesDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {activeDetail.subject}
                      </span>
                      <h2 className="text-base font-extrabold text-zinc-800 leading-tight mt-2">
                        {activeDetail.title}
                      </h2>
                    </div>
                    {activeDetail.file_type && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-600 uppercase tracking-wider">
                        {activeDetail.file_type}
                      </span>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Description / Notes Overview</span>
                    <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {activeDetail.description || "No lecture notes description provided."}
                    </p>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Chapter</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.chapter || "N/A"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Teacher</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.teacher_name || activeDetail.teacher}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Class / Section</span>
                      <span className="font-bold text-zinc-700 text-xs block">Class {activeDetail.class}-{activeDetail.section}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Published Date</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.created_at_label}</span>
                    </div>
                  </div>

                  {/* Image Preview if image */}
                  {activeDetail.has_file && activeDetail.file_type?.toLowerCase() === "image" && activeDetail.download_url && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Image Preview</span>
                      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-100 max-h-60 flex items-center justify-center">
                        <img 
                          src={activeDetail.download_url} 
                          alt={activeDetail.title} 
                          className="max-h-60 object-contain w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachments Section */}
                  {(activeDetail.has_file || activeDetail.has_video) && (
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-zinc-100">
                      {activeDetail.has_file && (
                        <>
                          {activeDetail.file_type?.toLowerCase() === "pdf" ? (
                            <>
                              <a 
                                href={activeDetail.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <FaEye className="w-3.5 h-3.5" /> View PDF
                              </a>
                              <a 
                                href={activeDetail.download_url}
                                download
                                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-bold rounded-xl transition-all flex items-center gap-1.5"
                              >
                                <FaDownload className="w-3.5 h-3.5" /> Download PDF
                              </a>
                            </>
                          ) : (
                            <a 
                              href={activeDetail.download_url}
                              download
                              className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <FaDownload className="w-3.5 h-3.5" /> Download File
                            </a>
                          )}
                        </>
                      )}

                      {activeDetail.has_video && activeDetail.watch_url && (
                        <a 
                          href={activeDetail.watch_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <FaVideo className="w-3.5 h-3.5" /> Watch Video
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
