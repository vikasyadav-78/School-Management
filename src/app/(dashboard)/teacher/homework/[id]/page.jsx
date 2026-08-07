"use client";

import { use, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaBook, FaCalendarAlt, FaChevronLeft, FaFileAlt, FaCheckCircle, 
  FaHourglassHalf, FaExternalLinkAlt, FaAward, FaCommentAlt, FaTimes, FaGraduationCap
} from "react-icons/fa";
import { 
  getHomeworkDetail, 
  gradeHomeworkSubmission 
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";

export default function TeacherHomeworkDetailPage({ params }) {
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

    const maxMarksVal = parseFloat(detail?.maximum_marks || 100);
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
      fetchDetail(); // Refresh list to reflect graded status
    } catch (err) {
      setGradeError(err.response?.data?.message || err.message || "Failed to submit grading details.");
      toast.error(err.response?.data?.message || err.message || "Failed to submit grading.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Homework details not found.
      </div>
    );
  }

  const submissions = detail.submissions || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex items-center gap-3">
        <Link 
          href="/teacher/homework" 
          className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
        >
          <FaChevronLeft className="w-3.5 h-3.5" />
        </Link>
        <PageHeader
          title="Homework Evaluation"
          subtitle="Inspect task descriptions, review files, and grade student submissions."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Panel: Assignment Details */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="pb-4 border-b border-zinc-100 space-y-2">
            <span className="px-2.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg uppercase tracking-wide inline-block">
              {detail.subject?.name || detail.subject || "Subject"}
            </span>
            <h3 className="text-base font-extrabold text-zinc-800">{detail.title}</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              {detail.class?.name || detail.class} - {detail.section?.name || detail.section || "A"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Description</span>
              <p className="text-zinc-600 font-medium leading-relaxed whitespace-pre-line mt-1">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Due Date</span>
                <span className="font-extrabold text-zinc-700">{detail.due_date_label || detail.due_date || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Max Marks</span>
                <span className="font-extrabold text-zinc-700">{detail.maximum_marks || 100} Pts</span>
              </div>
            </div>

            {(detail.attachment || detail.attachment_url) && (
              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Attachment Reference</span>
                <a 
                  href={detail.attachment_url || detail.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-zinc-600 hover:text-violet-600 font-bold transition-all"
                >
                  <FaFileAlt className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download Attachment</span>
                </a>
              </div>
            )}

            {detail.video_url && (
              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Video Tutorial link</span>
                <a 
                  href={detail.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-500 font-bold transition-colors"
                >
                  <FaExternalLinkAlt className="w-3 h-3" />
                  <span>Open Video Tutorial</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Student Submissions Grid */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="text-xs font-bold text-zinc-700 uppercase">Student Submissions Log</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Student</th>
                  <th className="px-6 py-4 whitespace-nowrap">Admission No.</th>
                  <th className="px-6 py-4 whitespace-nowrap">Submission File</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Marks</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Grade Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {submissions.map((sub, idx) => {
                  const hasGraded = sub.status?.toLowerCase() === "graded";
                  const s = sub.student || {};
                  
                  return (
                    <tr key={sub.id || idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                        {s.full_name || s.name || "Student"}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-500 whitespace-nowrap">
                        {s.admission_no || s.admissionNo || s.student_id || s.studentId || s.roll_no || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.submission_file || sub.attachment_url || sub.attachment ? (
                          <a 
                            href={sub.attachment_url || sub.submission_file || sub.attachment}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-500 font-bold"
                          >
                            <FaFileDownload className="w-3.5 h-3.5" /> View File
                          </a>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                          hasGraded 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {hasGraded ? <FaCheckCircle /> : <FaHourglassHalf />}
                          {sub.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-700 whitespace-nowrap">
                        {hasGraded ? `${sub.marks} / ${detail.maximum_marks || 100}` : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenGrading(sub)}
                          className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 hover:bg-violet-600 hover:border-violet-600 hover:text-white rounded-lg font-bold transition-all text-zinc-700 cursor-pointer"
                        >
                          {hasGraded ? "Edit Grade" : "Evaluate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-zinc-400 font-bold uppercase tracking-wider">
                      No Submissions Received Yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grading Dialog Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaGraduationCap className="text-violet-500 w-5 h-5" />
                Grade Student Submission
              </h3>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              {gradeError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                  {gradeError}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Student Name</span>
                <span className="font-extrabold text-zinc-800 text-sm">{selectedSubmission.student?.full_name || selectedSubmission.student?.name || "Student"}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Marks Secured * (Max: {detail.maximum_marks || 100})</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 font-bold">
                    <FaAward className="w-3.5 h-3.5" />
                  </span>
                  <input 
                    type="number"
                    step="0.5"
                    required
                    placeholder="Enter marks scored..."
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Evaluation Feedback (Optional)</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-zinc-400 font-bold">
                    <FaCommentAlt className="w-3.5 h-3.5" />
                  </span>
                  <textarea 
                    rows={3}
                    placeholder="Provide constructive feedback for the student..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold resize-none text-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submittingGrade}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2 px-6 font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/10 cursor-pointer"
                >
                  {submittingGrade ? "Saving Grade..." : "Submit Grade"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
