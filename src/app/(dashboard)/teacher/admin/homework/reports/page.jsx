"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaUserTie, FaUserGraduate, FaChalkboard, FaCalendarAlt 
} from "react-icons/fa";
import { 
  getTeacherHomeworkReportTeacher,
  getTeacherHomeworkReportStudent,
  getTeacherHomeworkReportClass,
  getTeacherHomeworkReportMonthly
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherAdminHomeworkReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teacher"); // teacher, student, class, monthly
  
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
      setTeacherReport(res.rows || []);
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
      setStudentReport(res.rows || []);
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
      setClassReport(res.rows || []);
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
      setMonthlyReport(res.rows || []);
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
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader 
          title="Homework Performance Reports"
          subtitle="Analyze teacher assignment patterns, student submission completion rates, and monthly trends."
        />

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200">
          <button 
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "teacher" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaUserTie className="inline mr-1" /> Teacher Homework
          </button>
          <button 
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "student" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaUserGraduate className="inline mr-1" /> Student Submissions
          </button>
          <button 
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "class" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaChalkboard className="inline mr-1" /> Class Completion Rates
          </button>
          <button 
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "monthly" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaCalendarAlt className="inline mr-1" /> Monthly Trends
          </button>
        </div>

        {loading ? <PageLoader /> : (
          <div className="space-y-4">
            
            {/* 1. TEACHER TAB */}
            {activeTab === "teacher" && (
              <>
                <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="font-extrabold text-zinc-800">Teacher Homework Assignment Frequency</span>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Month</label>
                    <input 
                      type="month"
                      value={teacherMonth}
                      onChange={(e) => {
                        setTeacherMonth(e.target.value);
                        loadTeacherReport(e.target.value);
                      }}
                      className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-850 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                      <tr>
                        <th className="p-3">Teacher</th>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Homework Assigned</th>
                        <th className="p-3">Submissions Received</th>
                        <th className="p-3 text-right">Graded Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                      {teacherReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800">{row.teacher?.full_name}</td>
                          <td className="p-3">{row.teacher?.employee_id}</td>
                          <td className="p-3 font-bold text-indigo-650">{row.homework_count} modules</td>
                          <td className="p-3 font-bold text-zinc-700">{row.submission_count}</td>
                          <td className="p-3 font-bold text-emerald-600 text-right">{row.graded_count} graded</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 2. STUDENT TAB */}
            {activeTab === "student" && (
              <>
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="font-extrabold text-zinc-800">Student Submission Registry</span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="space-y-0.5">
                      <label className="text-[9px] uppercase text-zinc-400 font-bold block">Class ID</label>
                      <input 
                        type="text" 
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        placeholder="Class UUID..."
                        className="bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] uppercase text-zinc-400 font-bold block">Section ID</label>
                      <input 
                        type="text" 
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        placeholder="Section UUID..."
                        className="bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => loadStudentReport(selectedClassId, selectedSectionId)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg font-bold shadow-sm self-end"
                    >
                      Filter
                    </button>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
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
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                      {studentReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800">{row.student?.full_name}</td>
                          <td className="p-3">{row.student?.student_id} (Roll: {row.student?.roll_no || "—"})</td>
                          <td className="p-3 capitalize">{row.student?.class ? `${row.student.class} (${row.student.section})` : "—"}</td>
                          <td className="p-3 font-bold text-zinc-800">{row.total_assigned}</td>
                          <td className="p-3 font-bold text-emerald-600">{row.submitted}</td>
                          <td className="p-3 font-bold text-rose-500">{row.pending}</td>
                          <td className="p-3 font-bold text-indigo-600 text-right">{row.graded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 3. CLASS TAB */}
            {activeTab === "class" && (
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
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
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                    {classReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-3 font-bold text-zinc-800 capitalize">{row.class?.name}</td>
                        <td className="p-3 font-bold text-zinc-700 uppercase">{row.section?.name}</td>
                        <td className="p-3 font-bold text-indigo-605">{row.homework_count} assigned</td>
                        <td className="p-3">{row.student_count} students</td>
                        <td className="p-3 font-bold text-emerald-600">{row.submissions}</td>
                        <td className="p-3 font-bold text-zinc-450">{row.expected}</td>
                        <td className="p-3 text-right font-black text-indigo-600">
                          {row.completion_rate}%
                          <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden ml-auto mt-1">
                            <div className="bg-indigo-500 h-full" style={{ width: `${row.completion_rate}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. MONTHLY TAB */}
            {activeTab === "monthly" && (
              <>
                <div className="flex justify-between items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="font-extrabold text-zinc-800">Monthly Homework Assignment Patterns</span>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        loadMonthlyReport(e.target.value);
                      }}
                      className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-850 outline-none font-bold"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                      <tr>
                        <th className="p-3">Month Name</th>
                        <th className="p-3">Homework Assigned</th>
                        <th className="p-3">Submissions Received</th>
                        <th className="p-3 text-right">Graded Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                      {monthlyReport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800">{row.label}</td>
                          <td className="p-3 font-bold text-indigo-650">{row.homework_count} assignments</td>
                          <td className="p-3 font-bold text-zinc-700">{row.submission_count}</td>
                          <td className="p-3 font-bold text-emerald-600 text-right">{row.graded_count} graded</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
