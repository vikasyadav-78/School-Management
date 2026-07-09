"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  FaBook, FaSearch, FaFilter, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaDownload, FaVideo, FaFileUpload, FaTimes, FaUser, FaStickyNote, FaGraduationCap
} from "react-icons/fa";
import { fetchStudentHomework, fetchStudentHomeworkDetail, submitStudentHomework } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";

export default function StudentHomeworkPage() {
  const dispatch = useDispatch();
  const { homework, homeworkDetail, loadingHomeworkDetail, submittingHomework, loading, error } = useSelector((state) => state.students);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Submission Form State
  const [answerText, setAnswerText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    dispatch(fetchStudentHomework(activeTab));
  }, [dispatch, activeTab]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleViewDetails = (id) => {
    setIsDetailOpen(true);
    dispatch(fetchStudentHomeworkDetail(id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds the 10 MB limit.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim() && !selectedFile) {
      toast.error("Please provide either answer text or an uploaded file.");
      return;
    }

    try {
      const formData = new FormData();
      if (answerText.trim()) {
        formData.append("content", answerText.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await dispatch(submitStudentHomework({
        id: homeworkDetail.id || homeworkDetail.homework?.id,
        formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      })).unwrap();

      toast.success("Homework submitted successfully!");
      setIsSubmitOpen(false);
      setAnswerText("");
      setSelectedFile(null);
      setUploadProgress(0);

      // Refresh data
      dispatch(fetchStudentHomework(activeTab));
      if (homeworkDetail?.id || homeworkDetail?.homework?.id) {
        dispatch(fetchStudentHomeworkDetail(homeworkDetail.id || homeworkDetail.homework?.id));
      }
    } catch (err) {
      toast.error(err?.message || "Failed to submit homework.");
    }
  };

  if (loading && !homework) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load homework: {error}
      </div>
    );
  }

  const homeworkList = Array.isArray(homework)
    ? homework
    : (homework?.homework || homework?.data || []);

  const summary = homework?.counts || homework?.summary || {
    all: homeworkList.length,
    today: homeworkList.filter(h => h.is_today || h.is_due_today).length,
    pending: homeworkList.filter(h => h.status?.toLowerCase() === "pending").length,
    completed: homeworkList.filter(h => ["completed", "submitted", "graded"].includes(h.status?.toLowerCase())).length
  };

  // Truncate list logic sorted by newest first
  const sortedHomework = [...homeworkList].sort((a, b) => new Date(b.assigned_date || 0) - new Date(a.assigned_date || 0));

  const filteredHomework = sortedHomework.filter((h) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = h.title?.toLowerCase().includes(q);
      const subjectMatch = h.subject?.toLowerCase().includes(q);
      const teacherMatch = h.teacher_name?.toLowerCase().includes(q) || h.teacher?.toLowerCase().includes(q);
      if (!titleMatch && !subjectMatch && !teacherMatch) return false;
    }
    return true;
  });

  const getStatusBadge = (h) => {
    if (h.is_overdue) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 border border-rose-200 text-rose-700 uppercase tracking-wider flex items-center gap-1">
          <FaExclamationTriangle className="w-2.5 h-2.5" /> Overdue
        </span>
      );
    }
    const status = h.status?.toLowerCase();
    switch (status) {
      case "graded":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
            Graded
          </span>
        );
      case "completed":
      case "submitted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider">
            Submitted
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider">
            Pending
          </span>
        );
    }
  };

  const activeDetail = homeworkDetail?.homework || homeworkDetail?.data || homeworkDetail || {};

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <PageHeader
        title="Homework Assignments"
        subtitle="Access class coursework, download reference files, and submit assignments online."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">All Homework</span>
          <h3 className="text-xl font-extrabold text-zinc-800 mt-1">{summary.all}</h3>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Due Today</span>
          <h3 className="text-xl font-extrabold text-blue-700 mt-1">{summary.today}</h3>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-center">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Pending</span>
          <h3 className="text-xl font-extrabold text-amber-700 mt-1">{summary.pending}</h3>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{summary.completed}</h3>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 md:pb-0 scrollbar-none">
          {["all", "today", "pending", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border border-zinc-200/50"
                }`}
            >
              {tab === "today" ? "Due Today" : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search homework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>
      </div>

      {/* Homework List */}
      {filteredHomework.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Homework Available</span>
          <span className="text-zinc-400/80 text-[10px]">There are no homework assignments matching your filter tabs or search input.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomework.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group text-left"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {h.subject || "Coursework"}
                    </span>
                    <h4 className="font-extrabold text-zinc-800 text-sm group-hover:text-violet-600 transition-colors mt-2 line-clamp-1">
                      {h.title}
                    </h4>
                  </div>
                  {getStatusBadge(h)}
                </div>

                <div className="space-y-1.5 pt-2 text-[10px] text-zinc-600">
                  <div className="flex items-center gap-2">
                    <FaUser className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Teacher: <strong className="text-zinc-700">{h.teacher || h.teacher_name || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Due: <strong className="text-zinc-700">{h.due_date || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Max Marks: <strong className="text-zinc-700">{h.max_marks || "100"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-5 pt-3 border-t border-zinc-100">
                <span className="text-[10px] font-semibold text-zinc-400">
                  Assigned: {h.assigned_date || "N/A"}
                </span>
                <button
                  onClick={() => handleViewDetails(h.id)}
                  className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Homework Details Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col justify-between animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaBook className="text-violet-500" />
                Homework Assignment Details
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
              {loadingHomeworkDetail || !homeworkDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Header Title / Subject */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {activeDetail.subject}
                      </span>
                      <h2 className="text-base font-extrabold text-zinc-800 leading-tight mt-2">
                        {activeDetail.title}
                      </h2>
                    </div>
                    {getStatusBadge(activeDetail)}
                  </div>

                  {/* Description Box */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Description</span>
                    <p className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {activeDetail.description || "No description provided."}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Teacher</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.teacher}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Max Marks</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.max_marks} Marks</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Assigned Date</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.assigned_date}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Due Date</span>
                      <span className="font-bold text-zinc-700 text-xs block">{activeDetail.due_date}</span>
                    </div>
                  </div>

                  {/* Submission Status Section */}
                  {activeDetail.is_submitted ? (
                    <div className="border-t border-zinc-100 pt-5 space-y-4">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                        <FaCheckCircle className="text-emerald-500 w-4 h-4" /> Submission Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Submitted Date</span>
                          <span className="font-bold text-zinc-700 text-xs"> {activeDetail.submission?.submitted_at_label  || "N/A"}</span>
                        </div>
                        {activeDetail.marks !== null && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Marks Awarded</span>
                            <span className="font-extrabold text-emerald-600 text-sm">{activeDetail.marks} / {activeDetail.max_marks}</span>
                          </div>
                        )}
                      </div>

                      {activeDetail.submission?.content && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Submitted Content</span>
                          <p className="p-3 border border-zinc-100 rounded-xl text-zinc-700 bg-white leading-relaxed font-semibold">
                            {activeDetail.submission.content}
                          </p>
                        </div>
                      )}

                      {activeDetail.submission?.file_url && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Submitted File Attachment</span>
                          <a
                            href={activeDetail.submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold rounded-xl transition-all"
                          >
                            <FaDownload className="w-3.5 h-3.5" /> Download Submitted File
                          </a>
                        </div>
                      )}

                      {activeDetail.submission?.feedback && (
                        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                            <FaStickyNote className="w-3.5 h-3.5" /> Teacher Feedback
                          </span>
                          <p className="text-zinc-700 font-bold text-xs">{activeDetail.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-t border-zinc-100 pt-5 text-center">
                      <Button
                        onClick={() => setIsSubmitOpen(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 mx-auto shadow-sm"
                      >
                        <FaFileUpload className="w-4 h-4" /> Submit Homework
                      </Button>
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

      {/* Homework Submission Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileUpload className="text-violet-500" />
                Submit Assignment
              </h3>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Answer Content</label>
                  <textarea
                    rows="6"
                    maxLength="5000"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Enter your answer notes or online text response..."
                    className="w-full p-3 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 bg-zinc-50 focus:bg-white transition-all font-semibold text-black"
                  />
                  <div className="flex justify-end text-[9px] text-zinc-400 font-semibold">
                    {answerText.length} / 5000 characters
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Upload Assignment File</label>
                  <div className="relative border-2 border-dashed border-zinc-200 hover:border-violet-400 rounded-2xl p-6 text-center cursor-pointer bg-zinc-50 hover:bg-white transition-all">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FaFileUpload className="mx-auto w-8 h-8 text-zinc-400 mb-2" />
                    <span className="font-bold text-zinc-600 block">
                      {selectedFile ? selectedFile.name : "Drag & drop or browse files"}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-semibold block mt-1">
                      PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10 MB)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {submittingHomework && uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-600 h-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submittingHomework}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submittingHomework ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Assignment</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
