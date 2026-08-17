"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaGraduationCap, FaBook, FaTrophy, FaUserTimes, FaAward, FaFileSpreadsheet 
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
      const list = res.exams || [];
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
      const overRes = await getTeacherReportsExamOverview(examId);
      setOverview(overRes.overview || null);

      const classRes = await getTeacherReportsExamClassWise(examId);
      const rows = classRes.report || [];
      setClassWise(rows);

      const subRes = await getTeacherReportsExamSubjectWise(examId);
      setSubjectWise(subRes.report || []);

      const topRes = await getTeacherReportsExamToppers(examId);
      setToppers(topRes.toppers || []);

      const failRes = await getTeacherReportsExamFailList(examId);
      setFailList(failRes.students || []);

      const meritRes = await getTeacherReportsExamMeritList(examId);
      setMeritList(meritRes.students || []);

      if (rows.length > 0) {
        setSelectedStudentId(rows[0].student.id);
        const cardRes = await getTeacherReportsExamReportCard(examId, rows[0].student.id);
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
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader 
          title="Examination Insights & Reports"
          subtitle="Analyze standings, pass metrics, subject-wise trends, and download student report cards."
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Choose Exam Session</label>
            <select 
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                loadExamDetails(e.target.value);
              }}
              className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-zinc-800 outline-none font-bold"
            >
              {examsList.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.type_label})</option>
              ))}
            </select>
          </div>

          {overview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto font-bold text-[10px]">
              <div className="bg-zinc-55/40 p-2.5 border border-zinc-200 rounded-xl text-center">
                <span className="text-zinc-450 uppercase text-[8px] block">Students Graded</span>
                <span className="text-zinc-850 text-sm font-black mt-0.5 block">{overview.students_with_marks}</span>
              </div>
              <div className="bg-zinc-55/40 p-2.5 border border-zinc-200 rounded-xl text-center">
                <span className="text-emerald-600 uppercase text-[8px] block">Passed</span>
                <span className="text-emerald-700 text-sm font-black mt-0.5 block">{overview.passed}</span>
              </div>
              <div className="bg-zinc-55/40 p-2.5 border border-zinc-200 rounded-xl text-center">
                <span className="text-rose-500 uppercase text-[8px] block">Failed</span>
                <span className="text-rose-600 text-sm font-black mt-0.5 block">{overview.failed}</span>
              </div>
              <div className="bg-zinc-55/40 p-2.5 border border-zinc-200 rounded-xl text-center">
                <span className="text-indigo-600 uppercase text-[8px] block">Avg Score</span>
                <span className="text-indigo-700 text-sm font-black mt-0.5 block">{overview.average_percentage}%</span>
              </div>
            </div>
          )}
        </div>

        {selectedExamId && (
          <div className="space-y-4">
            <div className="flex border-b border-zinc-200">
              <button 
                onClick={() => setActiveTab("classwise")}
                className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "classwise" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
              >
                <FaGraduationCap className="inline mr-1" /> Class Standings
              </button>
              <button 
                onClick={() => setActiveTab("subjectwise")}
                className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "subjectwise" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
              >
                <FaBook className="inline mr-1" /> Subject Performance
              </button>
              <button 
                onClick={() => setActiveTab("toppers")}
                className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "toppers" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
              >
                <FaTrophy className="inline mr-1" /> Toppers List
              </button>
              <button 
                onClick={() => setActiveTab("fails")}
                className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "fails" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
              >
                <FaUserTimes className="inline mr-1" /> Fail List
              </button>
              <button 
                onClick={() => setActiveTab("merits")}
                className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "merits" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
              >
                <FaAward className="inline mr-1" /> Merit List
              </button>
            </div>

            {loading ? <PageLoader /> : (
              <div className="space-y-4">
                {activeTab === "classwise" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Rank</th>
                              <th className="p-3">Student</th>
                              <th className="p-3">Class/Section</th>
                              <th className="p-3">Obtained Marks</th>
                              <th className="p-3">Grade</th>
                              <th className="p-3 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {classWise.map((row) => (
                              <tr 
                                key={row.student.id}
                                onClick={() => handleStudentSelect(row.student.id)}
                                className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${selectedStudentId === row.student.id ? "bg-indigo-50/80" : ""}`}
                              >
                                <td className="p-3 font-extrabold text-zinc-850">#{row.rank}</td>
                                <td className="p-3">
                                  <div className="font-bold text-zinc-800">{row.student.full_name}</div>
                                  <div className="text-[9px] text-zinc-400">{row.student.student_id}</div>
                                </td>
                                <td className="p-3">{row.student.class} - {row.student.section}</td>
                                <td className="p-3 font-bold">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                                <td className="p-3"><span className="px-2 py-0.5 bg-zinc-100 rounded font-bold text-zinc-700">{row.grade}</span></td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${row.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {reportCard ? (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
                          <div className="text-center space-y-1.5 border-b border-zinc-100 pb-3">
                            <h4 className="font-black text-sm text-zinc-850">{reportCard.school?.name}</h4>
                            <div className="font-bold text-zinc-650 text-[11px]">{reportCard.student?.full_name}</div>
                            <div className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">Class: {reportCard.student?.class} | Roll: {reportCard.student?.roll_no}</div>
                          </div>
                          <div className="space-y-2">
                            {reportCard.subjects?.map((sub) => (
                              <div key={sub.subject} className="flex justify-between font-medium">
                                <span className="capitalize">{sub.subject}</span>
                                <span className="font-bold">{sub.is_absent ? "AB" : `${sub.marks_obtained}/${sub.total_max}`}</span>
                                <span className="font-bold text-zinc-750">{sub.grade}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-zinc-100 pt-3 space-y-2 text-[10px] font-semibold text-zinc-550">
                            <div className="flex justify-between">
                              <span>Rank:</span>
                              <span className="font-bold text-zinc-800">#{reportCard.rank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Percentage:</span>
                              <span className="font-bold text-zinc-800">{reportCard.summary?.percentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attendance:</span>
                              <span className="font-bold text-zinc-800">{reportCard.summary?.attendance_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Result:</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold ${reportCard.summary?.status === "Pass" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                                {reportCard.summary?.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-zinc-200 border-dashed rounded-2xl p-6 text-center text-zinc-400 font-bold">
                          Select a student from standings to load report card.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "subjectwise" && (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
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
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                        {subjectWise.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-zinc-400">No data found.</td>
                          </tr>
                        ) : (
                          subjectWise.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-bold text-zinc-850 capitalize">{row.subject}</td>
                              <td className="p-3">{row.class} - {row.section}</td>
                              <td className="p-3">{row.students} students</td>
                              <td className="p-3 font-bold text-indigo-600">{row.average}%</td>
                              <td className="p-3 font-bold text-emerald-600">{row.highest}%</td>
                              <td className="p-3 text-emerald-600">{row.passed}</td>
                              <td className="p-3 text-rose-500 text-right">{row.failed}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "toppers" && (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Position</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Class/Section</th>
                          <th className="p-3 text-right">Marks & Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                        {toppers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-zinc-400">No student records found.</td>
                          </tr>
                        ) : (
                          toppers.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-black text-amber-600">#{idx + 1}</td>
                              <td className="p-3">
                                <div className="font-bold text-zinc-800">{row.student?.full_name}</div>
                                <div className="text-[9px] text-zinc-450">{row.student?.student_id}</div>
                              </td>
                              <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                              <td className="p-3 font-bold text-emerald-600 text-right">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "fails" && (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Class/Section</th>
                          <th className="p-3">Marks</th>
                          <th className="p-3">Grade</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                        {failList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-emerald-600 font-bold">Awesome! All students passed this session.</td>
                          </tr>
                        ) : (
                          failList.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-extrabold text-zinc-400">#{row.rank}</td>
                              <td className="p-3">
                                <div className="font-bold text-rose-600">{row.student?.full_name}</div>
                                <div className="text-[9px] text-zinc-450">{row.student?.student_id}</div>
                              </td>
                              <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                              <td className="p-3 font-bold">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                              <td className="p-3 font-bold text-rose-500">{row.grade}</td>
                              <td className="p-3 text-right font-black text-rose-600 uppercase text-[9px]">{row.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "merits" && (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Class/Section</th>
                          <th className="p-3 text-right">Percentage Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                        {meritList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-zinc-400">No merit list students recorded.</td>
                          </tr>
                        ) : (
                          meritList.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-black text-indigo-600">#{idx + 1}</td>
                              <td className="p-3">
                                <div className="font-bold text-zinc-800">{row.student?.full_name}</div>
                                <div className="text-[9px] text-zinc-450">{row.student?.student_id}</div>
                              </td>
                              <td className="p-3">{row.student?.class} - {row.student?.section}</td>
                              <td className="p-3 font-black text-emerald-600 text-right">{row.percentage}%</td>
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
    </DashboardLayout>
  );
}
