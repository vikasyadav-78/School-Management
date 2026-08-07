"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaDownload, FaUser, FaCheck, FaTimes, FaTimesCircle, FaBookmark, FaPercentage, FaQrcode } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import StatCard from "@/components/cards/StatCard";
import { getAdminOnlineMcqAttemptDetail, downloadAdminOnlineMcqAttemptPdf } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function AdminOnlineMcqAttemptDetailPage({ params }) {
  const { examId, attemptId } = use(params);
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOnlineMcqAttemptDetail(examId, attemptId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load attempt details");
      toast.error(err.message || "Failed to load attempt details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId && attemptId) {
      loadData();
    }
  }, [examId, attemptId]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await downloadAdminOnlineMcqAttemptPdf(examId, attemptId);
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `Attempt-${attempt?.student?.full_name || attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download PDF: " + (err.message || err));
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
          Failed to load attempt details: {error}
        </div>
      </DashboardLayout>
    );
  }

  const { exam = {}, attempt = {}, answer_sheet = [] } = data || {};
  const wrongCount = attempt.wrong_count || 0;
  const correctCount = attempt.correct_count || 0;
  const skippedCount = answer_sheet.filter(ans => ans.is_skipped).length;

  return (
    <DashboardLayout>
      <PageHeader
        title={`Exam Attempt — ${attempt?.student?.full_name}`}
        subtitle={`Exam: ${exam.title} | Submission summary & answer sheet.`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <FaArrowLeft className="mr-1.5" /> Back
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
              <FaDownload className="mr-1.5" /> {downloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-zinc-700 font-semibold">
        {/* Left column: Student & Score info */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border-2 border-violet-100 shadow-sm">
              <FaUser className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-zinc-800 text-sm mt-4">{attempt?.student?.full_name}</h3>
            <p className="text-zinc-400 font-semibold text-[10px] mt-0.5">{attempt?.student?.student_id}</p>
            <div className="mt-4 pt-4 border-t border-zinc-100 w-full grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Class</span>
                <span className="text-zinc-700">{attempt?.student?.class} ({attempt?.student?.section})</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Roll No</span>
                <span className="text-zinc-700">#{attempt?.student?.roll_no}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              Submission Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Final Score</span>
                <span className="text-zinc-800">{attempt.score || 0}/{exam.total_marks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Percentage</span>
                <span className="text-zinc-800">{attempt.percentage || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Grade Obtained</span>
                <span className="text-violet-600 font-bold">{attempt.grade || "F"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tab Switches</span>
                <span className={`font-bold ${attempt.tab_switches > 3 ? "text-rose-600" : "text-zinc-800"}`}>
                  {attempt.tab_switches || 0} times
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time Submitted</span>
                <span className="text-zinc-500">{attempt.submitted_at_label}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Correct</span>
              <span className="text-sm font-bold text-emerald-600">{correctCount}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Wrong</span>
              <span className="text-sm font-bold text-rose-600">{wrongCount}</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Skipped</span>
              <span className="text-sm font-bold text-zinc-500">{skippedCount}</span>
            </div>
          </div>
        </div>

        {/* Right column: Answer sheet */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              Answer Sheet Detail
            </h4>
            <div className="space-y-6">
              {answer_sheet.map((ans, idx) => (
                <div key={ans.question_id} className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-zinc-800 text-xs">Question {idx + 1}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      ans.is_correct
                        ? "bg-emerald-50 text-emerald-700"
                        : ans.is_skipped
                        ? "bg-zinc-100 text-zinc-500"
                        : "bg-rose-50 text-rose-700"
                    }`}>
                      {ans.is_correct ? "Correct" : ans.is_skipped ? "Skipped" : "Incorrect"}
                    </span>
                  </div>

                  <p className="text-zinc-800 font-semibold">{ans.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    {ans.options && Object.keys(ans.options).map((key) => (
                      <div
                        key={key}
                        className={`p-2 border rounded-lg ${
                          key === ans.correct_answer
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                            : key === ans.given
                            ? "bg-rose-50 border-rose-200 text-rose-800 font-bold"
                            : "bg-white border-zinc-100 text-zinc-600"
                        }`}
                      >
                        {key}. {ans.options[key]}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-100/60 flex justify-between text-[10px] text-zinc-500">
                    <span>Marks: {ans.marks} | Earned: {ans.earned}</span>
                    <span>Correct Option: <strong className="text-emerald-600">{ans.correct_answer}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
