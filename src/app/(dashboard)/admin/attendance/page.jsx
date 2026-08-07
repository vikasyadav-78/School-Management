"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import { FaChalkboardTeacher, FaUserGraduate, FaHospital, FaArrowRight } from "react-icons/fa";

export default function AttendanceLandingPage() {
  const options = [
    {
      id: "teacher",
      title: "Teacher Attendance",
      description: "Manage, track, and record daily attendance sheets and logs for school faculty members.",
      icon: FaChalkboardTeacher,
      path: "/admin/attendance/teacher",
      color: "amber",
      iconClass: "bg-amber-50 text-amber-600 border-amber-100",
      buttonText: "Manage Teachers",
      buttonClass: "border-amber-200 text-amber-600 hover:bg-amber-50"
    },
    {
      id: "student",
      title: "Student Attendance",
      description: "Record daily attendance, manage class rosters, and review student attendance history reports.",
      icon: FaUserGraduate,
      path: "/admin/attendance/student",
      color: "violet",
      iconClass: "bg-violet-50 text-violet-600 border-violet-100",
      buttonText: "Manage Students",
      buttonClass: "border-violet-200 text-violet-600 hover:bg-violet-50"
    },
    {
      id: "staff",
      title: "Staff Attendance",
      description: "Track daily attendance and leave records for support staff and administrative teams.",
      icon: FaHospital,
      path: "/admin/attendance/staff",
      color: "sky",
      iconClass: "bg-sky-50 text-sky-600 border-sky-100",
      buttonText: "Manage Staff",
      buttonClass: "border-sky-200 text-sky-600 hover:bg-sky-50"
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Attendance Management"
        subtitle="Select an attendance module below to begin"
      />

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-zinc-300 transition-all duration-300 group"
            >
              <div className="space-y-6">
                {/* Visual Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${opt.iconClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {/* Details */}
                <div className="space-y-2">
                  <h3 className={`text-sm font-bold text-zinc-800 transition-colors ${
                    opt.color === "amber" ? "group-hover:text-amber-600" : "group-hover:text-violet-600"
                  }`}>
                    {opt.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    {opt.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-zinc-50">
                <Link href={opt.path} className="block w-full">
                  <button
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${opt.buttonClass}`}
                  >
                    <span>{opt.buttonText}</span>
                    <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
