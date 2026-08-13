"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaUserGraduate, FaCalendarCheck, FaChalkboardTeacher, 
  FaMoneyBillWave, FaArrowRight, FaCalendarAlt, FaAward,
  FaBook, FaClock, FaBookOpen, FaChartLine, FaTasks, FaMapMarkerAlt
} from "react-icons/fa";
import { MdOutlineClass, MdNotificationsActive } from "react-icons/md";
import { 
  fetchTeacherProfile, 
  fetchTeacherAttendanceClasses, 
  fetchTeacherMyAttendance 
} from "@/features/teachers/redux/teacherThunk";
import { 
  getHomeworkList, 
  getTeacherTimetable, 
  getTeacherManageLiveClasses, 
  getTeacherManageNotices 
} from "@/features/teachers/services/teacher.service";

export default function TeacherDashboardPage() {
  const dispatch = useDispatch();
  
  const { profile, classes, myAttendance, loading: teachersLoading } = useSelector((state) => state.teachers);

  const [dashboardData, setDashboardData] = useState({
    homeworkCount: 0,
    weeklyClassesCount: 0,
    activeClassesCount: 0,
    todaySchedule: [],
    announcements: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherAttendanceClasses());
    dispatch(fetchTeacherMyAttendance());
  }, [dispatch]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));
        
        const [homeworkRes, timetableRes, liveClassesRes, noticesRes] = await Promise.allSettled([
          getHomeworkList(),
          getTeacherTimetable(),
          getTeacherManageLiveClasses(),
          getTeacherManageNotices()
        ]);

        let hwCount = 0;
        let wkClasses = 0;
        let activeCls = 0;
        let todaySched = [];
        let notices = [];

        if (homeworkRes.status === "fulfilled") {
          const hwData = homeworkRes.value.homework || homeworkRes.value.data || homeworkRes.value || [];
          hwCount = Array.isArray(hwData) ? hwData.length : 0;
        }

        if (timetableRes.status === "fulfilled") {
          const ttData = timetableRes.value;
          const daysData = ttData?.days || [];
          const byDay = ttData?.by_day || [];
          const slotsData = ttData?.slots || [];
          
          const scheduleData = byDay.length > 0 ? byDay : daysData.map(d => ({
            key: d.key,
            slots: slotsData.filter(s => s.day === d.key)
          }));
          
          wkClasses = scheduleData.reduce((acc, curr) => acc + (curr.slots?.length || 0), 0);
          
          // Get today's schedule
          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const todayKey = daysOfWeek[new Date().getDay()];
          const todayObj = scheduleData.find(d => d.key === todayKey);
          if (todayObj && todayObj.slots) {
            todaySched = todayObj.slots;
            todaySched.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
          }
        }

        if (liveClassesRes.status === "fulfilled") {
          const lcData = liveClassesRes.value.live_classes || liveClassesRes.value.classes || liveClassesRes.value.data || liveClassesRes.value || [];
          if (Array.isArray(lcData)) {
            // Count upcoming or live classes, fallback to all if none have status
            const activeList = lcData.filter(c => c.status === "live" || c.status === "upcoming");
            activeCls = activeList.length > 0 ? activeList.length : lcData.length;
          }
        }

        if (noticesRes.status === "fulfilled") {
          const ntData = noticesRes.value.notices || noticesRes.value.data || noticesRes.value || [];
          if (Array.isArray(ntData)) {
            notices = ntData.slice(0, 4); // Take top 4
          }
        }

        setDashboardData({
          homeworkCount: hwCount,
          weeklyClassesCount: wkClasses,
          activeClassesCount: activeCls,
          todaySchedule: todaySched,
          announcements: notices,
          loading: false,
          error: null
        });

      } catch (err) {
        setDashboardData(prev => ({ ...prev, loading: false, error: "Failed to load dashboard data." }));
      }
    };
    
    fetchDashboardData();
  }, []);

  if (teachersLoading || dashboardData.loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const teacher = profile.teacher || {};
  const salaryPreview = myAttendance?.salary_preview || {};
  const activeClass = classes?.[0] || {};
  const activeSection = activeClass?.sections?.[0]?.name || activeClass?.sections?.[0] || "A";

  // Common styles
  const cardBgClass = "bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group";

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title={`Welcome back, ${teacher.full_name || profile.name || 'Teacher'}!`}
        subtitle={`Faculty Member • Department of ${teacher.specialization || "General"} • Assigned to Class ${activeClass.name || activeClass.class_name || "N/A"}-${activeSection}`}
      />

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1 - Homework Assigned */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
              <FaBook className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Homework Assigned</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {dashboardData.homeworkCount}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Active Assignments</span>
            <Link href="/teacher/homework" className="text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Manage <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 2 - Weekly Classes */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <MdOutlineClass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Weekly Classes</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {dashboardData.weeklyClassesCount}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Periods Scheduled</span>
            <Link href="/teacher/timetable" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Schedule <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 3 - Active Classes (Live Classes) */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <FaChalkboardTeacher className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Active Classes</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {dashboardData.activeClassesCount}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Live/Upcoming Sessions</span>
            <Link href="/teacher/live-classes" className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              View <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Metric Card 4 - Basic Salary */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Basic Salary</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                ₹{(salaryPreview.monthly_salary || teacher.salary || 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Gross Est: ₹{(salaryPreview.gross_salary || teacher.salary || 0).toLocaleString()}</span>
            <Link href="/teacher/salary" className="text-amber-600 hover:text-amber-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform whitespace-nowrap">
              Ledger <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Class schedule and Progress */}
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
              {dashboardData.todaySchedule.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm font-semibold bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  No periods scheduled for today.
                </div>
              ) : (
                dashboardData.todaySchedule.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-500/30 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="w-2 h-10 bg-violet-500 rounded-full" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-800 capitalize">
                          {p.title || p.subject || p.slot_type_label || (p.slot_type === "lunch" ? "Lunch Break" : "Period")}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold mt-1">
                          <span className="flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                            {p.class || "-"} - {p.section || "-"}
                          </span>
                          <span className="flex items-center gap-1 uppercase">
                            <FaMapMarkerAlt className="text-zinc-400 shrink-0 w-2.5 h-2.5" />
                            {p.room || "Room N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg uppercase tracking-wider whitespace-nowrap">
                        {p.time_label || `${p.start_time} – ${p.end_time}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* NEW SECTION: My Progress */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                    <FaChartLine className="text-emerald-500" /> My Progress
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Your weekly teaching schedule & homework overview.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-white shadow-sm border border-zinc-100 rounded-xl text-emerald-500">
                    <FaClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-zinc-800">{dashboardData.weeklyClassesCount}</h4>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Periods This Week</span>
                  </div>
               </div>
               
               <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-white shadow-sm border border-zinc-100 rounded-xl text-violet-500">
                    <FaTasks className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-zinc-800">{dashboardData.homeworkCount}</h4>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Homework Tasks</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <MdNotificationsActive className="text-violet-500 w-5 h-5" /> Announcements
              </h3>
              <Link href="/teacher/admin/notices" className="text-xs text-violet-600 hover:text-violet-500 font-bold">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {dashboardData.announcements.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs font-semibold bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  No announcements available.
                </div>
              ) : (
                dashboardData.announcements.map((notice, index) => (
                  <div key={notice.id || index} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{notice.audience || notice.type || "Notice"}</span>
                      <span className="text-[9px] text-zinc-400 font-semibold">{notice.date || notice.created_at || "Recent"}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-800 line-clamp-1">{notice.title || notice.notice_title}</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{notice.description || notice.content || notice.notice_description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
