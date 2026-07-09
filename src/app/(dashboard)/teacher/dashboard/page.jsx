"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaUserGraduate, FaCalendarCheck, FaChalkboardTeacher, 
  FaMoneyBillWave, FaArrowRight, FaCalendarAlt, FaAward
} from "react-icons/fa";
import { MdOutlineClass, MdNotificationsActive } from "react-icons/md";
import { 
  fetchTeacherProfile, 
  fetchTeacherAttendanceClasses, 
  fetchTeacherMyAttendance 
} from "@/features/teachers/redux/teacherThunk";
import { fetchStudentsByClass } from "@/features/students/redux/studentThunk";

export default function TeacherDashboardPage() {
  const dispatch = useDispatch();
  
  const { profile, classes, myAttendance, loading: teachersLoading } = useSelector((state) => state.teachers);
  const studentsList = useSelector((state) => state.students.list) || [];
  const studentsLoading = useSelector((state) => state.students.loading);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherAttendanceClasses());
    dispatch(fetchTeacherMyAttendance());
  }, [dispatch]);

  useEffect(() => {
    if (classes && classes.length > 0) {
      const className = classes[0].name || classes[0].class_name;
      dispatch(fetchStudentsByClass(className));
    }
  }, [dispatch, classes]);

  if (teachersLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const teacher = profile.teacher || {};
  const stats = myAttendance?.stats || {};
  const salaryPreview = myAttendance?.salary_preview || {};
  const activeClass = classes[0] || {};
  const activeSection = activeClass.sections?.[0]?.name || activeClass.sections?.[0] || "A";

  // Common styles
  const cardBgClass = "bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group";

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={`Welcome back, ${teacher.full_name || profile.name}!`}
        subtitle={`Faculty Member • Department of ${teacher.specialization || "Computer"} • Assigned to Class ${activeClass.name || activeClass.class_name || "10"}-${activeSection}`}
      />

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1 */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
              <FaUserGraduate className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Class Students</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {studentsLoading ? "..." : studentsList.length}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Class {activeClass.name || activeClass.class_name || "10"}-{activeSection} Roster</span>
            <Link href="/teacher/students" className="text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              View All <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <MdOutlineClass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Teaching Subject</p>
              <h3 className="text-base sm:text-lg font-bold text-zinc-800 mt-1.5">{teacher.specialization || "Computer Science"}</h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Dept: {teacher.specialization || "Computer"}</span>
            <Link href="/teacher/timetable" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Schedule <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <FaCalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Class Attendance</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {stats.total_days > 0 ? Math.round((stats.present / stats.total_days) * 100) : 86}%
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Last marked: {myAttendance?.records?.[0]?.date || "2026-07-01"}</span>
            <Link href="/teacher/attendance" className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Mark Sheet <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Basic Salary</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                ₹{(salaryPreview.monthly_salary || 42000).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Gross Est: ₹{(salaryPreview.gross_salary || 50000).toLocaleString()}</span>
            <Link href="/teacher/salary" className="text-amber-600 hover:text-amber-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Ledger <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Class schedule and info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" /> Today's Period Schedule
              </h3>
              <Link href="/teacher/timetable" className="text-xs text-violet-600 hover:text-violet-500 font-bold">
                View Timetable
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-500/30 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-2 h-10 bg-violet-500 rounded-full" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800">
                      Class {activeClass.name || activeClass.class_name || "10"}-{activeSection} ({teacher.specialization || "Computer Science"})
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Primary Classroom Lecture</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    09:00 - 10:00 AM
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-500/30 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-2 h-10 bg-indigo-500 rounded-full" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800">Class 11 Science (Subject Lab)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Practical Programming Session</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    11:30 - 01:00 PM
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-500/30 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800">Class 12 Commerce (Database Systems)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Elective Subject Lecture</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    02:00 - 03:00 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Announcements / Alerts / Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaAward className="text-violet-500" /> Faculty Quick Tasks
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/teacher/attendance" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaCalendarCheck className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Mark Attendance</span>
              </Link>
              <Link href="/teacher/students" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaUserGraduate className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Class Roster</span>
              </Link>
              <Link href="/teacher/salary" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaMoneyBillWave className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Salary Slip</span>
              </Link>
              <Link href="/teacher/profile" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaChalkboardTeacher className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Faculty Profile</span>
              </Link>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MdNotificationsActive className="text-violet-500 w-5 h-5" /> Announcements
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-violet-50/50 border border-violet-100/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Midterm Exams</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">Today</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-800">Grade entry due by end of the week</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Please submit mid-term grade sheets to the administration portal.</p>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Staff Meeting</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">Yesterday</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-800">Monthly pedagogy review meeting</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Regular staff assembly scheduled on Friday at 03:30 PM in conference room.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
