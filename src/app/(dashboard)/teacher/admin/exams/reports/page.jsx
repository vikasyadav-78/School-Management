"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import {
  FaGraduationCap, FaBook, FaTrophy, FaUserTimes, FaAward
} from "react-icons/fa";
import {
  getTeacherReportsExamsList,
  getTeacherReportsExamOverview,
  getTeacherReportsExamClassWise,
  getTeacherReportsExamSubjectWise,
  getTeacherReportsExamToppers,
  getTeacherReportsExamFailList,
  getTeacherReportsExamMeritList,
  getTeacherReportsExamReportCard
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherAdminExamReportsPage() {
  const [loading, setLoading] = useState(true);
  const [examsList, setExamsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [activeTab, setActiveTab] = useState("classwise"); // classwise, subjectwise, toppers, fails, merits

  const [overview, setOverview] = useState(null);
  const [classWise, setClassWise] = useState([]);
  const [subjectWise, setSubjectWise] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [failList, setFailList] = useState([]);
  const [meritList, setMeritList] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportCard, setReportCard] = useState(null);

  const loadExams = async () => {
    try {
      const res = await getTeacherReportsExamsList();
      const list = res?.exams || [];
      setExamsList(list);
      if (list.length > 0) {
        setSelectedExamId(list[0].id);
        loadExamDetails(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error("Failed to load exams list: " + (err.message || err));
      setLoading(false);
    }
  };

  const loadExamDetails = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const [overRes, classRes, subRes, topRes, failRes, meritRes] = await Promise.all([
        getTeacherReportsExamOverview(examId),
        getTeacherReportsExamClassWise(examId),
        getTeacherReportsExamSubjectWise(examId),
        getTeacherReportsExamToppers(examId),
        getTeacherReportsExamFailList(examId),
        getTeacherReportsExamMeritList(examId),
      ]);

      setOverview(overRes?.overview || null);

      const rows = classRes?.report || [];
      setClassWise(rows);
      setSubjectWise(subRes?.report || []);
      setToppers(topRes?.toppers || []);
      setFailList(failRes?.students || []);
      setMeritList(meritRes?.students || []);

      if (rows.length > 0) {
        setSelectedStudentId(rows[0].student?.id);
        const cardRes = await getTeacherReportsExamReportCard(examId, rows[0].student?.id);
        setReportCard(cardRes);
      } else {
        setReportCard(null);
      }
    } catch (err) {
      toast.error("Failed to load exam statistics: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    try {
      const res = await getTeacherReportsExamReportCard(selectedExamId, studentId);
      setReportCard(res);
    } catch (err) {
      toast.error("Failed to load report card details.");
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Examination Insights & Reports"
        subtitle="Analyze standings, pass metrics, subject-wise trends, and download student report cards."
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-3.5 border border-zinc-200 rounded-xl shadow-sm">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Choose Exam Session</label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              loadExamDetails(e.target.value);
            }}
            className="w-full sm:w-auto bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-zinc-800 outline-none font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
          >
            {examsList.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.type_label})</option>
            ))}
          </select>
        </div>

        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto text-xs">
            <div className="bg-zinc-50 p-2.5 border border-zinc-200 rounded-lg text-center">
              <span className="text-zinc-500 uppercase text-[10px] font-bold block">Graded</span>
              <span className="text-zinc-900 text-sm font-black mt-0.5 block">{overview.students_with_marks ?? 0}</span>
            </div>
            <div className="bg-emerald-50/60 p-2.5 border border-emerald-100 rounded-lg text-center">
              <span className="text-emerald-700 uppercase text-[10px] font-bold block">Passed</span>
              <span className="text-emerald-700 text-sm font-black mt-0.5 block">{overview.passed ?? 0}</span>
            </div>
            <div className="bg-rose-50/60 p-2.5 border border-rose-100 rounded-lg text-center">
              <span className="text-rose-700 uppercase text-[10px] font-bold block">Failed</span>
              <span className="text-rose-700 text-sm font-black mt-0.5 block">{overview.failed ?? 0}</span>
            </div>
            <div className="bg-indigo-50/60 p-2.5 border border-indigo-100 rounded-lg text-center">
              <span className="text-indigo-700 uppercase text-[10px] font-bold block">Avg Score</span>
              <span className="text-indigo-700 text-sm font-black mt-0.5 block">{overview.average_percentage ?? 0}%</span>
            </div>
          </div>
        )}
      </div>

      {selectedExamId && (
        <div className="space-y-4">
          <div className="flex border-b border-zinc-200 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("classwise")}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "classwise" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
            >
              <FaGraduationCap /> Class Standings
            </button>
            <button
              onClick={() => setActiveTab("subjectwise")}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "subjectwise" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
            >
              <FaBook /> Subject Performance
            </button>
            <button
              onClick={() => setActiveTab("toppers")}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "toppers" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
            >
              <FaTrophy /> Toppers List
            </button>
            <button
              onClick={() => setActiveTab("fails")}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "fails" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
            >
              <FaUserTimes /> Fail List
            </button>
            <button
              onClick={() => setActiveTab("merits")}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "merits" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
            >
              <FaAward /> Merit List
            </button>
          </div>

          {loading ? <PageLoader /> : (
            <div className="space-y-4">
              {/* 1. CLASSWISE */}
              {activeTab === "classwise" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Student</th>
                            <th className="p-3">Class/Section</th>
                            <th className="p-3">Obtained Marks</th>
                            <th className="p-3">Grade</th>
                            <th className="p-3 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {classWise.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-zinc-400">No records found.</td>
                            </tr>
                          ) : (
                            classWise.map((row) => (
                              <tr
                                key={row.student?.id}
                                onClick={() => handleStudentSelect(row.student?.id)}
                                className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${selectedStudentId === row.student?.id ? "bg-indigo-50/80" : ""}`}
                              >
                                <td className="p-3 font-bold text-zinc-900">#{row.rank}</td>
                                <td className="p-3">
                                  <div className="font-semibold text-zinc-900">{row.student?.full_name}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono">{row.student?.student_id}</div>
                                </td>
                                <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                                <td className="p-3 font-semibold text-zinc-800">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                                <td className="p-3"><span className="px-2 py-0.5 bg-zinc-100 rounded font-bold text-zinc-700 text-[11px]">{row.grade}</span></td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reportCard ? (
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="text-center space-y-1 border-b border-zinc-100 pb-3">
                          <h4 className="font-bold text-sm text-zinc-900">{reportCard.school?.name || "Report Card"}</h4>
                          <div className="font-semibold text-zinc-700 text-xs">{reportCard.student?.full_name}</div>
                          <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Class: {reportCard.student?.class} | Roll: {reportCard.student?.roll_no || "—"}</div>
                        </div>
                        <div className="space-y-2 text-xs">
                          {reportCard.subjects?.map((sub) => (
                            <div key={sub.subject} className="flex justify-between items-center py-0.5">
                              <span className="capitalize font-medium text-zinc-700">{sub.subject}</span>
                              <span className="font-semibold text-zinc-800">{sub.is_absent ? "AB" : `${sub.marks_obtained}/${sub.total_max}`}</span>
                              <span className="font-bold text-indigo-600 text-xs">{sub.grade}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-zinc-100 pt-3 space-y-1.5 text-xs font-medium text-zinc-600">
                          <div className="flex justify-between">
                            <span>Rank:</span>
                            <span className="font-bold text-zinc-900">#{reportCard.rank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Percentage:</span>
                            <span className="font-bold text-zinc-900">{reportCard.summary?.percentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attendance:</span>
                            <span className="font-bold text-zinc-900">{reportCard.summary?.attendance_rate}%</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span>Result:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${reportCard.summary?.status === "Pass" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                              {reportCard.summary?.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-6 text-center text-zinc-400 font-medium text-xs">
                        Select a student from standings to preview report card.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. SUBJECTWISE */}
              {activeTab === "subjectwise" && (
                <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3">Class/Section</th>
                        <th className="p-3">Students</th>
                        <th className="p-3">Class Average</th>
                        <th className="p-3">Highest Score</th>
                        <th className="p-3">Passed</th>
                        <th className="p-3 text-right">Failed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                      {subjectWise.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-zinc-400">No subject data found.</td>
                        </tr>
                      ) : (
                        subjectWise.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-3 font-semibold text-zinc-900 capitalize">{row.subject}</td>
                            <td className="p-3">{row.class} - {row.section}</td>
                            <td className="p-3">{row.students} students</td>
                            <td className="p-3 font-semibold text-indigo-600">{row.average}%</td>
                            <td className="p-3 font-semibold text-emerald-600">{row.highest}%</td>
                            <td className="p-3 text-emerald-600 font-semibold">{row.passed}</td>
                            <td className="p-3 text-rose-500 font-semibold text-right">{row.failed}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. TOPPERS */}
              {activeTab === "toppers" && (
                <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Position</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class/Section</th>
                        <th className="p-3 text-right">Marks & Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                      {toppers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-400">No topper records found.</td>
                        </tr>
                      ) : (
                        toppers.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-3 font-black text-amber-600">#{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-semibold text-zinc-900">{row.student?.full_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{row.student?.student_id}</div>
                            </td>
                            <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                            <td className="p-3 font-semibold text-emerald-600 text-right">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. FAILS */}
              {activeTab === "fails" && (
                <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class/Section</th>
                        <th className="p-3">Marks</th>
                        <th className="p-3">Grade</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                      {failList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-emerald-600 font-semibold">All students passed this session.</td>
                        </tr>
                      ) : (
                        failList.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-3 font-bold text-zinc-500">#{row.rank}</td>
                            <td className="p-3">
                              <div className="font-semibold text-rose-600">{row.student?.full_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{row.student?.student_id}</div>
                            </td>
                            <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                            <td className="p-3 font-medium text-zinc-800">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                            <td className="p-3 font-bold text-rose-600">{row.grade}</td>
                            <td className="p-3 text-right font-bold text-rose-600 uppercase text-[10px]">{row.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. MERITS */}
              {activeTab === "merits" && (
                <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class/Section</th>
                        <th className="p-3 text-right">Percentage Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                      {meritList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-400">No merit list students recorded.</td>
                        </tr>
                      ) : (
                        meritList.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-3 font-black text-indigo-600">#{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-semibold text-zinc-900">{row.student?.full_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{row.student?.student_id}</div>
                            </td>
                            <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                            <td className="p-3 font-bold text-emerald-600 text-right">{row.percentage}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}