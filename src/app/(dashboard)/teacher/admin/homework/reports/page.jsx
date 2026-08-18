"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import {
  FaUserTie,
  FaUserGraduate,
  FaChalkboard,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  getTeacherHomeworkReportTeacher,
  getTeacherHomeworkReportStudent,
  getTeacherHomeworkReportClass,
  getTeacherHomeworkReportMonthly,
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherAdminHomeworkReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teacher");

  const [teacherReport, setTeacherReport] = useState([]);
  const [teacherMonth, setTeacherMonth] = useState("2026-08");

  const [studentReport, setStudentReport] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [classReport, setClassReport] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2026");

  const loadTeacherReport = async (month) => {
    try {
      setLoading(true);
      const res = await getTeacherHomeworkReportTeacher({ month });
      setTeacherReport(res?.rows || []);
    } catch (err) {
      toast.error("Failed to load teacher homework report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReport = async (classId, sectionId) => {
    try {
      setLoading(true);
      const params = {};
      if (classId) params.class_id = classId;
      if (sectionId) params.section_id = sectionId;
      const res = await getTeacherHomeworkReportStudent(params);
      setStudentReport(res?.rows || []);
    } catch (err) {
      toast.error("Failed to load student homework report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadClassReport = async () => {
    try {
      setLoading(true);
      const res = await getTeacherHomeworkReportClass();
      setClassReport(res?.rows || []);
    } catch (err) {
      toast.error("Failed to load class homework report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async (year) => {
    try {
      setLoading(true);
      const res = await getTeacherHomeworkReportMonthly({ year });
      setMonthlyReport(res?.rows || []);
    } catch (err) {
      toast.error("Failed to load monthly homework report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "teacher") {
      loadTeacherReport(teacherMonth);
    } else if (activeTab === "student") {
      loadStudentReport(selectedClassId, selectedSectionId);
    } else if (activeTab === "class") {
      loadClassReport();
    } else if (activeTab === "monthly") {
      loadMonthlyReport(selectedYear);
    }
  }, [activeTab]);

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Homework Performance Reports"
        subtitle="Analyze teacher assignment patterns, student submission completion rates, and monthly trends."
      />

      {/* Tab switcher */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("teacher")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "teacher"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaUserTie /> Teacher Homework
        </button>
        <button
          onClick={() => setActiveTab("student")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "student"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaUserGraduate /> Student Submissions
        </button>
        <button
          onClick={() => setActiveTab("class")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "class"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaChalkboard /> Class Completion Rates
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "monthly"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaCalendarAlt /> Monthly Trends
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-4">
          {/* 1. TEACHER TAB */}
          {activeTab === "teacher" && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 border border-zinc-200 rounded-xl shadow-sm">
                <span className="font-bold text-zinc-900 text-sm">
                  Teacher Homework Assignment Frequency
                </span>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-zinc-500 uppercase text-[11px]">
                    Select Month:
                  </label>
                  <input
                    type="month"
                    value={teacherMonth}
                    onChange={(e) => {
                      setTeacherMonth(e.target.value);
                      loadTeacherReport(e.target.value);
                    }}
                    className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none font-medium text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Teacher</th>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Homework Assigned</th>
                      <th className="p-3">Submissions Received</th>
                      <th className="p-3 text-right">Graded Submissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {teacherReport.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-zinc-400">
                          No teacher homework data found for this month.
                        </td>
                      </tr>
                    ) : (
                      teacherReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-3 font-semibold text-zinc-900">
                            {row.teacher?.full_name || "—"}
                          </td>
                          <td className="p-3 text-zinc-600 font-mono">
                            {row.teacher?.employee_id || "—"}
                          </td>
                          <td className="p-3 font-semibold text-indigo-600">
                            {row.homework_count} modules
                          </td>
                          <td className="p-3 font-semibold text-zinc-800">
                            {row.submission_count}
                          </td>
                          <td className="p-3 font-semibold text-emerald-600 text-right">
                            {row.graded_count} graded
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 2. STUDENT TAB */}
          {activeTab === "student" && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 border border-zinc-200 rounded-xl shadow-sm">
                <span className="font-bold text-zinc-900 text-sm">
                  Student Submission Registry
                </span>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="space-y-0.5">
                    <label className="text-[10px] uppercase text-zinc-500 font-semibold block">
                      Class ID
                    </label>
                    <input
                      type="text"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      placeholder="Class UUID..."
                      className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] uppercase text-zinc-500 font-semibold block">
                      Section ID
                    </label>
                    <input
                      type="text"
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      placeholder="Section UUID..."
                      className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => loadStudentReport(selectedClassId, selectedSectionId)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm self-end transition-colors"
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Class/Section</th>
                      <th className="p-3">Assigned</th>
                      <th className="p-3">Submitted</th>
                      <th className="p-3">Pending</th>
                      <th className="p-3 text-right">Graded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {studentReport.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-zinc-400">
                          No student submissions found.
                        </td>
                      </tr>
                    ) : (
                      studentReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-3 font-semibold text-zinc-900">
                            {row.student?.full_name || "—"}
                          </td>
                          <td className="p-3 text-zinc-600 font-mono">
                            {row.student?.student_id} (Roll: {row.student?.roll_no || "—"})
                          </td>
                          <td className="p-3 capitalize">
                            {row.student?.class
                              ? `${row.student.class} (${row.student.section})`
                              : "—"}
                          </td>
                          <td className="p-3 font-semibold text-zinc-900">{row.total_assigned}</td>
                          <td className="p-3 font-semibold text-emerald-600">{row.submitted}</td>
                          <td className="p-3 font-semibold text-rose-500">{row.pending}</td>
                          <td className="p-3 font-semibold text-indigo-600 text-right">{row.graded}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 3. CLASS TAB */}
          {activeTab === "class" && (
            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Class Level</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Total Homeworks</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Submissions Mapped</th>
                    <th className="p-3">Expected Total</th>
                    <th className="p-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {classReport.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-zinc-400">
                        No class completion reports available.
                      </td>
                    </tr>
                  ) : (
                    classReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-semibold text-zinc-900 capitalize">
                          {row.class?.name || "—"}
                        </td>
                        <td className="p-3 font-semibold text-zinc-700 uppercase">
                          {row.section?.name || "—"}
                        </td>
                        <td className="p-3 font-semibold text-indigo-600">
                          {row.homework_count} assigned
                        </td>
                        <td className="p-3">{row.student_count} students</td>
                        <td className="p-3 font-semibold text-emerald-600">{row.submissions}</td>
                        <td className="p-3 font-semibold text-zinc-500">{row.expected}</td>
                        <td className="p-3 text-right font-bold text-indigo-600">
                          {row.completion_rate}%
                          <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden ml-auto mt-1">
                            <div
                              className="bg-indigo-600 h-full"
                              style={{ width: `${Math.min(row.completion_rate || 0, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. MONTHLY TAB */}
          {activeTab === "monthly" && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 border border-zinc-200 rounded-xl shadow-sm">
                <span className="font-bold text-zinc-900 text-sm">
                  Monthly Homework Assignment Patterns
                </span>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-zinc-500 uppercase text-[11px]">
                    Select Year:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      loadMonthlyReport(e.target.value);
                    }}
                    className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none font-medium text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Month Name</th>
                      <th className="p-3">Homework Assigned</th>
                      <th className="p-3">Submissions Received</th>
                      <th className="p-3 text-right">Graded Submissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {monthlyReport.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-zinc-400">
                          No monthly data found.
                        </td>
                      </tr>
                    ) : (
                      monthlyReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-3 font-semibold text-zinc-900">{row.label}</td>
                          <td className="p-3 font-semibold text-indigo-600">
                            {row.homework_count} assignments
                          </td>
                          <td className="p-3 font-semibold text-zinc-800">
                            {row.submission_count}
                          </td>
                          <td className="p-3 font-semibold text-emerald-600 text-right">
                            {row.graded_count} graded
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}