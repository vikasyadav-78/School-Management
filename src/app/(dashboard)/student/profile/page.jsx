"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaUsers,
  FaCalendarAlt, FaAddressCard, FaSchool, FaIdCard,
  FaFileAlt, FaKey
} from "react-icons/fa";
import { fetchStudentProfile } from "@/features/students/redux/studentThunk";

export default function StudentProfilePage() {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.students);
  const [photoError, setPhotoError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentProfile());
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
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load profile: {error}
      </div>
    );
  }

  // API Structure maps user details and role profiles
  const student = profile.student || profile.user?.student || {};
  const school = profile.school || profile.user?.school || {};
  const documents = student.documents || profile.documents || profile.user?.documents || {};

  const studentName = student.full_name ||
    (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : profile.name) ||
    "N/A";

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader
        title="My Profile"
        subtitle="Manage your student record, parent contact, and residential address details."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-center flex flex-col justify-between">
          <div>
            {student.photo && !photoError ? (
              <img
                src={student.photo}
                alt={studentName}
                className="w-24 h-24 rounded-full object-cover mx-auto shadow-sm mb-4 border-2 border-violet-100 p-0.5"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center font-black text-3xl mx-auto shadow-sm mb-4 border-2 border-violet-100">
                {studentName.charAt(0).toUpperCase()}
              </div>
            )}

            <h3 className="text-base font-extrabold text-zinc-900">{studentName}</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              ID: <span className="font-mono text-zinc-700">{student.student_id || "N/A"}</span> • Class {student.class || student.class_name || "N/A"}-{student.section || student.section_name || "N/A"}
            </p>

            <div className="flex justify-center gap-2 mt-3.5">
              <span className="text-[10px] bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-violet-100">
                Active
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-100">
                Enrolled
              </span>
            </div>

            {/* School Name Badge with Sharp High-Contrast Visibility */}
            {school.name && (
              <div className="inline-flex items-center justify-center gap-2.5 bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl mt-4 text-xs w-full shadow-2xs">
                {school.logo && !logoError ? (
                  <img
                    src={school.logo}
                    alt="School Logo"
                    className="h-5 w-auto max-w-[32px] object-contain shrink-0"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <FaSchool className="text-violet-600 w-4 h-4 shrink-0" />
                )}
                <span className="text-xs font-black text-zinc-900 uppercase tracking-wide truncate">
                  {school.name}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 my-6 pt-5 text-left space-y-3.5 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
                <FaAddressCard className="text-zinc-500 w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Admission No</span>
                <span className="font-bold text-zinc-800 text-xs font-mono">{student.admission_no || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
                <FaCalendarAlt className="text-zinc-500 w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Admission Date</span>
                <span className="font-bold text-zinc-800 text-xs font-mono">{student.admission_date || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
                <FaIdCard className="text-zinc-500 w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">APAAR ID</span>
                <span className="font-bold text-zinc-800 text-xs font-mono">{student.apaar_id || "N/A"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <Link href="/student/change-password" className="w-full block">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer transition-all">
                  <FaKey className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* General Details & Info Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-7">

          {/* Personal Registry */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-2.5 mb-4">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">First Name</span>
                <span className="text-zinc-900 font-extrabold text-sm">{student.first_name || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Last Name</span>
                <span className="text-zinc-900 font-extrabold text-sm">{student.last_name || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Roll Number</span>
                <span className="text-zinc-800 font-bold text-sm font-mono">{student.roll_no || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Gender</span>
                <span className="text-zinc-800 font-semibold text-xs capitalize">{student.gender || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Date of Birth</span>
                <span className="text-zinc-800 font-semibold text-xs font-mono">{student.date_of_birth || "N/A"}</span>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Residential Address</span>
                <div className="flex items-center gap-2 text-zinc-800 font-semibold text-xs mt-1">
                  <FaMapMarkerAlt className="text-zinc-400 shrink-0" />
                  <span>{student.address || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-2.5 mb-4">
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Father's Name</span>
                <span className="text-zinc-800 font-bold text-xs">{student.father_name || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Mother's Name</span>
                <span className="text-zinc-800 font-bold text-xs">{student.mother_name || "N/A"}</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[10px]">Guardian Phone Number</span>
                <div className="flex items-center gap-2 text-zinc-800 font-semibold text-xs mt-1">
                  <FaPhone className="text-zinc-400 rotate-90 shrink-0" />
                  <span className="font-mono">{student.guardian_phone || student.phone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-2.5 mb-4">
              Verification Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Birth Certificate */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 flex flex-col justify-between min-h-[85px]">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Birth Certificate</span>
                  <span className="font-semibold text-zinc-700 flex items-center gap-1.5 mt-1 max-w-full">
                    <FaFileAlt className="text-zinc-400 w-3 h-3 shrink-0" />
                    <span className="truncate text-zinc-800 font-bold">
                      {documents.birth_certificate ? `✔ ${documents.birth_certificate.file_name || "Uploaded"}` : "N/A"}
                    </span>
                  </span>
                </div>
                {documents.birth_certificate?.url && (
                  <div className="flex gap-2 text-[10px] border-t border-zinc-200/50 pt-2">
                    <a href={documents.birth_certificate.url} target="_blank" rel="noreferrer" className="text-violet-600 font-bold hover:underline cursor-pointer">View</a>
                    <span className="text-zinc-300">|</span>
                    <a href={documents.birth_certificate.url} download className="text-violet-600 font-bold hover:underline cursor-pointer">Download</a>
                  </div>
                )}
              </div>

              {/* Aadhaar Card */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 flex flex-col justify-between min-h-[85px]">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Aadhaar Card</span>
                  <span className="font-semibold text-zinc-700 flex items-center gap-1.5 mt-1 max-w-full">
                    <FaFileAlt className="text-zinc-400 w-3 h-3 shrink-0" />
                    <span className="truncate text-zinc-800 font-bold">
                      {documents.aadhaar ? `✔ ${documents.aadhaar.file_name || "Uploaded"}` : "N/A"}
                    </span>
                  </span>
                </div>
                {documents.aadhaar?.url && (
                  <div className="flex gap-2 text-[10px] border-t border-zinc-200/50 pt-2">
                    <a href={documents.aadhaar.url} target="_blank" rel="noreferrer" className="text-violet-600 font-bold hover:underline cursor-pointer">View</a>
                    <span className="text-zinc-300">|</span>
                    <a href={documents.aadhaar.url} download className="text-violet-600 font-bold hover:underline cursor-pointer">Download</a>
                  </div>
                )}
              </div>

              {/* Transfer Certificate */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 flex flex-col justify-between min-h-[85px]">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Transfer Certificate</span>
                  <span className="font-semibold text-zinc-700 flex items-center gap-1.5 mt-1 max-w-full">
                    <FaFileAlt className="text-zinc-400 w-3 h-3 shrink-0" />
                    <span className="truncate text-zinc-800 font-bold">
                      {documents.transfer_certificate ? `✔ ${documents.transfer_certificate.file_name || "Uploaded"}` : "N/A"}
                    </span>
                  </span>
                </div>
                {documents.transfer_certificate?.url && (
                  <div className="flex gap-2 text-[10px] border-t border-zinc-200/50 pt-2">
                    <a href={documents.transfer_certificate.url} target="_blank" rel="noreferrer" className="text-violet-600 font-bold hover:underline cursor-pointer">View</a>
                    <span className="text-zinc-300">|</span>
                    <a href={documents.transfer_certificate.url} download className="text-violet-600 font-bold hover:underline cursor-pointer">Download</a>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}