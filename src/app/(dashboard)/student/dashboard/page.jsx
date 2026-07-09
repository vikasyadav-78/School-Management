"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaCalendarCheck, FaMoneyBillWave, FaFileAlt, FaCalendarAlt, 
  FaArrowRight, FaUserAlt, FaBookOpen, FaBell
} from "react-icons/fa";
import { 
  fetchStudentProfile, 
  fetchStudentAttendance, 
  fetchStudentTimetable,
  fetchStudentFees
} from "@/features/students/redux/studentThunk";

export default function StudentDashboardPage() {
  const dispatch = useDispatch();
  const { profile, attendance, timetable, fees, loading } = useSelector((state) => state.students);
  const [feeStats, setFeeStats] = useState({ total: 30000, paid: 24000, dues: 6000 });

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentAttendance());
    dispatch(fetchStudentTimetable());
    dispatch(fetchStudentFees());
  }, [dispatch]);

  // Compute fees local fallback if profile loads
  useEffect(() => {
    if (profile) {
      const student = profile.student || profile.user?.student || {};
      const classNum = parseInt(student.class || student.class_name) || 10;
      const base = classNum * 3000;
      setFeeStats({
        total: base,
        paid: Math.round(base * 0.8),
        dues: Math.round(base * 0.2)
      });
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const student = profile.student || profile.user?.student || {};
  const studentName = student.full_name || 
    (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : profile.name) || 
    "N/A";

  // Attendance metrics
  const stats = attendance?.stats || {};
  const attTotal = stats.total_days || stats.totalDays || 0;
  const attPresent = stats.present || 0;
  const attHalf = stats.half_day || stats.halfDay || 0;
  const attPercent = attTotal > 0 ? Math.round(((attPresent + (attHalf * 0.5)) / attTotal) * 100) : 100;

  // Today's lectures
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const slots = timetable?.slots || [];
  const todayLectures = slots.filter(
    (s) => s.day_label?.toLowerCase() === todayName.toLowerCase() || s.day?.toLowerCase() === todayName.toLowerCase()
  );

  const feesSummary = fees?.summary || {};
  const paidAmount = feesSummary.total_paid !== undefined ? feesSummary.total_paid : feeStats.paid;
  const dueAmount = feesSummary.total_due !== undefined ? feesSummary.total_due : feeStats.dues;

  const cardBgClass = "bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group";

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      <PageHeader
        title={`Welcome back, ${studentName}!`}
        subtitle={`Student ID: ${student.student_id || "N/A"} • Class ${student.class || student.class_name || "N/A"}-${student.section || student.section_name || "N/A"} • Roll No: ${student.roll_number || "N/A"}`}
      />

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card 1: Attendance */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
              <FaCalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Attendance Rate</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">{attPercent}%</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Evaluated over <br /> {attTotal} school days</span>
            <Link href="/student/attendance" className="text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              My Logs <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 2: Fees Paid */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Fees Paid</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">₹{paidAmount.toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span className="mt-3 w-20">Cleared for active term</span>
            <Link href="/student/fees" className="text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Vouchers <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 3: Dues Owed */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Remaining Dues</p>
              <h3 className="text-2xl font-extrabold text-rose-600 mt-1">₹{dueAmount.toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Due date: <br /> End of Term</span>
            <Link href="/student/fees" className="text-rose-600 hover:text-rose-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Pay Now <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 4: Section */}
        <div className={cardBgClass}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <FaUserAlt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap">Class Section</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">
                {student.class || student.class_name || "N/A"}-{student.section || student.section_name || "N/A"}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Roll No: {student.roll_number || "N/A"}</span>
            <Link href="/student/profile" className="text-amber-600 hover:text-amber-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              My Profile <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Class timetable */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" /> Today's Lecture Periods ({todayName})
              </h3>
              <Link href="/student/timetable" className="text-xs text-violet-600 hover:text-violet-500 font-bold">
                Weekly Timetable
              </Link>
            </div>

            <div className="space-y-4">
              {todayLectures.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-500/30 transition-all">
                  <div className="flex items-center gap-3.5 w-full mr-4">
                    <div className="w-2 h-10 bg-violet-500 rounded-full" />
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-zinc-800">
                        {l.time_label || l.time || (l.start_time && l.end_time ? `${l.start_time} – ${l.end_time}` : "N/A")} – {l.subject || "N/A"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        Faculty: {l.teacher || l.teacher_name || "N/A"} • Venue: {l.room || l.room_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg uppercase tracking-wider">Slot {idx + 1}</span>
                  </div>
                </div>
              ))}
              {todayLectures.length === 0 && (
                <div className="py-10 text-center text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  No Classes Scheduled Today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Announcements & Quick Tasks */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaBookOpen className="text-violet-500" /> Academic Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/student/timetable" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaCalendarAlt className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Timetable</span>
              </Link>
              <Link href="/student/leaves" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaFileAlt className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Leaves</span>
              </Link>
              <Link href="/student/fees" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaMoneyBillWave className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">Fee Vouchers</span>
              </Link>
              <Link href="/student/profile" className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-violet-50 hover:border-violet-200 text-center transition-all group">
                <FaUserAlt className="w-5 h-5 text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-zinc-700 font-bold">My Profile</span>
              </Link>
            </div>
          </div>

          {/* Notifications Board */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaBell className="text-violet-500 w-4 h-4" /> Board Circulars
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-violet-50/50 border border-violet-100/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Annual Sports</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">2 Days Ago</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-800">Registrations for Track events open</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Students can register names with their class teacher for the upcoming athletic meet.</p>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Holidays</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">1 Week Ago</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-800">School closed for Summer Break</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Summer vacation commences from next Monday. Enjoy your holidays!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
