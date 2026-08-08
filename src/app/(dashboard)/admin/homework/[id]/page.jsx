"use client";

import { use, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaBook, FaCalendarAlt, FaChevronLeft, FaFileAlt, FaCheckCircle, 
  FaHourglassHalf, FaExternalLinkAlt, FaAward, FaCommentAlt, FaTimes, FaGraduationCap
} from "react-icons/fa";
import { 
  getHomeworkDetail, 
  gradeHomeworkSubmission 
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminHomeworkDetailPage({ params }) {
  const resolvedParams = use(params);
  const homeworkId = resolvedParams.id;
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Grading Modal/Panel State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await getHomeworkDetail(homeworkId);
      setDetail(data.homework || data.data || data || null);
    } catch (err) {
      toast.error("Failed to load homework details: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (homeworkId) {
      fetchDetail();
    }
  }, [homeworkId]);

  const handleOpenGrading = (sub) => {
    setSelectedSubmission(sub);
    setMarks(sub.marks || "");
    setFeedback(sub.feedback || "");
    setGradeError("");
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setGradeError("");

    if (!marks || parseFloat(marks) < 0) {
      setGradeError("Please enter a valid mark.");
      return;
    }

    const maxMarksVal = parseFloat(detail?.max_marks || 100);
    if (parseFloat(marks) > maxMarksVal) {
      setGradeError(`Marks cannot exceed the maximum value of ${maxMarksVal}.`);
      return;
    }

    try {
      setSubmittingGrade(true);
      const payload = {
        marks: parseFloat(marks),
        feedback: feedback.trim()
      };
      
      await gradeHomeworkSubmission(homeworkId, selectedSubmission.id, payload);
      toast.success("Submission graded successfully!");
      setSelectedSubmission(null);
      fetchDetail(); // Refresh details to show update
    } catch (err) {
      setGradeError(err.response?.data?.message || err.message || "Failed to submit grading details.");
      toast.error(err.response?.data?.message || err.message || "Failed to submit grading.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!detail) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
          Homework details not found.
        </div>
      </DashboardLayout>
    );
  }

  const submissions = detail.submissions || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/homework" 
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="Homework Evaluation"
            subtitle="Inspect task descriptions, review files, and grade student submissions."
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-650">
                  <FaBook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-850 text-sm capitalize">{detail.title}</h3>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{detail.subject}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-[10px]">
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Class & Section:</span>
                  <span className="font-black text-zinc-800">{detail.class} • Section {detail.section}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Assigned Teacher:</span>
                  <span className="font-black text-zinc-800">{detail.teacher}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Maximum Marks:</span>
                  <span className="font-black text-zinc-800">{detail.max_marks || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Due Date:</span>
                  <span className="font-black text-zinc-800">{detail.due_date_label}</span>
                </div>
              </div>

              {detail.description && (
                <div className="bg-zinc-55 border border-zinc-150 p-4 rounded-xl">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Description</span>
                  <p className="text-zinc-650 text-[11px] font-medium leading-relaxed break-words">{detail.description}</p>
                </div>
              )}

              {/* Attachments / Video Links */}
              {(detail.attachment_url || detail.video_link) && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Reference Materials</span>
                  {detail.attachment_url && (
                    <a 
                      href={detail.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-violet-50 hover:bg-violet-100 text-violet-750 font-bold rounded-xl transition-all"
                    >
                      <FaFileAlt className="w-3.5 h-3.5" />
                      <span>Download Attachment</span>
                      <FaExternalLinkAlt className="w-2.5 h-2.5 ml-auto" />
                    </a>
                  )}
                  {detail.video_link && (
                    <a 
                      href={detail.video_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all"
                    >
                      <FaExternalLinkAlt className="w-3.5 h-3.5" />
                      <span>Watch Tutorial Video</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Submission stats block */}
            {detail.stats && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
                <h4 className="font-black text-zinc-800 text-xs">Submission Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-55 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Total Enrolled</span>
                    <span className="font-black text-lg text-zinc-800 block mt-1">{detail.stats.student_count || 0}</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">Submitted</span>
                    <span className="font-black text-lg text-emerald-700 block mt-1">{detail.stats.submitted || 0}</span>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                    <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">Pending</span>
                    <span className="font-black text-lg text-amber-700 block mt-1">{detail.stats.pending || 0}</span>
                  </div>
                  <div className="bg-violet-50/50 border border-violet-100 p-3 rounded-xl">
                    <span className="text-[10px] text-violet-600 font-bold block uppercase tracking-wider">Graded</span>
                    <span className="font-black text-lg text-violet-750 block mt-1">{detail.stats.graded || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submissions List Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h4 className="font-black text-zinc-800 text-xs">Student Submissions ({submissions.length})</h4>
              </div>

              {submissions.length === 0 ? (
                <div className="py-12">
                  <EmptyState 
                    title="No Submissions Yet" 
                    desc="Students have not uploaded any assignment submissions for this homework task yet." 
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Student Info</th>
                        <th className="px-6 py-4">Submission Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Grade / Score</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-zinc-55/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-zinc-800 block">{sub.student?.full_name || "check student"}</span>
                              <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">
                                Roll No: {sub.student?.roll_no || "N/A"} • ID: {sub.student?.student_id || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-500">
                            {sub.submitted_at_label || sub.submitted_at}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${sub.status === "graded" ? "bg-violet-50 text-violet-650" : "bg-emerald-50 text-emerald-700"}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {sub.status === "graded" ? (
                              <span className="font-extrabold text-zinc-805 text-xs">
                                {sub.marks} / {detail.max_marks || "N/A"}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-medium italic">Ungraded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sub.file_url && (
                                <a 
                                  href={sub.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="p-1.5 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-650 hover:bg-zinc-50 transition-all"
                                  title="Download Submitted File"
                                >
                                  <FaExternalLinkAlt className="w-3 h-3" />
                                </a>
                              )}
                              <button
                                onClick={() => handleOpenGrading(sub)}
                                className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <FaGraduationCap className="w-3 h-3" /> Grade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grading Submission Evaluation Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaAward className="text-violet-500" /> Grade Homework Submission
                </h3>
                <button onClick={() => setSelectedSubmission(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGradeSubmit} className="p-6 space-y-4 text-xs font-semibold">
                {gradeError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                    {gradeError}
                  </div>
                )}

                <div className="bg-zinc-55 border border-zinc-100 rounded-xl p-3">
                  <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Student Name</span>
                  <span className="text-zinc-805 font-extrabold text-[11px] block mt-0.5 capitalize">
                    {selectedSubmission.student?.full_name || "check student"}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Marks Awarded (Max: {detail.max_marks || "N/A"}) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Enter marks value"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-805 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Evaluation Feedback</label>
                  <textarea
                    rows="3"
                    placeholder="Enter feedback comments for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-805 font-semibold resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrade}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submittingGrade ? "Saving..." : "Submit Grade"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
