"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { 
  FaArrowLeft, FaChartPie, FaTrophy, FaUsers, FaListUl, 
  FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt,
  FaFileAlt
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";
import { getTeacherOnlineMcqReportDetail } from "@/features/teachers/services/teacher.service";
import Loader from "@/components/ui/Loader";
import PageHeader from "@/components/common/PageHeader";

export default function TeacherOnlineMcqReportDetailPage({ params }) {
  const router = useRouter();
  const dialog = useAppDialog();
  const unwrappedParams = use(params);
  const examId = unwrappedParams.examId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTeacherOnlineMcqReportDetail(examId);
      if (response.success) {
        setData(response);
      } else {
        throw new Error(response.message || "Failed to load report detail");
      }
    } catch (err) {
      setError(err.message || "Error fetching report");
      dialog.showError("Error", err.message || "Error fetching report detail");
    } finally {
      setLoading(false);
    }
  }, [examId, dialog]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const navigateToAttempt = (attemptId) => {
    if (!attemptId) return;
    router.push(`/teacher/online-mcq/reports/${examId}/attempts/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader size="lg" />
        <p className="mt-4 text-sm font-medium text-zinc-500">Loading report details...</p>
      </div>
    );
  }

  if (error || !data?.exam) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-rose-900 mb-2">Error Loading Report</h3>
          <p className="text-sm text-rose-600">{error || "Data not found"}</p>
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

  const { exam, report, leaderboard, attendance, question_analysis } = data;

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <FaUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Attempts</p>
            <p className="text-2xl font-black text-zinc-900">{report?.total_attempts || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <FaChartPie className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-black text-zinc-900">{report?.avg_score || 0} <span className="text-sm text-zinc-400 font-medium">({report?.avg_percentage || 0}%)</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Passed</p>
            <p className="text-2xl font-black text-zinc-900">{report?.pass_count || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
            <FaTimesCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Failed</p>
            <p className="text-2xl font-black text-zinc-900">{report?.fail_count || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
            <FaFileAlt className="text-blue-500" />
            Exam Details
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
            <div>
              <p className="text-zinc-500 font-medium">Title</p>
              <p className="font-bold text-zinc-900">{exam.title}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Subject</p>
              <p className="font-bold text-zinc-900">{exam.subject}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Class</p>
              <p className="font-bold text-zinc-900 capitalize">{exam.class} {exam.section ? `(Sec ${exam.section})` : ""}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Status</p>
              <p className="font-bold text-zinc-900 capitalize">{exam.status}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Total Questions</p>
              <p className="font-bold text-zinc-900">{exam.total_questions}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Total Marks</p>
              <p className="font-bold text-zinc-900">{exam.total_marks}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Duration</p>
              <p className="font-bold text-zinc-900">{exam.duration_minutes} Mins</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Negative Marking</p>
              <p className="font-bold text-zinc-900">{exam.negative_marking ? `Yes (${exam.negative_marks})` : "No"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
            <FaClock className="text-amber-500" />
            Schedule
          </h3>
          <div className="space-y-4 text-sm">
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Starts At</span>
              <span className="font-bold text-zinc-900">{exam.starts_at_label}</span>
            </div>
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Ends At</span>
              <span className="font-bold text-zinc-900">{exam.ends_at_label}</span>
            </div>
            <div className="mt-4">
               <p className="text-zinc-500 font-medium text-xs uppercase tracking-wider mb-2">Instructions</p>
               <p className="text-zinc-700 bg-amber-50/50 p-3 rounded-xl text-xs border border-amber-100 leading-relaxed">
                 {exam.instructions || "No instructions provided."}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
      {(!leaderboard || leaderboard.length === 0) ? (
        <div className="p-12 text-center">
          <FaTrophy className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No attempts yet to generate leaderboard.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Score</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Grade</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Details</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Time</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black
                      ${index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-zinc-200 text-zinc-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-500'}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <p className="font-bold text-zinc-900 text-sm">{entry.student_name}</p>
                    <p className="text-[10px] font-medium text-zinc-500 capitalize">{entry.status}</p>
                  </td>
                  <td className="py-3 px-6">
                    <p className="font-black text-indigo-600 text-sm">{entry.score}</p>
                    <p className="text-[10px] font-bold text-zinc-400">{entry.percentage}%</p>
                  </td>
                  <td className="py-3 px-6">
                    <span className="font-bold text-zinc-800 text-sm bg-zinc-100 px-2 py-1 rounded-md">{entry.grade || "—"}</span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {entry.correct_count} C
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {entry.wrong_count} W
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-xs text-zinc-500">{entry.submitted_at_label}</span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button 
                      onClick={() => navigateToAttempt(entry.id)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 text-xs font-bold transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
      {(!attendance || attendance.length === 0) ? (
        <div className="p-12 text-center">
          <FaUsers className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No attendance data available.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Student</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Identifiers</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Info</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {attendance.map((record) => (
                <tr key={record.student.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-6">
                    <p className="font-bold text-zinc-900 text-sm">{record.student.full_name}</p>
                  </td>
                  <td className="py-3 px-6">
                    <p className="text-xs text-zinc-600">ID: <span className="font-mono">{record.student.student_id}</span></p>
                    <p className="text-xs text-zinc-500">Roll: {record.student.roll_no || "—"}</p>
                  </td>
                  <td className="py-3 px-6">
                    <p className="text-xs text-zinc-800 capitalize font-semibold">{record.student.class}</p>
                    <p className="text-xs text-zinc-500">Sec: {record.student.section || "—"}</p>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${record.attended ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {record.attended ? "Attended" : "Absent"}
                      </span>
                      {record.attended && (
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${record.submitted ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {record.submitted ? "Submitted" : "In Progress"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-right">
                    {record.attempt ? (
                      <button 
                        onClick={() => navigateToAttempt(record.attempt.id)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold text-xs transition-colors"
                      >
                        View Attempt
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400 font-medium italic">No Attempt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
      {(!question_analysis || question_analysis.length === 0) ? (
        <div className="p-12 text-center">
          <FaListUl className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No question analysis available.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Question</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Marks</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Answered</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Correct</th>
                <th className="py-3 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {question_analysis.map((qa, index) => (
                <tr key={qa.question_id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex gap-3">
                      <span className="font-bold text-zinc-400">Q{index + 1}.</span>
                      <div>
                         <p className="font-semibold text-zinc-900 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: qa.question }}></p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{qa.question_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-bold text-zinc-800">{qa.marks}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-bold text-zinc-800">{qa.answered} <span className="text-xs text-zinc-400 font-normal">/ {qa.attempts}</span></span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-bold text-emerald-600">{qa.correct}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${qa.accuracy >= 70 ? 'bg-emerald-500' : qa.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${qa.accuracy}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm text-zinc-800 w-10">{qa.accuracy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader 
        title={exam.title}
        subtitle={`Class ${exam.class} ${exam.section ? `• Section ${exam.section}` : ""} • ${exam.subject}`}
        action={
          <button 
            onClick={() => router.push('/teacher/online-mcq/reports')}
            className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            Back to Reports
          </button>
        }
      />

      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          <FaChartPie /> Overview
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "leaderboard" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          <FaTrophy /> Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "attendance" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          <FaUsers /> Attendance
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "analysis" ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
          }`}
        >
          <FaListUl /> Question Analysis
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "leaderboard" && renderLeaderboard()}
        {activeTab === "attendance" && renderAttendance()}
        {activeTab === "analysis" && renderAnalysis()}
      </div>
    </div>
  );
}
