"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaCalendarCheck, FaChalkboard, FaFileAlt, FaBook, FaStickyNote, 
  FaMoneyBillWave, FaBus, FaVideo, FaFileSignature, FaUserTie,
  FaArrowRight, FaTimes, FaGraduationCap, FaNetworkWired, FaCheckCircle,
  FaCalendarAlt, FaFileSpreadsheet, FaTrophy, FaUserTimes, FaAward, FaSearch,
  FaHistory, FaClipboardList, FaFileInvoiceDollar, FaRegCreditCard, FaUserGraduate
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
      setExamsList(examsRes.exams || []);
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

  // Fetch individual sub-report dynamic details
  const handleOpenSubReport = async (item) => {
    setActiveReportItem(item);
    setShowSubReportModal(true);
    setSubReportLoading(true);
    
    // Clear sub report specific state
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
      } else if (item.label.includes("Staff Attendance History") || item.url.includes("staff-attendance/history")) {
        const res = await getTeacherReportsStaffAttendanceHistory({ month: staffHistoryMonth });
        setStaffHistory(res.records || []);
      } else if (item.label.includes("Staff Attendance") || item.url.includes("staff-attendance")) {
        const res = await getTeacherReportsStaffAttendance();
        setStaffRoster(res.staff || []);
      } else if (item.label.includes("Fee Structures") || item.url.includes("structures/report")) {
        const res = await getTeacherFeeStructuresReport();
        setFeeStructures(res.report || []);
      } else if (item.label.includes("Online Collection") || item.url.includes("online-payments")) {
        const res = await getTeacherFeeOnlinePaymentsReport({ payment_mode: "online" });
        setFeePayments(res);
      } else if (item.label.includes("Class Strength") || item.url.includes("strength")) {
        const res = await getTeacherClassReportsStrength();
        setClassStrength(res.rows || []);
      } else if (item.label.includes("Class-wise Students") || item.url.includes("class-students")) {
        const res = await getTeacherClassReportsClassStudents();
        setClassStudents(res.students || []);
      } else if (item.label.includes("Section-wise Students") || item.url.includes("section-students")) {
        const res = await getTeacherClassReportsSectionStudents();
        setSectionStudents(res.students || []);
      } else if (item.label.includes("Class Attendance Report") || item.url.includes("reports/attendance")) {
        const res = await getTeacherClassReportsAttendance({ month: classAttendanceMonth });
        setClassAttendance(res.rows || []);
      } else if (item.label.includes("Subject Teachers") || item.url.includes("subject-teachers")) {
        const res = await getTeacherClassReportsSubjectTeachers();
        setSubjectTeachers(res.rows || []);
      } else if (item.label.includes("Student Transfer") || item.url.includes("transfers")) {
        const res = await getTeacherClassReportsTransfers();
        setStudentTransfers(res.transfers || []);
      } else if (item.label.includes("Teacher Notes") || item.url.includes("reports/teacher")) {
        const res = await getTeacherClassNotesReportTeacher();
        setNotesTeacher(res.rows || []);
      } else if (item.label.includes("Class-wise Notes") || item.url.includes("reports/class")) {
        const res = await getTeacherClassNotesReportClass();
        setNotesClass(res.rows || []);
      } else if (item.label.includes("Subject-wise Notes") || item.url.includes("reports/subject")) {
        const res = await getTeacherClassNotesReportSubject();
        setNotesSubject(res.rows || []);
      } else if (item.label.includes("Teacher Homework") || item.url.includes("homework/reports/teacher")) {
        const res = await getTeacherHomeworkReportTeacher({ month: homeworkMonth });
        setHomeworkTeacher(res.rows || []);
      } else if (item.label.includes("Student Homework") || item.url.includes("homework/reports/student")) {
        const res = await getTeacherHomeworkReportStudent();
        setHomeworkStudent(res.rows || []);
      } else if (item.label.includes("Class Homework") || item.url.includes("homework/reports/class")) {
        const res = await getTeacherHomeworkReportClass();
        setHomeworkClass(res.rows || []);
      } else if (item.label.includes("Monthly Homework") || item.url.includes("homework/reports/monthly")) {
        const res = await getTeacherHomeworkReportMonthly({ year: homeworkYear });
        setHomeworkMonthly(res.rows || []);
      }
    } catch (err) {
      toast.error("Failed to load report data: " + (err.message || err));
    } finally {
      setSubReportLoading(false);
    }
  };

  const handleExamSelect = async (examId) => {
    if (!examId) return;
    setSelectedExamId(examId);
    setSubReportLoading(true);
    try {
      const overview = await getTeacherReportsExamOverview(examId);
      setExamOverview(overview.overview || null);

      const classWise = await getTeacherReportsExamClassWise(examId);
      const rows = classWise.report || [];
      setExamClassWise(rows);

      const subWise = await getTeacherReportsExamSubjectWise(examId);
      setExamSubjectWise(subWise.report || []);

      const toppers = await getTeacherReportsExamToppers(examId);
      setExamToppers(toppers.toppers || []);

      const fails = await getTeacherReportsExamFailList(examId);
      setExamFailList(fails.students || []);

      const merits = await getTeacherReportsExamMeritList(examId);
      setExamMeritList(merits.students || []);
      
      if (rows.length > 0) {
        handleLoadReportCard(examId, rows[0].student.id);
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
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-3xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
            <FaTimes className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-500 font-bold leading-relaxed mt-2">
            Reports Dashboard is not enabled for your account or requires higher teacher administrative access tokens.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[450px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  const stats = reportsData?.stats || {};
  const charts = reportsData?.charts || {};
  const groups = reportsData?.groups || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        
        {/* Page Header */}
        <PageHeader 
          title="Reports & Insights Console"
          subtitle="Analyze school-wide academics, fee collection records, exam statistics, and staff metrics."
        />

        {/* Stats Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Students</span>
            <span className="text-lg font-black text-zinc-800 block">{stats.students || 0}</span>
            <span className="text-[9px] text-zinc-400 font-bold block">In {stats.classes || 0} Classes</span>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Teachers</span>
            <span className="text-lg font-black text-zinc-800 block">{stats.teachers || 0}</span>
            <span className="text-[9px] text-zinc-400 font-bold block">Total Staff: {stats.staff || 0}</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Fees Collected</span>
            <span className="text-lg font-black text-emerald-600 block">₹{(stats.fee_collected || 0).toLocaleString()}</span>
            <span className="text-[9px] text-rose-500 font-bold block">Due: ₹{(stats.fee_due || 0).toLocaleString()}</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Monthly Attendance</span>
            <span className="text-lg font-black text-zinc-800 block">{stats.attendance_month || 0}</span>
            <span className="text-[9px] text-zinc-400 font-bold block">Logs recorded this month</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pending Leaves</span>
            <span className="text-lg font-black text-zinc-800 block">{stats.leave_pending || 0}</span>
            <span className="text-[9px] text-emerald-600 font-bold block">Approved: {stats.leave_approved || 0}</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-1 col-span-2 md:col-span-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Homework Assigned</span>
            <span className="text-lg font-black text-zinc-800 block">{stats.homework || 0}</span>
            <span className="text-[9px] text-zinc-400 font-bold block">Active homework modules</span>
          </div>
        </div>

        {/* Visual Charts & Meters (Custom CSS responsive displays) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Fee collection progress meter */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
              <h3 className="font-extrabold text-zinc-800 text-[11px] uppercase tracking-wider">Fee Collection Overview</h3>
              <span className="text-[10px] font-bold text-zinc-400">Total: ₹{((stats.fee_collected || 0) + (stats.fee_due || 0)).toLocaleString()}</span>
            </div>
            
            <div className="space-y-3 py-1">
              <div className="flex justify-between font-bold text-[10px]">
                <span className="text-emerald-600">Collected (₹{(stats.fee_collected || 0).toLocaleString()})</span>
                <span className="text-rose-500">Dues Pending (₹{(stats.fee_due || 0).toLocaleString()})</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${((stats.fee_collected || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100}%` }}
                />
                <div 
                  className="bg-rose-500 h-full" 
                  style={{ width: `${((stats.fee_due || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-zinc-500">
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                  <span className="block text-[8px] uppercase tracking-wider text-emerald-700 font-bold">Payments Cleared</span>
                  <span className="text-sm font-black text-emerald-800 mt-1 block">
                    {Math.round(((stats.fee_collected || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100)}%
                  </span>
                </div>
                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/50">
                  <span className="block text-[8px] uppercase tracking-wider text-rose-700 font-bold">Outstanding Dues</span>
                  <span className="text-sm font-black text-rose-800 mt-1 block">
                    {Math.round(((stats.fee_due || 0) / ((stats.fee_collected || 0) + (stats.fee_due || 0) || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student distribution per class meter */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="font-extrabold text-zinc-800 text-[11px] uppercase tracking-wider">Student Roster Strength</h3>
            </div>
            
            <div className="space-y-2.5 py-1">
              {charts.students?.labels?.map((label, idx) => {
                const count = charts.students.data[idx];
                const max = Math.max(...charts.students.data, 1);
                const percent = (count / max) * 100;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between font-bold text-[10px]">
                      <span className="text-zinc-700 capitalize">{label}</span>
                      <span className="text-zinc-500">{count} students</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaves Status overview */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
              <h3 className="font-extrabold text-zinc-800 text-[11px] uppercase tracking-wider">Leave Applications</h3>
              <span className="bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded text-[8px] font-extrabold border border-zinc-200">
                Total: {stats.leave_total || 0}
              </span>
            </div>

            <div className="space-y-3.5 py-1">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-sm font-black text-amber-700 block">{stats.leave_pending || 0}</span>
                  <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider mt-0.5 block">Pending</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-sm font-black text-emerald-700 block">{stats.leave_approved || 0}</span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5 block">Approved</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-sm font-black text-rose-700 block">{stats.leave_rejected || 0}</span>
                  <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider mt-0.5 block">Rejected</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 font-semibold text-[10px] text-zinc-500">
                <div className="flex justify-between">
                  <span>Student Leave applications</span>
                  <span className="text-zinc-800 font-bold">{stats.leave_student || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teacher/Staff Leave applications</span>
                  <span className="text-zinc-800 font-bold">{stats.leave_teacher || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leave requests submitted this month</span>
                  <span className="text-zinc-800 font-bold">{stats.leave_this_month || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Groups & Directories List */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-black text-zinc-800">Reports Library</h2>
            <p className="text-[10px] text-zinc-450 mt-0.5 font-medium">Select a report module to view lists, audit registries, or download charts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((grp) => (
              <div key={grp.group} className="space-y-3">
                <div className="flex items-center gap-2 font-black text-zinc-800 border-b border-zinc-100 pb-2">
                  {getIconForGroup(grp.group)}
                  <span className="uppercase text-[9px] tracking-wider font-extrabold">{grp.group}</span>
                </div>
                
                <div className="space-y-2">
                  {grp.items.map((item) => (
                    <div 
                      key={item.label} 
                      onClick={() => handleOpenSubReport(item)}
                      className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-indigo-50 border border-zinc-200/60 hover:border-indigo-150 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-700 group-hover:text-indigo-800 text-[11px] block">{item.label}</span>
                        <span className="text-[8px] text-zinc-400 group-hover:text-indigo-500 uppercase tracking-wider font-semibold">Scope: {item.feature}</span>
                      </div>
                      <div className="w-5 h-5 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 transition-colors">
                        <FaArrowRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- REPORTS DETAIL MODAL OVERLAY --- */}
      {showSubReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col text-xs text-left animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 shrink-0">
              <div>
                <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wider block">Reports Hub Console</span>
                <h2 className="text-sm font-black text-zinc-800 mt-1">{activeReportItem?.label || "Report Details"}</h2>
              </div>
              <button 
                onClick={() => setShowSubReportModal(false)}
                className="w-7 h-7 bg-zinc-100 hover:bg-zinc-250 border border-zinc-200 text-zinc-500 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto grow space-y-6">
              
              {subReportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <PageLoader />
                </div>
              ) : (
                <>
                  {/* --- EXAM REPORTS OVERVIEW INSIGHTS --- */}
                  {(activeReportItem?.label.includes("Exam Reports") || activeReportItem?.feature === "exams") && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-zinc-50 p-4 border border-zinc-200 rounded-2xl">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Select Active Exam</label>
                          <select 
                            value={selectedExamId}
                            onChange={(e) => handleExamSelect(e.target.value)}
                            className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-800 outline-none font-bold"
                          >
                            <option value="">-- Choose Exam --</option>
                            {examsList.map((ex) => (
                              <option key={ex.id} value={ex.id}>{ex.name} ({ex.type_label})</option>
                            ))}
                          </select>
                        </div>

                        {examOverview && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto font-bold text-[10px]">
                            <div className="bg-white p-2.5 border border-zinc-200 rounded-xl text-center">
                              <span className="text-zinc-400 uppercase text-[8px] block">Students Graded</span>
                              <span className="text-zinc-800 text-sm font-black mt-0.5 block">{examOverview.students_with_marks}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-zinc-200 rounded-xl text-center">
                              <span className="text-emerald-600 uppercase text-[8px] block">Passed</span>
                              <span className="text-emerald-700 text-sm font-black mt-0.5 block">{examOverview.passed}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-zinc-200 rounded-xl text-center">
                              <span className="text-rose-500 uppercase text-[8px] block">Failed</span>
                              <span className="text-rose-600 text-sm font-black mt-0.5 block">{examOverview.failed}</span>
                            </div>
                            <div className="bg-white p-2.5 border border-zinc-200 rounded-xl text-center">
                              <span className="text-indigo-600 uppercase text-[8px] block">Avg Score</span>
                              <span className="text-indigo-700 text-sm font-black mt-0.5 block">{examOverview.average_percentage}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedExamId && (
                        <div className="space-y-4">
                          <div className="flex border-b border-zinc-200">
                            <button 
                              onClick={() => setExamSubTab("classwise")}
                              className={`px-4 py-2 border-b-2 font-black uppercase text-[9px] tracking-wider transition-colors ${examSubTab === "classwise" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaGraduationCap className="inline mr-1" /> Class Standings
                            </button>
                            <button 
                              onClick={() => setExamSubTab("subjectwise")}
                              className={`px-4 py-2 border-b-2 font-black uppercase text-[9px] tracking-wider transition-colors ${examSubTab === "subjectwise" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaBook className="inline mr-1" /> Subject Performance
                            </button>
                            <button 
                              onClick={() => setExamSubTab("toppers")}
                              className={`px-4 py-2 border-b-2 font-black uppercase text-[9px] tracking-wider transition-colors ${examSubTab === "toppers" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaTrophy className="inline mr-1" /> Toppers
                            </button>
                            <button 
                              onClick={() => setExamSubTab("fails")}
                              className={`px-4 py-2 border-b-2 font-black uppercase text-[9px] tracking-wider transition-colors ${examSubTab === "fails" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaUserTimes className="inline mr-1" /> Fail List
                            </button>
                            <button 
                              onClick={() => setExamSubTab("merits")}
                              className={`px-4 py-2 border-b-2 font-black uppercase text-[9px] tracking-wider transition-colors ${examSubTab === "merits" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
                            >
                              <FaAward className="inline mr-1" /> Merit List
                            </button>
                          </div>

                          {examSubTab === "classwise" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 space-y-3">
                                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                                  <table className="w-full text-[11px] text-left">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                                      <tr>
                                        <th className="p-3">Rank</th>
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Class/Section</th>
                                        <th className="p-3">Marks</th>
                                        <th className="p-3">Grade</th>
                                        <th className="p-3 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                                      {examClassWise.length === 0 ? (
                                        <tr>
                                          <td colSpan={6} className="p-4 text-center text-zinc-400">No student standings recorded.</td>
                                        </tr>
                                      ) : (
                                        examClassWise.map((row) => (
                                          <tr 
                                            key={row.student.id} 
                                            onClick={() => handleLoadReportCard(selectedExamId, row.student.id)}
                                            className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${selectedStudentId === row.student.id ? "bg-indigo-50/70" : ""}`}
                                          >
                                            <td className="p-3 font-extrabold text-zinc-855">#{row.rank}</td>
                                            <td className="p-3">
                                              <div className="font-bold text-zinc-800">{row.student.full_name}</div>
                                              <div className="text-[9px] text-zinc-450">{row.student.student_id}</div>
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
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {studentReportCard ? (
                                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                                    <div className="text-center space-y-1.5 border-b border-zinc-200/60 pb-3">
                                      <h4 className="font-black text-sm text-zinc-800">{studentReportCard.school?.name}</h4>
                                      <div className="font-bold text-zinc-650 text-[11px]">{studentReportCard.student?.full_name}</div>
                                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Class: {studentReportCard.student?.class}</div>
                                    </div>
                                    <div className="space-y-2">
                                      {studentReportCard.subjects?.map((sub) => (
                                        <div key={sub.subject} className="flex justify-between font-medium">
                                          <span className="capitalize">{sub.subject}</span>
                                          <span className="font-bold">{sub.is_absent ? "AB" : `${sub.marks_obtained}/${sub.total_max}`}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl p-6 text-center text-zinc-450 font-bold">
                                    Select a student from standings to load report card.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {examSubTab === "subjectwise" && (
                            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                              <table className="w-full text-[11px] text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                                  <tr>
                                    <th className="p-3">Subject Name</th>
                                    <th className="p-3">Class/Section</th>
                                    <th className="p-3">Average Score</th>
                                    <th className="p-3 text-right">Highest</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-655">
                                  {examSubjectWise.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/50">
                                      <td className="p-3 font-bold text-zinc-850 capitalize">{row.subject}</td>
                                      <td className="p-3">{row.class} - {row.section}</td>
                                      <td className="p-3 font-bold text-indigo-600">{row.average}%</td>
                                      <td className="p-3 font-bold text-emerald-600 text-right">{row.highest}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "toppers" && (
                            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                              <table className="w-full text-[11px] text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                                  <tr>
                                    <th className="p-3">Position</th>
                                    <th className="p-3">Student</th>
                                    <th className="p-3 text-right">Percentage</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                                  {examToppers.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/50">
                                      <td className="p-3 font-black text-amber-600">#{idx + 1}</td>
                                      <td className="p-3 font-bold text-zinc-800">{row.student?.full_name}</td>
                                      <td className="p-3 font-bold text-emerald-600 text-right">{row.percentage}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "fails" && (
                            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                              <table className="w-full text-[11px] text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                                  <tr>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3">Marks</th>
                                    <th className="p-3 text-right">Grade</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                                  {examFailList.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="p-4 text-center text-emerald-600 font-bold">No students in fail list.</td>
                                    </tr>
                                  ) : (
                                    examFailList.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-zinc-50/50">
                                        <td className="p-3 font-bold text-rose-600">{row.student?.full_name}</td>
                                        <td className="p-3">{row.total_obtained} / {row.total_max}</td>
                                        <td className="p-3 text-right font-black text-rose-650">{row.grade}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {examSubTab === "merits" && (
                            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                              <table className="w-full text-[11px] text-left">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                                  <tr>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3 text-right">Percentage Ratio</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                                  {examMeritList.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/50">
                                      <td className="p-3 font-black text-indigo-605">#{idx + 1}</td>
                                      <td className="p-3 font-bold text-zinc-800">{row.student?.full_name}</td>
                                      <td className="p-3 font-black text-emerald-600 text-right">{row.percentage}%</td>
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
                  {(activeReportItem?.label.includes("Staff Attendance History") || activeReportItem?.url.includes("staff-attendance/history")) && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-200 rounded-2xl">
                        <span className="font-extrabold text-zinc-805">Attendance Log History</span>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Staff Name</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {staffHistory.map((row) => (
                              <tr key={row.id} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800">{row.date_label}</td>
                                <td className="p-3 font-bold text-zinc-800">{row.staff_name}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${row.status === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
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
                  {(activeReportItem?.label.includes("Fee Structures") || activeReportItem?.url.includes("structures/report")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Structure Name</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3 text-right">Outstanding</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-655">
                            {feeStructures.map((row) => (
                              <tr key={row.id} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800">{row.name}</td>
                                <td className="p-3 font-bold text-zinc-800">₹{(row.amount || 0).toLocaleString()}</td>
                                <td className="p-3 font-bold text-rose-500 text-right">₹{(row.total_due || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- ONLINE PAYMENTS COLLECTION REPORT --- */}
                  {(activeReportItem?.label.includes("Online Collection") || activeReportItem?.url.includes("online-payments")) && (
                    <div className="space-y-4">
                      {feePayments?.summary && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-bold">Total Collections</span>
                            <span className="text-base font-black text-indigo-755 mt-1 block">₹{(feePayments.summary.total || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-emerald-600 block font-bold">Cash Modes</span>
                            <span className="text-base font-black text-emerald-700 mt-1 block">₹{(feePayments.summary.cash_total || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-indigo-600 block font-bold">Online Gateway</span>
                            <span className="text-base font-black text-indigo-705 mt-1 block">₹{(feePayments.summary.online_total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- CLASS STRENGTH --- */}
                  {(activeReportItem?.label.includes("Class Strength") || activeReportItem?.url.includes("strength")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class Name</th>
                              <th className="p-3 text-right">Total Students</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {classStrength.map((row) => (
                              <tr key={row.id} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-850 capitalize">{row.name}</td>
                                <td className="p-3 font-bold text-indigo-600 text-right">{row.students_count} students</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- CLASS ATTENDANCE --- */}
                  {(activeReportItem?.label.includes("Class Attendance Report") || activeReportItem?.url.includes("reports/attendance")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class Name</th>
                              <th className="p-3">Present</th>
                              <th className="p-3 text-right">Absent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-655">
                            {classAttendance.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800 capitalize">{row.class_name} ({row.section_name})</td>
                                <td className="p-3 text-emerald-600 font-bold">{row.present}</td>
                                <td className="p-3 text-rose-500 text-right font-bold">{row.absent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- TEACHER HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Teacher Homework") || activeReportItem?.url.includes("homework/reports/teacher")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Teacher</th>
                              <th className="p-3">Employee ID</th>
                              <th className="p-3">Homeworks Assigned</th>
                              <th className="p-3">Submissions</th>
                              <th className="p-3 text-right">Graded</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-655">
                            {homeworkTeacher.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800">{row.teacher?.full_name}</td>
                                <td className="p-3">{row.teacher?.employee_id}</td>
                                <td className="p-3 font-bold text-indigo-600">{row.homework_count} assigned</td>
                                <td className="p-3 font-bold text-zinc-600">{row.submission_count}</td>
                                <td className="p-3 font-bold text-emerald-600 text-right">{row.graded_count} graded</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- STUDENT HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Student Homework") || activeReportItem?.url.includes("homework/reports/student")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
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
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-655">
                            {homeworkStudent.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800">{row.student?.full_name}</td>
                                <td className="p-3">{row.student?.student_id} (Roll: {row.student?.roll_no})</td>
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
                    </div>
                  )}

                  {/* --- CLASS HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Class Homework") || activeReportItem?.url.includes("homework/reports/class")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class Name</th>
                              <th className="p-3">Section</th>
                              <th className="p-3">Assigned Count</th>
                              <th className="p-3">Expected</th>
                              <th className="p-3">Submissions</th>
                              <th className="p-3 text-right">Completion Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {homeworkClass.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800 capitalize">{row.class?.name}</td>
                                <td className="p-3 font-bold text-zinc-700 uppercase">{row.section?.name}</td>
                                <td className="p-3 font-bold text-indigo-650">{row.homework_count} homeworks</td>
                                <td className="p-3">{row.expected} expected</td>
                                <td className="p-3 font-bold text-emerald-600">{row.submissions} submissions</td>
                                <td className="p-3 text-right font-black text-indigo-605">{row.completion_rate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- MONTHLY HOMEWORK REPORT --- */}
                  {(activeReportItem?.label.includes("Monthly Homework") || activeReportItem?.url.includes("homework/reports/monthly")) && (
                    <div className="space-y-4">
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Month Name</th>
                              <th className="p-3">Assigned Count</th>
                              <th className="p-3">Submissions</th>
                              <th className="p-3 text-right">Graded</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {homeworkMonthly.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3 font-bold text-zinc-800">{row.label}</td>
                                <td className="p-3 font-bold text-indigo-600">{row.homework_count} assignments</td>
                                <td className="p-3 font-bold text-zinc-700">{row.submission_count}</td>
                                <td className="p-3 font-bold text-emerald-600 text-right">{row.graded_count} graded</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Generic mapping check */}
                  {!["Exam Reports Overview", "Staff Attendance History", "Fee Structures Report", "Class Strength", "Class Attendance Report", "Student Transfer Report", "Subject Teachers", "Teacher Notes Report", "Class-wise Notes Report", "Subject-wise Notes Report", "Online Collection", "Teacher Homework", "Student Homework", "Class Homework", "Monthly Homework"].some(x => activeReportItem?.label.includes(x)) && 
                   !activeReportItem?.url.includes("reports/teacher") && 
                   !activeReportItem?.url.includes("reports/class") && 
                   !activeReportItem?.url.includes("reports/subject") && 
                   !activeReportItem?.url.includes("class-students") && 
                   !activeReportItem?.url.includes("section-students") && 
                   activeReportItem?.feature !== "exams" && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 font-bold space-y-2">
                      <FaNetworkWired className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
                      <p>This report ({activeReportItem?.label}) is integrated successfully from:</p>
                      <code className="text-zinc-600 text-[10px] bg-zinc-200/50 px-2 py-1 rounded block select-all w-fit mx-auto">{activeReportItem?.url}</code>
                    </div>
                  )}

                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-100 bg-zinc-50 shrink-0 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setShowSubReportModal(false)}
                className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-250 rounded-xl font-bold text-zinc-700 cursor-pointer transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
