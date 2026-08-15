"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { api } from "@/services/api";
import {
  FaCalendarCheck,
  FaMoneyBillWave,
  FaFileAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaUserAlt,
  FaBookOpen,
  FaBell
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

  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentAttendance());
    dispatch(fetchStudentTimetable());
    dispatch(fetchStudentFees());

    const fetchNotices = async () => {
      try {
        const response = await api.get("/student/notices");
        const list =
          response.data.notices ||
          response.data.leaves ||
          response.data.data ||
          (Array.isArray(response.data) ? response.data : []);
        setNotices(list);
      } catch (err) {
        console.error("Error fetching student notices:", err);
      } finally {
        setLoadingNotices(false);
      }
    };
    fetchNotices();
  }, [dispatch]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const student = profile.student || profile.user?.student || {};
  const studentName =
    student.full_name ||
    (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : profile.name) ||
    "Student";

  // Attendance metrics
  const stats = attendance?.stats || {};
  const attTotal = stats.total_days || stats.totalDays || 0;
  const attPresent = stats.present || 0;
  const attHalf = stats.half_day || stats.halfDay || 0;
  const attPercent = attTotal > 0 ? Math.round(((attPresent + attHalf * 0.5) / attTotal) * 100) : 100;

  // Today's lectures
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const slots = timetable?.slots || [];
  const todayLectures = slots.filter(
    (s) => s.day_label?.toLowerCase() === todayName.toLowerCase() || s.day?.toLowerCase() === todayName.toLowerCase()
  );

  const feesSummary = fees?.summary || {};
  const paidAmount = feesSummary.total_paid !== undefined ? feesSummary.total_paid : 0;
  const dueAmount = feesSummary.total_due !== undefined ? feesSummary.total_due : 0;

  return (
    <div className="space-y-6 text-left w-full">
      <PageHeader
        title={`Welcome back, ${studentName}!`}
        description={`Student ID: ${student.student_id || "N/A"} • ${(student.class || student.class_name || "").toLowerCase().startsWith("class") ? `${student.class || student.class_name}` : `Class ${student.class || student.class_name || "N/A"}`}-${student.section || student.section_name || "N/A"} • Roll No: ${student.roll_number || "N/A"}`}
      />

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Attendance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-xs ring-1 ring-violet-500/10">
              <FaCalendarCheck />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{attPercent}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">Over {attTotal} total school days</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Daily Tracking</span>
            <Link
              href="/student/attendance"
              className="text-violet-600 hover:text-violet-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              My Logs <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 2: Fees Paid */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fees Cleared
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs ring-1 ring-emerald-500/10">
              <FaMoneyBillWave />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">₹{paidAmount.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Cleared for active session</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Receipts</span>
            <Link
              href="/student/fees"
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              Vouchers <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 3: Remaining Dues */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Remaining Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs ring-1 ring-rose-500/10">
              <FaMoneyBillWave />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className={`text-2xl font-bold tracking-tight ${dueAmount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              ₹{dueAmount.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {dueAmount > 0 ? "Due by end of term" : "No pending dues"}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Payment Portal</span>
            <Link
              href="/student/fees"
              className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              Pay Now <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Stat Card 4: Class & Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Class Section
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs ring-1 ring-amber-500/10">
              <FaUserAlt />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
              {(student.class || student.class_name || "").toLowerCase().startsWith("class")
                ? `${student.class || student.class_name}-${student.section || student.section_name || "N/A"}`
                : `Class ${student.class || student.class_name || "N/A"}-${student.section || student.section_name || "N/A"}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Roll No: {student.roll_number || "N/A"}</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Student Bio</span>
            <Link
              href="/student/profile"
              className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              My Profile <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Class Timetable */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FaCalendarAlt className="text-violet-600 w-4 h-4" /> Today&apos;s Lecture Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{todayName} classes and timetable periods</p>
              </div>
              <Link
                href="/student/timetable"
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold hover:underline"
              >
                Weekly View
              </Link>
            </div>

            <div className="space-y-3">
              {todayLectures.map((l, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-violet-300 hover:bg-violet-50/20 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-1.5 h-9 bg-violet-600 rounded-full shrink-0 group-hover:h-10 transition-all" />
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {l.subject || "Subject"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {l.time_label || l.time || (l.start_time && l.end_time ? `${l.start_time} – ${l.end_time}` : "Time TBA")} • Faculty: {l.teacher || l.teacher_name || "N/A"} • Room: {l.room || l.room_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex px-2.5 py-1 bg-white text-violet-700 border border-violet-200 text-xs font-semibold rounded-lg shadow-2xs">
                      Period {idx + 1}
                    </span>
                  </div>
                </div>
              ))}
              {todayLectures.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No lectures scheduled for today. Enjoy your day!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Academic Actions & Board Circulars */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaBookOpen className="text-violet-600 w-4 h-4" /> Academic Actions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick access shortcuts</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/student/timetable"
                className="group flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-violet-50/40 hover:border-violet-300 text-center transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ring-1 ring-violet-500/10">
                  <FaCalendarAlt className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-violet-900">Timetable</span>
              </Link>

              <Link
                href="/student/leaves"
                className="group flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-violet-50/40 hover:border-violet-300 text-center transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ring-1 ring-violet-500/10">
                  <FaFileAlt className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-violet-900">Leave Apps</span>
              </Link>

              <Link
                href="/student/fees"
                className="group flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-violet-50/40 hover:border-violet-300 text-center transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ring-1 ring-violet-500/10">
                  <FaMoneyBillWave className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-violet-900">Fee Vouchers</span>
              </Link>

              <Link
                href="/student/profile"
                className="group flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-violet-50/40 hover:border-violet-300 text-center transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ring-1 ring-violet-500/10">
                  <FaUserAlt className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-violet-900">My Profile</span>
              </Link>
            </div>
          </div>

          {/* Notifications Board */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FaBell className="text-violet-600 w-4 h-4" /> Board Circulars
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Important school announcements</p>
            </div>

            <div className="space-y-3">
              {loadingNotices ? (
                <div className="py-6 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : notices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No active circulars or notices posted.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {notices.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-1 hover:border-violet-200 hover:bg-violet-50/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">
                          {n.target_type || "General"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium font-mono">
                          {n.published_at_label || "Recent"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}