"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaAward, FaClipboardList, FaFileSignature, FaUserCircle } from "react-icons/fa";
import { fetchStudentResults } from "@/features/students/redux/studentThunk";

export default function StudentResultsPage() {
  const dispatch = useDispatch();
  const { examResults, loading, error } = useSelector((state) => state.students);
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    dispatch(fetchStudentResults());
  }, [dispatch]);

  const resultsList = Array.isArray(examResults?.results)
    ? examResults.results
    : (Array.isArray(examResults) ? examResults : []);

  // Set selectedExamId once results are loaded
  useEffect(() => {
    if (resultsList.length > 0 && !selectedExamId) {
      setSelectedExamId(resultsList[0].exam_id);
    }
  }, [resultsList, selectedExamId]);

  const handleExamChange = (e) => {
    const val = e.target.value;
    setSelectedExamId(val);
  };

  const examsList = resultsList;

  const activeResult = selectedExamId
    ? (resultsList.find(r => r.exam_id === selectedExamId) || resultsList[0] || {})
    : (resultsList[0] || {});

  const summary = activeResult.summary || {};
  const subjectMarks = activeResult.subjects || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader
        title="Term Examination Results"
        description="Check final grades, percentages, marks breakdowns, and report analysis."
      />

      {/* Select Exam Dropdown */}
      <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
          Select Exam
        </label>
        <select
          value={selectedExamId}
          onChange={handleExamChange}
          className="w-full sm:w-72 px-3.5 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800 cursor-pointer"
        >
          <option value="">-- Select Exam --</option>
          {examsList.map((exam, idx) => (
            <option key={exam.id || exam.exam_id || idx} value={exam.id || exam.exam_id || ""}>
              {exam.type_label || exam.exam_name || exam.name || exam.title || "Exam"}
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
          <span className="text-rose-600 font-extrabold uppercase tracking-wider text-xs block mb-1">
            Results Unavailable
          </span>
          <span className="text-zinc-500 text-xs">
            {error.includes("403") || error.toLowerCase().includes("publish")
              ? "Results are not published yet."
              : "Results are not available."}
          </span>
        </div>
      ) : !selectedExamId ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-1">No Exam Selected</span>
          <span className="text-zinc-400 text-xs">Please select an examination from the dropdown above to view results.</span>
        </div>
      ) : Object.keys(activeResult).length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-1">No Results Found</span>
          <span className="text-zinc-400 text-xs">No results are available for the selected exam.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats - Centered Colored Format */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Percentage */}
            <div className="bg-violet-50 border border-violet-100 p-4.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block mb-1">Percentage</span>
              <div className="text-2xl font-black text-violet-800">
                {summary.percentage ?? "N/A"}%
              </div>
            </div>

            {/* Final Grade */}
            <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Final Grade</span>
              <div className="inline-flex items-center justify-center gap-1 text-2xl font-black text-emerald-800">
                <FaAward className="w-4 h-4 text-emerald-600" />
                <span>{summary.grade || "N/A"}</span>
              </div>
            </div>

            {/* Class Rank */}
            <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Class Rank</span>
              <div className="inline-flex items-center justify-center gap-1 text-2xl font-black text-amber-800">
                <FaUserCircle className="w-4 h-4 text-amber-600" />
                <span>#{summary.rank || "N/A"}</span>
              </div>
            </div>

            {/* Total Marks */}
            <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total Marks</span>
              <div className="text-xl font-black text-zinc-800 mt-1">
                {summary.total_obtained ?? summary.marks_obtained ?? 0} / {summary.total_max ?? summary.max_marks ?? 0}
              </div>
            </div>

            {/* Attendance */}
            <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Attendance</span>
              <div className="text-xl font-black text-zinc-800 mt-1">
                {summary.attendance_rate ?? "100"}%
              </div>
            </div>

            {/* Status */}
            <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Status</span>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border tracking-wider mt-1 ${summary.status?.toLowerCase() === "pass"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                {summary.status || "Pass"}
              </span>
            </div>
          </div>

          {/* Remarks Section */}
          {summary.remarks && (
            <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-2xl text-left space-y-1">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaFileSignature className="w-3.5 h-3.5" /> Instructor Remarks
              </span>
              <p className="text-zinc-800 font-bold text-xs">{summary.remarks}</p>
            </div>
          )}

          {/* Marks Breakdown Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 text-left">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <FaClipboardList className="text-violet-600" /> Subject-wise Marks Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 pl-6 pr-4">Subject</th>
                    <th className="py-3.5 px-4 text-center">Theory Marks</th>
                    <th className="py-3.5 px-4 text-center">Practical Marks</th>
                    <th className="py-3.5 px-4 text-center">Internal Marks</th>
                    <th className="py-3.5 px-4 text-center">Total Marks</th>
                    <th className="py-3.5 px-4 text-center">Grade</th>
                    <th className="py-3.5 pl-4 pr-6 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
                  {subjectMarks.map((sm, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 pl-6 pr-4 font-bold text-zinc-900 whitespace-nowrap">
                        {sm.subject_name || sm.subject || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.theory_marks ?? sm.theory ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.practical_marks ?? sm.practical ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-zinc-700 whitespace-nowrap">
                        {sm.internal_marks ?? sm.internal ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-zinc-900 whitespace-nowrap">
                        {sm.marks_obtained ?? sm.total_marks ?? sm.total ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-violet-700 whitespace-nowrap">
                        {sm.grade || "N/A"}
                      </td>
                      <td className="py-3.5 pl-4 pr-6 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${sm.is_absent
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                          {sm.is_absent ? "Absent" : (sm.status || "Pass")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {subjectMarks.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                        No marks breakdown records found.
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