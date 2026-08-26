"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import {
  FaCalendarCheck, FaChalkboard, FaFileAlt, FaBook, FaStickyNote,
  FaMoneyBillWave, FaBus, FaVideo, FaFileSignature,
  FaArrowRight, FaTimes, FaGraduationCap, FaNetworkWired,
  FaTrophy, FaUserTimes, FaAward
} from "react-icons/fa";
import {
  getTeacherReports,
  getTeacherReportsExamsList,
  getTeacherReportsExamOverview,
  getTeacherReportsExamClassWise,
  getTeacherReportsExamSubjectWise,
  getTeacherReportsExamToppers,
  getTeacherReportsExamFailList,
  getTeacherReportsExamMeritList,
  getTeacherReportsExamReportCard,
  getTeacherReportsStaffAttendance,
  getTeacherReportsStaffAttendanceHistory,
  getTeacherFeeStructuresReport,
  getTeacherFeeOnlinePaymentsReport,
  getTeacherClassReportsStrength,
  getTeacherClassReportsClassStudents,
  getTeacherClassReportsSectionStudents,
  getTeacherClassReportsAttendance,
  getTeacherClassReportsSubjectTeachers,
  getTeacherClassReportsTransfers,
  getTeacherClassNotesReportTeacher,
  getTeacherClassNotesReportClass,
  getTeacherClassNotesReportSubject,
  getTeacherHomeworkReportTeacher,
  getTeacherHomeworkReportStudent,
  getTeacherHomeworkReportClass,
  getTeacherHomeworkReportMonthly
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherReportsHubPage() {
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [examsList, setExamsList] = useState([]);
  const [forbidden, setForbidden] = useState(false);

  // Inspector States for detailed report modals
  const [activeReportItem, setActiveReportItem] = useState(null);

  // Specific report view state
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examOverview, setExamOverview] = useState(null);
  const [examClassWise, setExamClassWise] = useState([]);
  const [examSubjectWise, setExamSubjectWise] = useState([]);
  const [examToppers, setExamToppers] = useState([]);
  const [examFailList, setExamFailList] = useState([]);
  const [examMeritList, setExamMeritList] = useState([]);
  const [examSubTab, setExamSubTab] = useState("classwise"); // classwise, subjectwise, toppers, fails, merits

  // Specific student report card view
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentReportCard, setStudentReportCard] = useState(null);

  // Other Reports states
  const [staffRoster, setStaffRoster] = useState([]);
  const [staffHistory, setStaffHistory] = useState([]);
  const [staffHistoryMonth, setStaffHistoryMonth] = useState("2026-08");

  const [feeStructures, setFeeStructures] = useState([]);
  const [feePayments, setFeePayments] = useState(null);

  // Class reports states
  const [classStrength, setClassStrength] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [classAttendance, setClassAttendance] = useState([]);
  const [classAttendanceMonth, setClassAttendanceMonth] = useState("2026-08");
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  const [studentTransfers, setStudentTransfers] = useState([]);

  // Notes reports states
  const [notesTeacher, setNotesTeacher] = useState([]);
  const [notesClass, setNotesClass] = useState([]);
  const [notesSubject, setNotesSubject] = useState([]);

  // Homework reports states
  const [homeworkTeacher, setHomeworkTeacher] = useState([]);
  const [homeworkStudent, setHomeworkStudent] = useState([]);
  const [homeworkClass, setHomeworkClass] = useState([]);
  const [homeworkMonthly, setHomeworkMonthly] = useState([]);
  const [homeworkMonth, setHomeworkMonth] = useState("2026-08");
  const [homeworkYear, setHomeworkYear] = useState("2026");

  // Detail Modal view controls
  const [showSubReportModal, setShowSubReportModal] = useState(false);
  const [subReportLoading, setSubReportLoading] = useState(false);

  const loadHub = async () => {
    try {
      setLoading(true);
      const reportsRes = await getTeacherReports();
      setReportsData(reportsRes);

      // Preload exams list for potential exam dropdown selection
      const examsRes = await getTeacherReportsExamsList();
      setExamsList(examsRes?.exams || []);
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load reports panel: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHub();
  }, []);

  const handleExamSelect = async (examId) => {
    if (!examId) return;
    setSelectedExamId(examId);
    setSubReportLoading(true);
    try {
      const overview = await getTeacherReportsExamOverview(examId);
      setExamOverview(overview?.overview || null);

      const classWise = await getTeacherReportsExamClassWise(examId);
      const rows = classWise?.report || [];
      setExamClassWise(rows);

      const subWise = await getTeacherReportsExamSubjectWise(examId);
      setExamSubjectWise(subWise?.report || []);

      const toppers = await getTeacherReportsExamToppers(examId);
      setExamToppers(toppers?.toppers || []);

      const fails = await getTeacherReportsExamFailList(examId);
      setExamFailList(fails?.students || []);

      const merits = await getTeacherReportsExamMeritList(examId);
      setExamMeritList(merits?.students || []);

      if (rows.length > 0) {
        handleLoadReportCard(examId, rows[0].student?.id);
      }
    } catch (err) {
      toast.error("Failed to load exam insights: " + (err.message || err));
    } finally {
      setSubReportLoading(false);
    }
  };

  const handleLoadReportCard = async (examId, studentId) => {
    setSelectedStudentId(studentId);
    try {
      const res = await getTeacherReportsExamReportCard(examId, studentId);
      setStudentReportCard(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch individual sub-report dynamic details
  const handleOpenSubReport = async (item) => {
    setActiveReportItem(item);
    setShowSubReportModal(true);
    setSubReportLoading(true);

    setExamOverview(null);
    setExamClassWise([]);
    setExamSubjectWise([]);
    setExamToppers([]);
    setExamFailList([]);
    setExamMeritList([]);
    setStudentReportCard(null);
    setExamSubTab("classwise");

    try {
      if (item.label.includes("Exam Reports Overview") || item.feature === "exams") {
        if (examsList.length > 0) {
          handleExamSelect(examsList[0].id);
        }
      } else if (item.label.includes("Staff Attendance History") || item.url?.includes("staff-attendance/history")) {
        const res = await getTeacherReportsStaffAttendanceHistory({ month: staffHistoryMonth });
        setStaffHistory(res?.records || []);
      } else if (item.label.includes("Staff Attendance") || item.url?.includes("staff-attendance")) {
        const res = await getTeacherReportsStaffAttendance();
        setStaffRoster(res?.staff || []);
      } else if (item.label.includes("Fee Structures") || item.url?.includes("structures/report")) {
        const res = await getTeacherFeeStructuresReport();
        setFeeStructures(res?.report || []);
      } else if (item.label.includes("Online Collection") || item.url?.includes("online-payments")) {
        const res = await getTeacherFeeOnlinePaymentsReport({ payment_mode: "online" });
        setFeePayments(res);
      } else if (item.label.includes("Class Strength") || item.url?.includes("strength")) {
        const res = await getTeacherClassReportsStrength();
        setClassStrength(res?.rows || []);
      } else if (item.label.includes("Class-wise Students") || item.url?.includes("class-students")) {
        const res = await getTeacherClassReportsClassStudents();
        setClassStudents(res?.students || []);
      } else if (item.label.includes("Section-wise Students") || item.url?.includes("section-students")) {
        const res = await getTeacherClassReportsSectionStudents();
        setSectionStudents(res?.students || []);
      } else if (item.label.includes("Class Attendance Report") || item.url?.includes("reports/attendance")) {
        const res = await getTeacherClassReportsAttendance({ month: classAttendanceMonth });
        setClassAttendance(res?.rows || []);
      } else if (item.label.includes("Subject Teachers") || item.url?.includes("subject-teachers")) {
        const res = await getTeacherClassReportsSubjectTeachers();
        setSubjectTeachers(res?.rows || []);
      } else if (item.label.includes("Student Transfer") || item.url?.includes("transfers")) {
        const res = await getTeacherClassReportsTransfers();
        setStudentTransfers(res?.transfers || []);
      } else if (item.label.includes("Teacher Notes") || item.url?.includes("reports/teacher")) {
        const res = await getTeacherClassNotesReportTeacher();
        setNotesTeacher(res?.rows || []);
      } else if (item.label.includes("Class-wise Notes") || item.url?.includes("reports/class")) {
        const res = await getTeacherClassNotesReportClass();
        setNotesClass(res?.rows || []);
      } else if (item.label.includes("Subject-wise Notes") || item.url?.includes("reports/subject")) {
        const res = await getTeacherClassNotesReportSubject();
        setNotesSubject(res?.rows || []);
      } else if (item.label.includes("Teacher Homework") || item.url?.includes("homework/reports/teacher")) {
        const res = await getTeacherHomeworkReportTeacher({ month: homeworkMonth });
        setHomeworkTeacher(res?.rows || []);
      } else if (item.label.includes("Student Homework") || item.url?.includes("homework/reports/student")) {
        const res = await getTeacherHomeworkReportStudent();
        setHomeworkStudent(res?.rows || []);
      } else if (item.label.includes("Class Homework") || item.url?.includes("homework/reports/class")) {
        const res = await getTeacherHomeworkReportClass();
        setHomeworkClass(res?.rows || []);
      } else if (item.label.includes("Monthly Homework") || item.url?.includes("homework/reports/monthly")) {
        const res = await getTeacherHomeworkReportMonthly({ year: homeworkYear });
        setHomeworkMonthly(res?.rows || []);
      }
    } catch (err) {
      toast.error("Failed to load report data: " + (err.message || err));
    } finally {
      setSubReportLoading(false);
    }
  };

  // Group helpers
  const getIconForGroup = (groupName) => {
    const name = groupName.toLowerCase();
    if (name.includes("attendance")) return <FaCalendarCheck className="text-emerald-600 w-4 h-4" />;
    if (name.includes("class")) return <FaChalkboard className="text-indigo-600 w-4 h-4" />;
    if (name.includes("exam")) return <FaFileAlt className="text-amber-500 w-4 h-4" />;
    if (name.includes("homework")) return <FaBook className="text-rose-500 w-4 h-4" />;
    if (name.includes("notes")) return <FaStickyNote className="text-cyan-600 w-4 h-4" />;
    if (name.includes("fee")) return <FaMoneyBillWave className="text-emerald-500 w-4 h-4" />;
    if (name.includes("transport")) return <FaBus className="text-sky-500 w-4 h-4" />;
    if (name.includes("live")) return <FaVideo className="text-purple-500 w-4 h-4" />;
    return <FaFileSignature className="text-zinc-500 w-4 h-4" />;
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-600 font-medium leading-relaxed mt-2">
          Reports Dashboard is not enabled for your account or requires higher teacher administrative access tokens.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <PageLoader />
      </div>
    );
  }

  const fallbackGroups = [
    {
      group: "Academics & Exams",
      items: [
        { label: "Exam Reports Overview", feature: "exams", url: "/teacher/exams" },
        { label: "Class Strength Report", feature: "classes", url: "/teacher/class-reports/strength" },
        { label: "Class Attendance Report", feature: "classes", url: "/teacher/class-reports/attendance" }
      ]
    },
    {
      group: "Finance & Fees",
      items: [
        { label: "Fee Structures Report", feature: "finance", url: "/teacher/fees/structures/report" },
        { label: "Online Collection Report", feature: "finance", url: "/teacher/fees/online-payments" }
      ]
    },
    {
      group: "Homework & Assignments",
      items: [
        { label: "Teacher Homework Performance", feature: "homework", url: "/teacher/homework/reports/teacher" },
        { label: "Student Homework Completion", feature: "homework", url: "/teacher/homework/reports/student" },
        { label: "Class Homework Analytics", feature: "homework", url: "/teacher/homework/reports/class" },
        { label: "Monthly Homework Overview", feature: "homework", url: "/teacher/homework/reports/monthly" }
      ]
    },
    {
      group: "Staff & Attendance",
      items: [
        { label: "Staff Attendance History", feature: "attendance", url: "/teacher/manage/staff-attendance/history" }
      ]
    }
  ];

  const defaultCharts = {
    students: {
      labels: ["Class 1", "Class 2", "Class 3", "Class 4", "class-11", "Class 12"],
      data: [4, 7, 0, 0, 1, 0]
    }
  };

  const stats = reportsData?.stats || {};
  const charts = reportsData?.charts?.students ? reportsData.charts : defaultCharts;
  const groups = reportsData?.groups && reportsData.groups.length > 0 ? reportsData.groups : fallbackGroups;

  return (
    <div className="w-full space-y-4">

      {/* Page Header */}
      <PageHeader
        title="Reports & Insights Console"
        subtitle="Analyze school-wide academics, fee collection records, exam statistics, and staff metrics."
      />

      {/* Stats Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Students</span>
          <span className="text-lg font-black text-zinc-900 block">{stats.students || 0}</span>
          <span className="text-[10px] text-zinc-500 font-medium block">In {stats.classes || 0} Classes</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Teachers</span>
          <span className="text-lg font-black text-zinc-900 block">{stats.teachers || 0}</span>
          <span className="text-[10px] text-zinc-500 font-medium block">Total Staff: {stats.staff || 0}</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Fees Collected</span>
          <span className="text-lg font-black text-emerald-600 block">₹{(stats.fee_collected || 0).toLocaleString()}</span>
          <span className="text-[10px] text-rose-500 font-bold block">Due: ₹{(stats.fee_due || 0).toLocaleString()}</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Monthly Attendance</span>
          <span className="text-lg font-black text-zinc-900 block">{stats.attendance_month || 0}</span>
          <span className="text-[10px] text-zinc-500 font-medium block">Logs this month</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Pending Leaves</span>
          <span className="text-lg font-black text-zinc-900 block">{stats.leave_pending || 0}</span>
          <span className="text-[10px] text-emerald-600 font-bold block">Approved: {stats.leave_approved || 0}</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-sm space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Homework Assigned</span>
          <span className="text-lg font-black text-zinc-900 block">{stats.homework || 0}</span>
          <span className="text-[10px] text-zinc-500 font-medium block">Active modules</span>
        </div>
      </div>

      {/* Visual Charts & Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Fee collection progress meter */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Fee Collection Overview</h3>
            <span className="text-[10px] font-semibold text-zinc-500">Total: ₹{((stats.fee_collected || 0) + (stats.fee_due || 0)).toLocaleString()}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between font-semibold text-[11px]">
              <span className="text-emerald-700">Collected (₹{(stats.fee_collected || 0).toLocaleString()})</span>
              <span className="text-rose-600">Dues (₹{(stats.fee_due || 0).toLocaleString()})</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${((stats.fee_collected || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100}%` }}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${((stats.fee_due || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <span className="block text-[9px] uppercase tracking-wider text-emerald-800 font-bold">Cleared</span>
                <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                  {Math.round(((stats.fee_collected || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100)}%
                </span>
              </div>
              <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                <span className="block text-[9px] uppercase tracking-wider text-rose-800 font-bold">Outstanding</span>
                <span className="text-sm font-black text-rose-800 mt-0.5 block">
                  {Math.round(((stats.fee_due || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Student distribution per class meter */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Student Roster Strength</h3>
          </div>

          <div className="space-y-2 py-0.5">
            {charts.students?.labels?.map((label, idx) => {
              const count = charts.students.data[idx];
              const max = Math.max(...charts.students.data, 1);
              const percent = (count / max) * 100;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between font-semibold text-[11px]">
                    <span className="text-zinc-800 capitalize">{label}</span>
                    <span className="text-zinc-500">{count} students</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaves Status overview */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Leave Applications</h3>
            <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-200">
              Total: {stats.leave_total || 0}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-sm font-black text-amber-700 block">{stats.leave_pending || 0}</span>
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-0.5 block">Pending</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-sm font-black text-emerald-700 block">{stats.leave_approved || 0}</span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5 block">Approved</span>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg border border-rose-100">
                <span className="text-sm font-black text-rose-700 block">{stats.leave_rejected || 0}</span>
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider mt-0.5 block">Rejected</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 font-medium text-[11px] text-zinc-600">
              <div className="flex justify-between">
                <span>Student applications:</span>
                <span className="text-zinc-900 font-bold">{stats.leave_student || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Teacher/Staff applications:</span>
                <span className="text-zinc-900 font-bold">{stats.leave_teacher || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted this month:</span>
                <span className="text-zinc-900 font-bold">{stats.leave_this_month || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Groups & Directories List */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-5">
        <div className="border-b border-zinc-100 pb-2.5">
          <h2 className="text-sm font-bold text-zinc-900">Reports Library</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Select a report module to view lists, audit registries, or download charts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((grp) => (
            <div key={grp.group} className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-zinc-900 border-b border-zinc-100 pb-1.5">
                {getIconForGroup(grp.group)}
                <span className="uppercase text-[11px] tracking-wider">{grp.group}</span>
              </div>

              <div className="space-y-2">
                {grp.items.map((item) => (
                  <div
                    key={item.label}
                    onClick={() => handleOpenSubReport(item)}
                    className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-indigo-50/60 border border-zinc-200/80 hover:border-indigo-200 rounded-lg transition-all cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-zinc-800 group-hover:text-indigo-700 text-xs block">{item.label}</span>
                      <span className="text-[10px] text-zinc-500 group-hover:text-indigo-600 uppercase tracking-wider font-semibold">Scope: {item.feature}</span>
                    </div>
                    <div className="w-5 h-5 bg-white border border-zinc-200 rounded-md flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 transition-colors">
                      <FaArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- REPORTS DETAIL MODAL OVERLAY --- */}
      {showSubReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col text-xs text-left">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-100 shrink-0">
              <div>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Reports Hub Console</span>
                <h2 className="text-sm font-bold text-zinc-900 mt-0.5">{activeReportItem?.label || "Report Details"}</h2>
              </div>
              <button
                onClick={() => setShowSubReportModal(false)}
                className="w-7 h-7 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto grow space-y-4">

              {subReportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <PageLoader />
                </div>
              ) : (
                <>
                  {/* --- EXAM REPORTS OVERVIEW INSIGHTS --- */}
                  {(activeReportItem?.label.includes("Exam Reports") || activeReportItem?.feature === "exams") && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-zinc-50 p-3.5 border border-zinc-200 rounded-xl">
                        <div className="space-y-1 w-full sm:w-auto">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Select Active Exam</label>
                          <select
                            value={selectedExamId}
                            onChange={(e) => handleExamSelect(e.target.value)}
                            className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-zinc-800 outline-none font-semibold text-xs"
                          >
                            <option value="">-- Choose Exam --</option>
                            {examsList.map((ex) => (
                              <option key={ex.id} value={ex.id}>{ex.name} ({ex.type_label})</option>
                            ))}
                          </select>
                        </div>

                        {examOverview && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto font-bold text-[10px]">
                            <div className="bg-white p-2 border border-zinc-200 rounded-lg text-center">
                              <span className="text-zinc-500 uppercase text-[9px] block">Graded</span>
                              <span className="text-zinc-900 text-xs font-black mt-0.5 block">{examOverview.students_with_marks ?? 0}</span>
                            </div>
                            <div className="bg-white p-2 border border-zinc-200 rounded-lg text-center">
                              <span className="text-emerald-700 uppercase text-[9px] block">Passed</span>
                              <span className="text-emerald-700 text-xs font-black mt-0.5 block">{examOverview.passed ?? 0}</span>
                            </div>
                            <div className="bg-white p-2 border border-zinc-200 rounded-lg text-center">
                              <span className="text-rose-700 uppercase text-[9px] block">Failed</span>
                              <span className="text-rose-700 text-xs font-black mt-0.5 block">{examOverview.failed ?? 0}</span>
                            </div>
                            <div className="bg-white p-2 border border-zinc-200 rounded-lg text-center">
                              <span className="text-indigo-700 uppercase text-[9px] block">Avg Score</span>
                              <span className="text-indigo-700 text-xs font-black mt-0.5 block">{examOverview.average_percentage ?? 0}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedExamId && (
                        <div className="space-y-3">
                          <div className="flex border-b border-zinc-200 overflow-x-auto gap-1">
                            <button
                              onClick={() => setExamSubTab("classwise")}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${examSubTab === "classwise" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaGraduationCap /> Class Standings
                            </button>
                            <button
                              onClick={() => setExamSubTab("subjectwise")}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${examSubTab === "subjectwise" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaBook /> Subject Performance
                            </button>
                            <button
                              onClick={() => setExamSubTab("toppers")}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${examSubTab === "toppers" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaTrophy /> Toppers
                            </button>
                            <button
                              onClick={() => setExamSubTab("fails")}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${examSubTab === "fails" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaUserTimes /> Fail List
                            </button>
                            <button
                              onClick={() => setExamSubTab("merits")}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${examSubTab === "merits" ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaAward /> Merit List
                            </button>
                          </div>

                          {examSubTab === "classwise" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div className="lg:col-span-2 space-y-3">
                                <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                                      <tr>
                                        <th className="p-2.5">Rank</th>
                                        <th className="p-2.5">Student</th>
                                        <th className="p-2.5">Class/Section</th>
                                        <th className="p-2.5">Marks</th>
                                        <th className="p-2.5">Grade</th>
                                        <th className="p-2.5 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                      {examClassWise.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="p-4 text-center text-zinc-400">No student standings recorded.</td>
                                        </tr>
                                      ) : (
                                        examClassWise.map((row) => (
                                          <tr
                                            key={row.student?.id}
                                            onClick={() => handleLoadReportCard(selectedExamId, row.student?.id)}
                                            className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${selectedStudentId === row.student?.id ? "bg-indigo-50/70" : ""}`}
                                          >
                                            <td className="p-2.5 font-bold text-zinc-900">#{row.rank}</td>
                                            <td className="p-2.5">
                                              <div className="font-semibold text-zinc-900">{row.student?.full_name}</div>
                                              <div className="text-[10px] text-zinc-500 font-mono">{row.student?.student_id}</div>
                                            </td>
                                            <td className="p-2.5">{row.student?.class} - {row.student?.section}</td>
                                            <td className="p-2.5 font-semibold text-zinc-800">{row.total_obtained} / {row.total_max} ({row.percentage}%)</td>
                                            <td className="p-2.5"><span className="px-1.5 py-0.5 bg-zinc-100 rounded font-bold text-zinc-700 text-[10px]">{row.grade}</span></td>
                                            <td className="p-2.5 text-right">
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
                                {studentReportCard ? (
                                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                                    <div className="text-center space-y-1 border-b border-zinc-200 pb-2.5">
                                      <h4 className="font-bold text-xs text-zinc-900">{studentReportCard.school?.name}</h4>
                                      <div className="font-semibold text-zinc-700 text-xs">{studentReportCard.student?.full_name}</div>
                                      <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Class: {studentReportCard.student?.class}</div>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                      {studentReportCard.subjects?.map((sub) => (
                                        <div key={sub.subject} className="flex justify-between font-medium">
                                          <span className="capitalize text-zinc-700">{sub.subject}</span>
                                          <span className="font-semibold text-zinc-900">{sub.is_absent ? "AB" : `${sub.marks_obtained}/${sub.total_max}`}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-xl p-5 text-center text-zinc-400 font-medium text-xs">
                                    Select a student from standings to load report card.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {examSubTab === "subjectwise" && (
                            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                                  <tr>
                                    <th className="p-2.5">Subject Name</th>
                                    <th className="p-2.5">Class/Section</th>
                                    <th className="p-2.5">Average Score</th>
                                    <th className="p-2.5 text-right">Highest</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                  {examSubjectWise.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                      <td className="p-2.5 font-semibold text-zinc-900 capitalize">{row.subject}</td>
                                      <td className="p-2.5">{row.class} - {row.section}</td>
                                      <td className="p-2.5 font-semibold text-indigo-600">{row.average}%</td>
                                      <td className="p-2.5 font-semibold text-emerald-600 text-right">{row.highest}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "toppers" && (
                            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                                  <tr>
                                    <th className="p-2.5">Position</th>
                                    <th className="p-2.5">Student</th>
                                    <th className="p-2.5 text-right">Percentage</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                  {examToppers.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                      <td className="p-2.5 font-black text-amber-600">#{idx + 1}</td>
                                      <td className="p-2.5 font-semibold text-zinc-900">{row.student?.full_name}</td>
                                      <td className="p-2.5 font-semibold text-emerald-600 text-right">{row.percentage}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "fails" && (
                            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                                  <tr>
                                    <th className="p-2.5">Student Name</th>
                                    <th className="p-2.5">Marks</th>
                                    <th className="p-2.5 text-right">Grade</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                  {examFailList.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="p-4 text-center text-emerald-600 font-semibold">No students in fail list.</td>
                                    </tr>
                                  ) : (
                                    examFailList.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                        <td className="p-2.5 font-semibold text-rose-600">{row.student?.full_name}</td>
                                        <td className="p-2.5">{row.total_obtained} / {row.total_max}</td>
                                        <td className="p-2.5 text-right font-bold text-rose-600">{row.grade}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "merits" && (
                            <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                                  <tr>
                                    <th className="p-2.5">Rank</th>
                                    <th className="p-2.5">Student Name</th>
                                    <th className="p-2.5 text-right">Percentage Ratio</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                                  {examMeritList.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                      <td className="p-2.5 font-black text-indigo-600">#{idx + 1}</td>
                                      <td className="p-2.5 font-semibold text-zinc-900">{row.student?.full_name}</td>
                                      <td className="p-2.5 font-semibold text-emerald-600 text-right">{row.percentage}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- STAFF ATTENDANCE HISTORY LIST --- */}
                  {(activeReportItem?.label.includes("Staff Attendance History") || activeReportItem?.url?.includes("staff-attendance/history")) && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-zinc-50 p-3 border border-zinc-200 rounded-xl">
                        <span className="font-bold text-zinc-900 text-xs">Attendance Log History</span>
                      </div>

                      <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Staff Name</th>
                              <th className="p-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                            {staffHistory.map((row) => (
                              <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="p-2.5 font-semibold text-zinc-900">{row.date_label}</td>
                                <td className="p-2.5 text-zinc-800">{row.staff_name}</td>
                                <td className="p-2.5 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- FEE STRUCTURES ROSTER --- */}
                  {(activeReportItem?.label.includes("Fee Structures") || activeReportItem?.url?.includes("structures/report")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Structure Name</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5 text-right">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {feeStructures.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900">{row.name}</td>
                              <td className="p-2.5 font-semibold text-zinc-900">₹{(row.amount || 0).toLocaleString()}</td>
                              <td className="p-2.5 font-semibold text-rose-600 text-right">₹{(row.total_due || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- ONLINE PAYMENTS COLLECTION REPORT --- */}
                  {(activeReportItem?.label.includes("Online Collection") || activeReportItem?.url?.includes("online-payments")) && (
                    <div className="space-y-3">
                      {feePayments?.summary && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-bold">Total Collections</span>
                            <span className="text-sm font-black text-indigo-700 mt-1 block">₹{(feePayments.summary.total || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-emerald-700 block font-bold">Cash Modes</span>
                            <span className="text-sm font-black text-emerald-700 mt-1 block">₹{(feePayments.summary.cash_total || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-indigo-700 block font-bold">Online Gateway</span>
                            <span className="text-sm font-black text-indigo-700 mt-1 block">₹{(feePayments.summary.online_total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- CLASS STRENGTH --- */}
                  {(activeReportItem?.label.includes("Class Strength") || activeReportItem?.url?.includes("strength")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Class Name</th>
                            <th className="p-2.5 text-right">Total Students</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {classStrength.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900 capitalize">{row.name}</td>
                              <td className="p-2.5 font-semibold text-indigo-600 text-right">{row.students_count} students</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- CLASS ATTENDANCE --- */}
                  {(activeReportItem?.label.includes("Class Attendance Report") || activeReportItem?.url?.includes("reports/attendance")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Class Name</th>
                            <th className="p-2.5">Present</th>
                            <th className="p-2.5 text-right">Absent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {classAttendance.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900 capitalize">{row.class_name} ({row.section_name})</td>
                              <td className="p-2.5 text-emerald-600 font-semibold">{row.present}</td>
                              <td className="p-2.5 text-rose-600 text-right font-semibold">{row.absent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- TEACHER HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Teacher Homework") || activeReportItem?.url?.includes("homework/reports/teacher")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Teacher</th>
                            <th className="p-2.5">Employee ID</th>
                            <th className="p-2.5">Homeworks Assigned</th>
                            <th className="p-2.5">Submissions</th>
                            <th className="p-2.5 text-right">Graded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {homeworkTeacher.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900">{row.teacher?.full_name}</td>
                              <td className="p-2.5 text-zinc-600 font-mono">{row.teacher?.employee_id}</td>
                              <td className="p-2.5 font-semibold text-indigo-600">{row.homework_count} assigned</td>
                              <td className="p-2.5 font-semibold text-zinc-800">{row.submission_count}</td>
                              <td className="p-2.5 font-semibold text-emerald-600 text-right">{row.graded_count} graded</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- STUDENT HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Student Homework") || activeReportItem?.url?.includes("homework/reports/student")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Student Name</th>
                            <th className="p-2.5">Student ID</th>
                            <th className="p-2.5">Class/Section</th>
                            <th className="p-2.5">Assigned</th>
                            <th className="p-2.5">Submitted</th>
                            <th className="p-2.5">Pending</th>
                            <th className="p-2.5 text-right">Graded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {homeworkStudent.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900">{row.student?.full_name}</td>
                              <td className="p-2.5 text-zinc-600 font-mono">{row.student?.student_id} (Roll: {row.student?.roll_no})</td>
                              <td className="p-2.5 capitalize">{row.student?.class ? `${row.student.class} (${row.student.section})` : "—"}</td>
                              <td className="p-2.5 font-semibold text-zinc-900">{row.total_assigned}</td>
                              <td className="p-2.5 font-semibold text-emerald-600">{row.submitted}</td>
                              <td className="p-2.5 font-semibold text-rose-600">{row.pending}</td>
                              <td className="p-2.5 font-semibold text-indigo-600 text-right">{row.graded}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- CLASS HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Class Homework") || activeReportItem?.url?.includes("homework/reports/class")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Class Name</th>
                            <th className="p-2.5">Section</th>
                            <th className="p-2.5">Assigned Count</th>
                            <th className="p-2.5">Expected</th>
                            <th className="p-2.5">Submissions</th>
                            <th className="p-2.5 text-right">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {homeworkClass.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900 capitalize">{row.class?.name}</td>
                              <td className="p-2.5 font-semibold text-zinc-700 uppercase">{row.section?.name}</td>
                              <td className="p-2.5 font-semibold text-indigo-600">{row.homework_count} homeworks</td>
                              <td className="p-2.5">{row.expected} expected</td>
                              <td className="p-2.5 font-semibold text-emerald-600">{row.submissions} submissions</td>
                              <td className="p-2.5 text-right font-black text-indigo-600">{row.completion_rate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* --- MONTHLY HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Monthly Homework") || activeReportItem?.url?.includes("homework/reports/monthly")) && (
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Month Name</th>
                            <th className="p-2.5">Assigned Count</th>
                            <th className="p-2.5">Submissions</th>
                            <th className="p-2.5 text-right">Graded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                          {homeworkMonthly.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="p-2.5 font-semibold text-zinc-900">{row.label}</td>
                              <td className="p-2.5 font-semibold text-indigo-600">{row.homework_count} assignments</td>
                              <td className="p-2.5 font-semibold text-zinc-800">{row.submission_count}</td>
                              <td className="p-2.5 font-semibold text-emerald-600 text-right">{row.graded_count} graded</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Generic mapping check */}
                  {!["Exam Reports Overview", "Staff Attendance History", "Fee Structures Report", "Class Strength", "Class Attendance Report", "Student Transfer Report", "Subject Teachers", "Teacher Notes Report", "Class-wise Notes Report", "Subject-wise Notes Report", "Online Collection", "Teacher Homework", "Student Homework", "Class Homework", "Monthly Homework"].some(x => activeReportItem?.label.includes(x)) &&
                    !activeReportItem?.url?.includes("reports/teacher") &&
                    !activeReportItem?.url?.includes("reports/class") &&
                    !activeReportItem?.url?.includes("reports/subject") &&
                    !activeReportItem?.url?.includes("class-students") &&
                    !activeReportItem?.url?.includes("section-students") &&
                    activeReportItem?.feature !== "exams" && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-center text-zinc-500 font-medium space-y-2">
                        <FaNetworkWired className="w-7 h-7 mx-auto text-indigo-500 animate-pulse" />
                        <p>This report ({activeReportItem?.label}) is integrated successfully from:</p>
                        <code className="text-zinc-700 text-xs bg-zinc-200/60 px-2 py-1 rounded block select-all w-fit mx-auto">{activeReportItem?.url}</code>
                      </div>
                    )}

                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-zinc-100 bg-zinc-50 shrink-0 flex justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setShowSubReportModal(false)}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg font-bold text-xs text-zinc-700 cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}