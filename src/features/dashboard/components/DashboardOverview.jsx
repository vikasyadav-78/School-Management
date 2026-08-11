"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getChartData, getStudentList, getStaffList, getAttendanceHistory, getExamsList, getClassMarks } from "../services/dashboard.service";
import { 
  getTeacherFees, 
  getTeacherSubjects, 
  getTeacherManageNotices, 
  getAdminManageLeaves, 
  getTeacherManageHolidays,
  getTeacherTeachers
} from "@/features/admin/services/admin.service";
import DashboardStats from "./DashboardStats";
import DashboardCharts from "./DashboardCharts";
import DashboardStudentTable from "./DashboardStudentTable";
import DashboardWidgets from "./DashboardWidgets";
import PageLoader from "@/components/common/PageLoader";

// Import Async Thunks for Redux State Synchronization
import { fetchTeachersList } from "@/features/teachers/redux/teacherThunk";
import { fetchStudentsList, fetchStudentsMeta } from "@/features/students/redux/studentThunk";
import { getList } from "@/features/students/services/module.service";

// Import Selectors for Live Dashboard Calculations
import { selectTotalStudents } from "@/features/students/redux/studentSlice";

export default function DashboardOverview({ selectedMonth = "2026-08" }) {
  const dispatch = useDispatch();
  const [data, setData] = useState({ studentList: [] });
  const [staffCount, setStaffCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [feeStats, setFeeStats] = useState(null);
  const [examsCount, setExamsCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [newStudentsThisMonth, setNewStudentsThisMonth] = useState(0);
  const [toppersList, setToppersList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);
  const [incomeExpenseChartData, setIncomeExpenseChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retrieve dynamic statistics using Redux Selectors
  const totalStudents = useSelector(selectTotalStudents);

  // Calculate 8 stats cards (4 per row) dynamically
  const stats = [
    {
      id: 1,
      title: "Total Students",
      value: totalStudents ? totalStudents.toLocaleString() : "0",
      color: "violet"
    },
    {
      id: 2,
      title: "New Students",
      value: newStudentsThisMonth ? newStudentsThisMonth.toLocaleString() : "0",
      color: "sky"
    },
    {
      id: 3,
      title: "Teachers",
      value: teachersCount ? teachersCount.toLocaleString() : "0",
      color: "violet"
    },
    {
      id: 4,
      title: "Staff",
      value: staffCount ? staffCount.toLocaleString() : "0",
      color: "emerald"
    },
    {
      id: 5,
      title: "Present Today",
      value: attendanceStats?.stats?.present ? attendanceStats.stats.present.toLocaleString() : "0",
      color: "emerald"
    },
    {
      id: 6,
      title: "Absent Today",
      value: attendanceStats?.stats?.absent ? attendanceStats.stats.absent.toLocaleString() : "0",
      color: "sky"
    },
    {
      id: 7,
      title: "Fees Collection",
      value: `₹${(feeStats?.total_collected || feeStats?.paid || 0).toLocaleString()}`,
      color: "emerald"
    },
    {
      id: 8,
      title: "Total Subjects",
      value: subjectsCount ? subjectsCount.toLocaleString() : "0",
      color: "amber"
    }
  ];

  // 1. School Population Donut Chart Data (Totally Dynamic)
  const donutChartData = useMemo(() => [
    { name: "Teachers", value: teachersCount || 0 },
    { name: "Students", value: totalStudents || 0 },
    { name: "Staff", value: staffCount || 0 }
  ], [teachersCount, totalStudents, staffCount]);

  // 2. Attendance Overview Weekly Area Chart Data (Totally Dynamic)
  const areaChartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (!attendanceStats || !attendanceStats.records || attendanceStats.records.length === 0) {
      return days.map(d => ({ name: d, Present: 0, Late: 0 }));
    }
    return days.map((day, idx) => {
      const record = attendanceStats.records[idx];
      if (record) {
        const total = record.total || (record.present || 0) + (record.absent || 0) || 1;
        const presentPct = Math.round(((record.present || 0) / total) * 100);
        const latePct = Math.round(((record.late || 0) / total) * 100);
        return { name: day, Present: presentPct, Late: latePct };
      }
      return { name: day, Present: 0, Late: 0 };
    });
  }, [attendanceStats]);

  // Combine charts into single object
  const chartData = {
    barChart: performanceData,
    donutChart: donutChartData,
    areaChart: areaChartData
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Concurrently load all remaining features into Redux
      await Promise.allSettled([
        dispatch(fetchTeachersList()),
        dispatch(fetchStudentsList()),
        dispatch(fetchStudentsMeta())
      ]);

      // Load subjects count
      try {
        const subRes = await getTeacherSubjects();
        setSubjectsCount(subRes.count || subRes.subjects?.length || 0);
      } catch (e) {
        console.warn("Failed to load subjects count", e);
      }

      // Load teachers count from the correct admin API
      try {
        const teachersRes = await getTeacherTeachers();
        setTeachersCount(teachersRes.count || teachersRes.teachers?.length || teachersRes.data?.length || 0);
      } catch (e) {
        console.warn("Failed to load teachers count", e);
      }

      // Load staff count
      try {
        const staffRes = await getStaffList();
        setStaffCount(staffRes.count || staffRes.staff?.length || 0);
      } catch (e) {
        console.warn("Failed to load staff list", e);
      }

      // Load attendance history filtered by month
      try {
        const attendanceRes = await getAttendanceHistory({ month: selectedMonth });
        setAttendanceStats(attendanceRes);
      } catch (e) {
        console.warn("Failed to load attendance history", e);
      }

      // Load notices
      try {
        const noticesRes = await getTeacherManageNotices();
        const rawNotices = noticesRes.notices || noticesRes.data || noticesRes || [];
        setNoticesList(rawNotices.slice(0, 3));
      } catch (e) {
        console.warn("Failed to load notices", e);
      }

      // Load leaves
      try {
        const leavesRes = await getAdminManageLeaves({ status: "pending" });
        const rawLeaves = leavesRes.leaves || leavesRes.data || leavesRes || [];
        setLeavesList(rawLeaves.slice(0, 3));
      } catch (e) {
        console.warn("Failed to load leaves", e);
      }

      // Load holidays
      try {
        const holidaysRes = await getTeacherManageHolidays();
        const rawHolidays = holidaysRes.holidays || holidaysRes.data || holidaysRes || [];
        setHolidaysList(rawHolidays);
      } catch (e) {
        console.warn("Failed to load holidays", e);
      }

      // Load fees statistics and build Income vs Expense monthly chart data
      try {
        const feesRes = await getTeacherFees({ month: selectedMonth });
        const payments = feesRes.payments || feesRes.data || [];

        // Build monthly Collected vs Pending map
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCollectedMap = {};
        const monthlyPendingMap = {};

        payments.forEach(p => {
          if (p.due_date) {
            const dateObj = new Date(p.due_date);
            const monthName = dateObj.toLocaleString("en-US", { month: "short" });
            const amountVal = Number(p.amount) || 0;
            const paidVal = Number(p.paid_amount) || 0;
            const dueVal = Number(p.due_amount) || 0;

            if (p.status === "paid") {
              monthlyCollectedMap[monthName] = (monthlyCollectedMap[monthName] || 0) + paidVal;
            } else {
              monthlyCollectedMap[monthName] = (monthlyCollectedMap[monthName] || 0) + paidVal;
              monthlyPendingMap[monthName] = (monthlyPendingMap[monthName] || 0) + dueVal;
            }
          }
        });

        const incomeExpense = months.map(m => ({
          name: m,
          Collected: monthlyCollectedMap[m] || 0,
          Pending: monthlyPendingMap[m] || 0
        }));
        setIncomeExpenseChartData(incomeExpense);

        // Frontend fallback month-wise calculations
        const monthlyPayments = payments.filter(p => p.due_date && p.due_date.startsWith(selectedMonth));
        if (monthlyPayments.length > 0) {
          const totalPaid = monthlyPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.paid_amount || p.amount || 0), 0);
          const pendingCount = monthlyPayments.filter(p => p.status === "pending" || p.status === "partial").length;
          const totalDue = monthlyPayments.filter(p => p.status === "pending" || p.status === "partial").reduce((sum, p) => sum + (p.due_amount || 0), 0);
          setFeeStats({
            total_collected: totalPaid,
            paid: totalPaid,
            pending_count: pendingCount,
            total_due: totalDue,
            due: totalDue
          });
        } else {
          setFeeStats(feesRes.stats || null);
        }
      } catch (e) {
        console.warn("Failed to load fees stats", e);
      }

      // Load student performance data dynamically from exam schedules and marks
      try {
        const examsRes = await getExamsList();
        const activeExams = examsRes.exams || [];
        
        // Count exams this month/week
        const monthlyExams = activeExams.filter(e => e.start_date && e.start_date.startsWith(selectedMonth));
        setExamsCount(monthlyExams.length);

        if (activeExams.length > 0) {
          const activeExam = monthlyExams[0] || activeExams[0];
          const classesToFetch = (activeExam.classes || []).slice(0, 5);
          let allToppers = [];
          
          const performanceRows = await Promise.all(
            classesToFetch.map(async (cls) => {
              try {
                const marksRoster = await getClassMarks(activeExam.id, cls.school_class_id, cls.section_id);
                const schedules = marksRoster.schedules || [];
                const students = marksRoster.students || [];

                const classRow = { name: cls.class_name };

                students.forEach((stu) => {
                  let totalObtained = 0;
                  schedules.forEach((sch) => {
                    const entry = stu.marks?.[sch.id];
                    if (entry && !entry.is_absent) {
                      totalObtained += (Number(entry.theory_marks) || 0) + (Number(entry.practical_marks) || 0) + (Number(entry.internal_marks) || 0);
                    }
                  });
                  const fullName = stu.full_name || [stu.first_name, stu.last_name].filter(Boolean).join(" ") || stu.name || "Student";
                  allToppers.push({
                    roll_no: stu.roll_no || "—",
                    name: fullName,
                    class_name: cls.class_name,
                    score: totalObtained,
                    status: "Active"
                  });
                });

                schedules.forEach((sch) => {
                  let totalScore = 0;
                  let scoreCount = 0;

                  students.forEach((stu) => {
                    const markEntry = stu.marks?.[sch.id];
                    if (markEntry && !markEntry.is_absent) {
                      const theory = Number(markEntry.theory_marks) || 0;
                      const practical = Number(markEntry.practical_marks) || 0;
                      const internal = Number(markEntry.internal_marks) || 0;
                      
                      totalScore += (theory + practical + internal);
                      scoreCount++;
                    }
                  });

                  const maxSubjectMarks = sch.total_max || 100;
                  const avgScore = scoreCount > 0 ? (totalScore / scoreCount) : 0;
                  const percentage = Math.round((avgScore / maxSubjectMarks) * 100);

                  classRow[sch.subject] = percentage;
                });

                return classRow;
              } catch (e) {
                console.error(`Failed to load marks for class ${cls.class_name}`, e);
                return { name: cls.class_name };
              }
            })
          );

          setPerformanceData(performanceRows.filter(Boolean));
          allToppers.sort((a, b) => b.score - a.score);
          setToppersList(allToppers.slice(0, 5));
        } else {
          setPerformanceData([]);
          setToppersList([]);
        }
      } catch (e) {
        console.warn("Failed to load exam performance charts", e);
        setPerformanceData([]);
        setToppersList([]);
      }

      // Load dynamic student list and calculate new students added this month
      let studentListData = [];
      try {
        const mainStudentsRes = await getList({ per_page: 200 });
        const allStudents = mainStudentsRes.students || mainStudentsRes.data?.students || mainStudentsRes.data || [];
        
        // Sort students by admission_date or created_at descending (newest first)
        const sortedStudents = [...allStudents].sort((a, b) => {
          const dateA = new Date(a.admission_date || a.created_at || 0);
          const dateB = new Date(b.admission_date || b.created_at || 0);
          return dateB - dateA;
        });

        const [selYear, selMonth] = selectedMonth.split("-").map(Number);
        const targetMonthIndex = selMonth - 1;

        // Filter students admitted/created in the selected month
        const monthlyStudents = sortedStudents.filter(s => {
          const date = s.created_at ? new Date(s.created_at) : s.admission_date ? new Date(s.admission_date) : null;
          return date && date.getMonth() === targetMonthIndex && date.getFullYear() === selYear;
        });

        // Match columns structure in Screenshot 2:
        // No, Name, Class, Date Of Admit, Status, Edit
        studentListData = monthlyStudents.slice(0, 5).map((s, idx) => {
          const fullName = s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || s.name || "Student";
          return {
            no: String(idx + 1).padStart(2, "0"),
            id: s.id,
            name: fullName,
            class_name: s.class || s.class_name || "Class 1",
            admission_date: s.admission_date || s.created_at ? new Date(s.admission_date || s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "10 August 2026",
            status: s.status || "Checkin",
            photo_url: s.photo_url || s.photo || s.avatar || null
          };
        });

        const newStudentsCount = allStudents.filter(s => {
          const date = s.created_at ? new Date(s.created_at) : s.admission_date ? new Date(s.admission_date) : null;
          return date && date.getMonth() === targetMonthIndex && date.getFullYear() === selYear;
        }).length;
        setNewStudentsThisMonth(newStudentsCount);
      } catch (err) {
        console.error("Main students list fetch failed", err);
      }

      setData({
        studentList: studentListData
      });
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  }, [dispatch, selectedMonth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData, selectedMonth]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* 1. Statistics Row */}
      <DashboardStats stats={stats} />

      {/* 2. Visual Charts Row */}
      <DashboardCharts chartData={chartData} />

      {/* 3. Side-by-side Tables (Exam Toppers & New Admissions List) */}
      <DashboardStudentTable students={data.studentList} toppers={toppersList} />

      {/* 4. Side-by-side Widgets (Income vs Expense, Notices, Leaves, Events Calendar) */}
      <DashboardWidgets 
        incomeExpenseData={incomeExpenseChartData}
        notices={noticesList}
        leaves={leavesList}
        holidays={holidaysList}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
