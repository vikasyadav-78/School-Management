"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaGraduationCap, FaAward, FaPercent, FaClipboardList, FaFileSignature, FaUserCircle } from "react-icons/fa";
import { fetchStudentResults, fetchStudentExamSchedule } from "@/features/students/redux/studentThunk";

export default function StudentResultsPage() {
  const dispatch = useDispatch();
  const { examResults, examSchedule, loading, error } = useSelector((state) => state.students);
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    dispatch(fetchStudentExamSchedule());
  }, [dispatch]);

  // Load results once schedule is loaded and we have an initial exam ID
  useEffect(() => {
    const exams = Array.isArray(examSchedule) 
      ? examSchedule 
      : (examSchedule?.exams || examSchedule?.data || []);

    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
      dispatch(fetchStudentResults(exams[0].id));
    }
  }, [dispatch, examSchedule, selectedExamId]);

  const handleExamChange = (e) => {
    const val = e.target.value;
    setSelectedExamId(val);
    if (val) {
      dispatch(fetchStudentResults(val));
    }
  };

  const examsList = Array.isArray(examSchedule) 
    ? examSchedule 
    : (examSchedule?.exams || examSchedule?.data || []);

  const resultsData = examResults?.results || examResults?.data || examResults || {};
  const subjectMarks = resultsData.marks || resultsData.subject_marks || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <PageHeader 
        title="Term Examination Results"
        subtitle="Check final grades, percentages, marks breakdowns, and report analysis."
      />

      {/* Select Exam Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
          Select Exam
        </label>
        <select
          value={selectedExamId}
          onChange={handleExamChange}
          className="w-full sm:w-72 px-3 py-2 border border-zinc-250 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
        >
          <option value="">-- Select Exam --</option>
          {examsList.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name || exam.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <PageLoader />
        </div>
      ) : error ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-rose-500 font-extrabold uppercase tracking-wider text-xs block mb-2">
            Results Unavailable
          </span>
          <span className="text-zinc-500 text-[10px]">
            {error.includes("403") || error.toLowerCase().includes("publish")
              ? "Results are not published yet."
              : "Results are not available."}
          </span>
        </div>
      ) : !selectedExamId ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Exam Selected</span>
          <span className="text-zinc-400/80 text-[10px]">Please select an examination from the dropdown above to view results.</span>
        </div>
      ) : Object.keys(resultsData).length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Results Found</span>
          <span className="text-zinc-400/80 text-[10px]">No results are available for the selected exam.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Percentage</span>
              <div className="inline-flex items-center gap-1 text-base font-extrabold text-violet-650">
                <FaPercent className="w-3.5 h-3.5" />
                <span>{resultsData.percentage || "N/A"}%</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Final Grade</span>
              <div className="inline-flex items-center gap-1 text-base font-extrabold text-violet-650">
                <FaAward className="w-3.5 h-3.5" />
                <span>{resultsData.grade || "N/A"}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Class Rank</span>
              <div className="inline-flex items-center gap-1 text-base font-extrabold text-violet-650">
                <FaUserCircle className="w-3.5 h-3.5" />
                <span>#{resultsData.rank || "N/A"}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total Marks</span>
              <div className="text-base font-extrabold text-zinc-800 mt-0.5">
                {resultsData.total_marks_obtained || resultsData.marks_obtained || 0} / {resultsData.total_maximum_marks || resultsData.max_marks || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Attendance</span>
              <div className="text-base font-extrabold text-zinc-800 mt-0.5">
                {resultsData.attendance_percentage || "100"}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center col-span-2 md:col-span-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider mt-1 ${
                resultsData.status?.toLowerCase() === "pass" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {resultsData.status || resultsData.pass_fail_status || "Pass"}
              </span>
            </div>
          </div>

          {/* Remarks Section */}
          {resultsData.teacher_remarks && (
            <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-xl text-left space-y-1">
              <span className="text-[9px] font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1">
                <FaFileSignature className="w-3.5 h-3.5" /> Instructor Remarks
              </span>
              <p className="text-zinc-700 font-bold text-xs">{resultsData.teacher_remarks}</p>
            </div>
          )}

          {/* Marks Breakdown Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 text-left">
              <h3 className="text-xs font-bold text-zinc-700 uppercase flex items-center gap-2">
                <FaClipboardList className="text-violet-500" /> Subject-wise Marks Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Theory Marks</th>
                    <th className="px-6 py-4">Practical Marks</th>
                    <th className="px-6 py-4">Internal Marks</th>
                    <th className="px-6 py-4">Total Marks</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-xs">
                  {subjectMarks.map((sm, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                        {sm.subject || sm.subject_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.theory ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.practical ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.internal ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-zinc-850 whitespace-nowrap">
                        {sm.total_marks || sm.total || "—"}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-violet-650 whitespace-nowrap">
                        {sm.grade || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                          sm.status?.toLowerCase() === "pass" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-250" 
                            : "bg-rose-50 text-rose-600 border-rose-250"
                        }`}>
                          {sm.status || "Pass"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {subjectMarks.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        No marks breakdown records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
