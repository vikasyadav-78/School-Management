"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { 
  FaArrowLeft, FaFilePdf, FaCheckCircle, FaTimesCircle, 
  FaClock, FaUser, FaInfoCircle, FaCalendarAlt, FaExclamationCircle
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";
import { getTeacherOnlineMcqAttempt, getTeacherOnlineMcqAttemptPdf } from "@/features/teachers/services/teacher.service";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/common/PageHeader";

export default function TeacherOnlineMcqStudentAttemptPage({ params }) {
  const router = useRouter();
  const dialog = useAppDialog();
  const unwrappedParams = use(params);
  const { examId, attemptId } = unwrappedParams;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchAttempt = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTeacherOnlineMcqAttempt(examId, attemptId);
      if (response.success) {
        setData(response);
      } else {
        throw new Error(response.message || "Failed to load attempt details");
      }
    } catch (err) {
      setError(err.message || "Error fetching attempt");
      dialog.showError("Error", err.message || "Error fetching attempt");
    } finally {
      setLoading(false);
    }
  }, [examId, attemptId, dialog]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  const handleDownloadPdf = async () => {
    try {
      setPdfLoading(true);
      const response = await getTeacherOnlineMcqAttemptPdf(examId, attemptId);
      const blob = new Blob([response], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Attempt_${attemptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      dialog.showError("PDF Error", "Failed to generate or download PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader size="lg" />
        <p className="mt-4 text-sm font-medium text-zinc-500">Loading student attempt...</p>
      </div>
    );
  }

  if (error || !data?.attempt) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-rose-900 mb-2">Error Loading Attempt</h3>
          <p className="text-sm text-rose-600">{error || "Attempt data not found"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-6 px-5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { exam, attempt, answer_sheet } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader 
        title={`${attempt.student_name}'s Attempt`}
        subtitle={`${exam.title} • ${exam.subject}`}
        action={
          <button 
            onClick={() => router.push(`/teacher/online-mcq/reports/${examId}`)}
            className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            Back to Report
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {attempt.student_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{attempt.student_name}</h2>
            <p className="text-sm text-zinc-500">Admission No: {attempt.student?.admission_no || "N/A"}</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-colors"
        >
          {pdfLoading ? <Loader size="sm" /> : <FaFilePdf />}
          View / Print PDF
        </button>
      </div>

      {/* Attempt Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FaInfoCircle className="text-indigo-400" /> Score</p>
          <p className="text-2xl font-black text-indigo-600">{attempt.score} <span className="text-sm font-medium text-zinc-400">/ {exam.total_marks}</span></p>
          <p className="text-xs font-bold text-zinc-500 mt-1">{attempt.percentage}% • Grade {attempt.grade || "—"}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FaCheckCircle className="text-emerald-400" /> Accuracy</p>
          <div className="flex gap-4">
            <div>
              <p className="text-2xl font-black text-emerald-600">{attempt.correct_count}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600">{attempt.wrong_count}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Wrong</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FaClock className="text-amber-400" /> Timing</p>
          <p className="text-sm font-bold text-zinc-800 line-clamp-1" title={attempt.started_at_label}>Start: <span className="font-medium text-zinc-600">{attempt.started_at_label || "—"}</span></p>
          <p className="text-sm font-bold text-zinc-800 line-clamp-1 mt-1" title={attempt.submitted_at_label}>End: <span className="font-medium text-zinc-600">{attempt.submitted_at_label}</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FaUser className="text-blue-400" /> Student Info</p>
          <p className="text-sm font-bold text-zinc-800">{attempt.student?.full_name}</p>
          <p className="text-xs font-medium text-zinc-500 mt-1">ID: {attempt.student?.student_id} • Roll: {attempt.student?.roll_no || "—"}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800">Answer Sheet</h2>
          <span className="text-xs font-semibold text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
            {attempt.total_questions} Questions
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {(!answer_sheet || answer_sheet.length === 0) ? (
            <div className="p-8 text-center text-sm font-medium text-zinc-500">
              No answers recorded for this attempt.
            </div>
          ) : (
            answer_sheet.map((ans, index) => (
              <div key={ans.question_id} className="p-6 hover:bg-zinc-50/50 transition-colors">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 font-black text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="prose prose-sm max-w-none text-zinc-900 font-semibold" dangerouslySetInnerHTML={{ __html: ans.question }} />
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border
                          ${ans.is_skipped ? 'bg-zinc-100 text-zinc-600 border-zinc-200' :
                            ans.is_correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}
                        `}>
                          {ans.is_skipped ? "Skipped" : ans.is_correct ? "Correct" : "Incorrect"}
                        </span>
                        <div className="mt-2 text-xs font-bold text-zinc-500">
                          {ans.earned} / {ans.marks} Marks
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Student's Answer</p>
                        <p className={`text-sm font-semibold p-2 rounded-lg border ${
                            ans.is_skipped ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 
                            ans.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          {ans.is_skipped ? "Did not answer" : ans.given_label || ans.given}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">Correct Answer</p>
                        <p className="text-sm font-semibold p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {ans.correct_label || ans.correct_answer}
                        </p>
                      </div>
                    </div>

                    {/* Show options context if provided and useful */}
                    {ans.options && Object.keys(ans.options).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(ans.options).map(([key, value]) => {
                           const isGiven = ans.given === key;
                           const isCorrect = ans.correct_answer === key;
                           let optionClass = "border-zinc-200 bg-white text-zinc-600";
                           
                           if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500";
                           else if (isGiven && !isCorrect) optionClass = "border-rose-300 bg-rose-50 text-rose-700";

                           return (
                             <div key={key} className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${optionClass}`}>
                               <span className="font-bold">{key}.</span> {value}
                             </div>
                           )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
