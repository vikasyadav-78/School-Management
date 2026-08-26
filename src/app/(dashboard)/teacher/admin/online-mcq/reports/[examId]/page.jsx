"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaUsers, FaCheckCircle, FaTimesCircle, FaPercentage, FaBookmark, FaFileAlt, FaTrophy, FaListOl, FaQuestionCircle } from "react-icons/fa";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import StatCard from "@/components/cards/StatCard";
import DataTable from "@/components/tables/DataTable";
import { getTeacherOnlineMcqReportDetail } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherOnlineMcqReportDetailPage({ params }) {
  const { examId } = use(params);
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("leaderboard"); // leaderboard | attendance | question_analysis

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeacherOnlineMcqReportDetail(examId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load report detail");
      toast.error(err.message || "Failed to load report detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadData();
    }
  }, [examId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load report detail: {error}
      </div>
    );
  }

  const { exam = {}, report = {}, leaderboard = [], attendance = [], question_analysis = [] } = data || {};

  const totalStudents = attendance.length;
  const attempted = attendance.filter(a => a.attended).length;
  const notAttempted = attendance.filter(a => !a.attended).length;

  const passed = report.pass_count || 0;
  const failed = report.fail_count || 0;

  const leaderboardColumns = [
    { header: "Rank", accessor: "rank", render: (row, idx) => <span className="font-extrabold text-amber-600">🏆 #{idx + 1}</span> },
    {
      header: "Student Name",
      accessor: "student_name",
      render: (row) => (
        <button
          onClick={() => router.push(`/teacher/admin/online-mcq/reports/${examId}/attempts/${row.attempt?.id || row.id}`)}
          className="text-violet-600 hover:underline font-bold text-left"
        >
          {row.student_name}
        </button>
      )
    },
    { header: "Score Obtained", accessor: "score", render: (row) => `${row.score}/${exam.total_marks}` },
    { header: "Percentage", accessor: "percentage", render: (row) => `${row.percentage}%` },
    { header: "Grade", accessor: "grade", render: (row) => <span className="font-bold text-violet-600">{row.grade}</span> },
    { header: "Correct Answers", accessor: "correct_count", render: (row) => <span className="text-emerald-600">{row.correct_count} correct</span> },
    { header: "Wrong Answers", accessor: "wrong_count", render: (row) => <span className="text-rose-600">{row.wrong_count} wrong</span> },
    { header: "Submitted Time", accessor: "submitted_at_label" }
  ];

  const attendanceColumns = [
    { header: "Roll No", accessor: "roll_no", render: (row) => row.student?.roll_no },
    { header: "Student Name", accessor: "student_name", render: (row) => row.student?.full_name },
    { header: "Student ID", accessor: "student_id", render: (row) => row.student?.student_id },
    { header: "Class", accessor: "class", render: (row) => `${row.student?.class} (${row.student?.section})` },
    {
      header: "Attended",
      accessor: "attended",
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.attended ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
        }`}>
          {row.attended ? "Yes" : "No"}
        </span>
      )
    },
    {
      header: "Submitted",
      accessor: "submitted",
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.submitted ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
        }`}>
          {row.submitted ? "Yes" : "No"}
        </span>
      )
    },
    {
      header: "Action",
      accessor: "action",
      render: (row) => row.attempt?.id ? (
        <Link href={`/teacher/admin/online-mcq/reports/${examId}/attempts/${row.attempt.id}`}>
          <Button variant="outline" size="sm" className="py-1 text-[10px] font-bold">
            View Attempt
          </Button>
        </Link>
      ) : (
        <span className="text-zinc-400 italic text-[10px]">No attempt</span>
      )
    }
  ];

  const questionColumns = [
    { header: "Q.No", accessor: "q_no", render: (row, idx) => idx + 1 },
    { header: "Question Text", accessor: "question", render: (row) => <span className="font-semibold text-zinc-800">{row.question}</span> },
    { header: "Marks", accessor: "marks" },
    { header: "Total Attempts", accessor: "attempts" },
    { header: "Accuracy", accessor: "accuracy", render: (row) => `${row.accuracy}%` }
  ];

  return (
    <div className="space-y-6 text-xs text-zinc-700 font-semibold text-left animate-fade-in">
      <PageHeader
        title={`${exam.title || "Exam"} — Detailed Report`}
        subtitle={`Class: ${exam.class || "N/A"} (${exam.section || "N/A"}) | Subject: ${exam.subject || "N/A"} | Status: ${exam.status || "N/A"}`}
        action={
          <Link href="/teacher/admin/online-mcq/reports">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={FaUsers}
            color="violet"
          />
          <StatCard
            title="Attempted"
            value={attempted}
            icon={FaCheckCircle}
            color="emerald"
            progress={totalStudents > 0 ? Math.round((attempted / totalStudents) * 100) : 0}
          />
          <StatCard
            title="Not Attempted"
            value={notAttempted}
            icon={FaTimesCircle}
            color="amber"
            progress={totalStudents > 0 ? Math.round((notAttempted / totalStudents) * 100) : 0}
          />
          <StatCard
            title="Passed / Failed"
            value={`${passed} / ${failed}`}
            icon={FaBookmark}
            color="sky"
          />
          <StatCard
            title="Average Score"
            value={`${report.avg_score || 0} (${report.avg_percentage || 0}%)`}
            icon={FaPercentage}
            color="violet"
          />
          <StatCard
            title="Highest Score"
            value={`${report.highest || 0}%`}
            icon={FaTrophy}
            color="emerald"
          />
          <StatCard
            title="Lowest Score"
            value={`${report.lowest || 0}%`}
            icon={FaTimesCircle}
            color="violet"
          />
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 gap-2 mb-6">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
              activeTab === "leaderboard"
                ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
            }`}
          >
            <FaTrophy className="inline mr-1" /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
              activeTab === "attendance"
                ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
            }`}
          >
            <FaListOl className="inline mr-1" /> Attendance Summary
          </button>
          <button
            onClick={() => setActiveTab("question_analysis")}
            className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
              activeTab === "question_analysis"
                ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
                : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
            }`}
          >
            <FaQuestionCircle className="inline mr-1" /> Question Analysis
          </button>
        </div>

        {/* Tab Contents */}
        <div className="animate-fade-in">
          {activeTab === "leaderboard" && (
            <DataTable
              columns={leaderboardColumns}
              data={leaderboard}
              emptyMessage="No student attempts submitted yet."
            />
          )}

          {activeTab === "attendance" && (
            <DataTable
              columns={attendanceColumns}
              data={attendance}
              emptyMessage="No student details mapped."
            />
          )}

          {activeTab === "question_analysis" && (
            <DataTable
              columns={questionColumns}
              data={question_analysis}
              emptyMessage="No questions recorded."
            />
          )}
        </div>
      </div>
    </div>
  );
}
