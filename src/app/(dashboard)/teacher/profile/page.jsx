"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaEnvelope, FaPhone, FaBriefcase, FaGraduationCap, FaCalendarAlt, FaMapMarkerAlt, FaSchool, FaShieldAlt, FaKey } from "react-icons/fa";
import { fetchTeacherProfile } from "@/features/teachers/redux/teacherThunk";

export default function TeacherProfilePage() {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.teachers);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load profile: {error}
      </div>
    );
  }

  const teacher = profile.teacher || {};
  const school = profile.school || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details and academic credentials."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm text-center flex flex-col justify-between">
          <div>
            {teacher.photo ? (
              <img
                src={teacher.photo}
                alt={teacher.full_name || profile.name}
                className="w-24 h-24 rounded-full object-cover mx-auto shadow-inner mb-4 border border-violet-200/40"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-3xl mx-auto shadow-inner mb-4 border border-violet-200/40">
                {(teacher.full_name || profile.name || "T").charAt(0).toUpperCase()}
              </div>
            )}

            <h3 className="text-base font-extrabold text-zinc-800">{teacher.full_name || profile.name || "N/A"}</h3>
            <p className="text-xs text-zinc-400 mt-1">ID: {teacher.employee_id || "N/A"} • {teacher.qualification || "N/A"}</p>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex justify-center gap-1.5">
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-100">
                  Active
                </span>
                <span className="text-[10px] bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border border-violet-100">
                  Verified Faculty
                </span>
              </div>

              {school.name && (
                <div className="inline-flex items-center justify-center gap-2 bg-zinc-50 border border-zinc-150 p-2 rounded-xl mt-1">
                  {school.logo ? (
                    <img
                      src={school.logo}
                      alt="School Logo"
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <FaSchool className="text-violet-500 w-3 h-3" />
                  )}
                  <span className="text-[10px] font-extrabold text-zinc-600 uppercase tracking-wide flex items-center gap-1">
                    {school.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-150 my-6 pt-6 text-left space-y-4 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <FaBriefcase className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-450 font-bold block uppercase tracking-wider">Specialization / Dept</span>
                <span className="font-semibold text-zinc-800">{teacher.specialization || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaGraduationCap className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-450 font-bold block uppercase tracking-wider">Qualification</span>
                <span className="font-semibold text-zinc-800">{teacher.qualification || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-450 font-bold block uppercase tracking-wider">Date of Joining</span>
                <span className="font-semibold text-zinc-800">{teacher.joining_date_label || "N/A"}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 mt-4">
              <Link href="/teacher/change-password" opacity="1" className="w-full block">
                <Button className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm">
                  <FaKey className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* General Details & Info Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-150 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Full Name</span>
                <span className="text-zinc-800 font-extrabold text-sm">{teacher.full_name || profile.name || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Faculty Employee ID</span>
                <span className="text-zinc-800 font-bold text-sm">{teacher.employee_id || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Gender</span>
                <span className="text-zinc-700 font-semibold uppercase">{teacher.gender || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Date of Birth</span>
                <span className="text-zinc-700 font-semibold">{teacher.date_of_birth_label || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Phone Number</span>
                <div className="flex items-center gap-2 text-zinc-700 font-semibold mt-1">
                  <FaPhone className="text-zinc-400 rotate-90" />
                  <span>{teacher.phone || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Residential Address</span>
                <div className="flex items-center gap-2 text-zinc-700 font-semibold mt-1">
                  <FaMapMarkerAlt className="text-zinc-400" />
                  <span>{teacher.address || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-150 pb-2">Employment Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Qualification</span>
                <span className="text-zinc-700 font-semibold">{teacher.qualification || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Specialization</span>
                <span className="text-zinc-700 font-semibold">{teacher.specialization || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Total Experience</span>
                <span className="text-zinc-700 font-semibold">{teacher.total_experience || teacher.experience || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Previous Schools</span>
                <span className="text-zinc-700 font-semibold">{teacher.previous_schools || teacher.previous_school || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Joining Date</span>
                <span className="text-zinc-700 font-semibold">{teacher.joining_date_label || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Active Status</span>
                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-150 pb-2">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Email Address</span>
                <div className="flex items-center gap-2 text-zinc-700 font-semibold mt-1">
                  <FaEnvelope className="text-zinc-400" />
                  <span>{profile.email || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Role</span>
                <span className="text-zinc-700 font-semibold capitalize">{profile.role || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
              <FaShieldAlt className="text-violet-500 w-3.5 h-3.5" /> Permissions & Enabled Features
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Can Mark Student Attendance
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Can View My Attendance
              </span>
              {teacher.enabled_features && teacher.enabled_features.map((feature, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {feature}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
