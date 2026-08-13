"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaEnvelope, FaPhone, FaBriefcase, FaGraduationCap, FaCalendarAlt, FaMapMarkerAlt, FaSchool, FaShieldAlt, FaKey, FaMoneyBillWave, FaUniversity, FaQrcode, FaFileAlt, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { fetchTeacherProfile } from "@/features/teachers/redux/teacherThunk";

export default function TeacherProfilePage() {
  const dispatch = useDispatch();
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
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
  const bank = teacher.bank_details || {};
  
  // Extract dynamic permissions
  const permissions = Object.entries(teacher)
    .filter(([key, value]) => key.startsWith("can_") && value === true)
    .map(([key]) => {
      // Format 'can_manage_students' -> 'Can Manage Students'
      return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details, academic credentials, and view account information."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Identity Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm text-center flex flex-col justify-between space-y-6">
          <div>
            {teacher.photo ? (
              <img
                src={teacher.photo}
                alt={teacher.full_name || profile.name}
                className="w-28 h-28 rounded-full object-cover mx-auto shadow-sm mb-4 border-4 border-violet-50"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-4xl mx-auto shadow-sm mb-4 border-4 border-violet-50">
                {(teacher.full_name || profile.name || "T").charAt(0).toUpperCase()}
              </div>
            )}

            <h3 className="text-lg font-extrabold text-zinc-800">{teacher.full_name || profile.name || "N/A"}</h3>
            <p className="text-xs font-semibold text-violet-600 mt-1">{teacher.employee_id || "ID Not Assigned"}</p>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex justify-center gap-2">
                {teacher.is_active ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-emerald-100">
                    Active Faculty
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-rose-100">
                    Inactive
                  </span>
                )}
              </div>

              {school.name && (
                <div className="inline-flex items-center justify-center gap-2 bg-zinc-50 border border-zinc-150 p-2 rounded-xl mt-2">
                  {school.logo ? (
                    <img
                      src={school.logo}
                      alt="School Logo"
                      className="w-5 h-5 object-contain rounded-md"
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

          <div className="border-t border-zinc-150 pt-5 text-left space-y-4 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <FaBriefcase className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Specialization / Dept</span>
                <span className="font-semibold text-zinc-800">{teacher.specialization || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaGraduationCap className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Qualification</span>
                <span className="font-semibold text-zinc-800">{teacher.qualification || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-zinc-400 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Date of Joining</span>
                <span className="font-semibold text-zinc-800">{teacher.joining_date_label || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaMoneyBillWave className="text-emerald-500 w-4 h-4 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Base Salary</span>
                <span className="font-extrabold text-emerald-600">{teacher.salary_label || "N/A"}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 mt-4">
              <Link href="/teacher/change-password" opacity="1" className="w-full block">
                <Button className="w-full bg-zinc-800 hover:bg-black text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm">
                  <FaKey className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </Button>
              </Link>
            </div>
          </div>
          
          {/* QR Code Section */}
          {teacher.qr_image && (
            <div className="border-t border-zinc-150 pt-5">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Digital ID / QR Code</h3>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 inline-block">
                <img src={teacher.qr_image} alt="Teacher QR Code" className="w-32 h-32 object-contain mx-auto mix-blend-multiply" />
                <a href={teacher.qr_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-violet-600 hover:text-violet-700 mt-2 block text-center">View Public Profile</a>
              </div>
            </div>
          )}
        </div>

        {/* General Details & Info Grid */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-150 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">First Name</span>
                  <span className="text-zinc-800 font-extrabold">{teacher.first_name || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Last Name</span>
                  <span className="text-zinc-800 font-extrabold">{teacher.last_name || "N/A"}</span>
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
                  <div className="flex items-center gap-1.5 text-zinc-700 font-semibold mt-1">
                    <FaPhone className="text-zinc-400 rotate-90 w-3 h-3" />
                    <span>{teacher.phone || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Email Address</span>
                  <div className="flex items-center gap-1.5 text-zinc-700 font-semibold mt-1">
                    <FaEnvelope className="text-zinc-400 w-3 h-3" />
                    <span>{profile.email || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-3 border-t border-zinc-100 pt-3 mt-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Residential Address</span>
                  <div className="flex items-center gap-2 text-zinc-700 font-semibold mt-1 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    <FaMapMarkerAlt className="text-zinc-400 shrink-0" />
                    <span>{teacher.address || "No address provided"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-150 pb-2">Employment Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
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
                  <span className="text-zinc-700 font-semibold">{teacher.total_experience || "N/A"}</span>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Previous Schools</span>
                  <span className="text-zinc-700 font-semibold">{teacher.previous_schools || "N/A"}</span>
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
                <FaUniversity className="text-violet-500 w-3.5 h-3.5" /> Bank Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Bank Name</span>
                  <span className="text-zinc-800 font-bold">{bank.bank_name || teacher.bank_name || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Account Holder Name</span>
                  <span className="text-zinc-700 font-semibold">{bank.account_holder_name || teacher.account_holder_name || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Account Number</span>
                  <span className="text-zinc-700 font-semibold">{bank.account_number || teacher.account_number || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">IFSC Code</span>
                  <span className="text-zinc-700 font-semibold uppercase">{bank.ifsc_code || teacher.ifsc_code || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">Account Type</span>
                  <span className="text-zinc-700 font-semibold capitalize">{bank.account_type || teacher.account_type || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider text-[9px]">PAN Number</span>
                  <span className="text-zinc-700 font-semibold uppercase">{bank.pan_number || teacher.pan_number || "N/A"}</span>
                </div>
              </div>
            </div>
            
            {/* Documents Verification */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
                <FaFileAlt className="text-violet-500 w-3.5 h-3.5" /> Document Verification
              </h3>
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-2 border border-zinc-200 rounded-lg p-2 px-3 bg-white shadow-sm">
                   {teacher.documents?.aadhaar ? <FaCheckCircle className="text-emerald-500 w-4 h-4" /> : <FaTimesCircle className="text-rose-400 w-4 h-4" />}
                   <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Aadhaar Card</span>
                </div>
                <div className="flex items-center gap-2 border border-zinc-200 rounded-lg p-2 px-3 bg-white shadow-sm">
                   {teacher.documents?.pan || bank.pan_number || teacher.pan_number ? <FaCheckCircle className="text-emerald-500 w-4 h-4" /> : <FaTimesCircle className="text-rose-400 w-4 h-4" />}
                   <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">PAN Card</span>
                </div>
                <div className="flex items-center gap-2 border border-zinc-200 rounded-lg p-2 px-3 bg-white shadow-sm">
                   {teacher.documents?.qualification_certificate ? <FaCheckCircle className="text-emerald-500 w-4 h-4" /> : <FaTimesCircle className="text-rose-400 w-4 h-4" />}
                   <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Qualification Cert</span>
                </div>
              </div>
            </div>

            {/* Permissions & Features */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
                <FaShieldAlt className="text-violet-500 w-3.5 h-3.5" /> Module Permissions
              </h3>
              
              <div className="bg-violet-50/50 rounded-xl border border-violet-100 overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setShowCapabilities(!showCapabilities)} 
                  className="w-full flex items-center justify-between p-4 focus:outline-none hover:bg-violet-100/50 transition-colors"
                >
                  <h4 className="text-[10px] font-bold text-violet-600 uppercase tracking-wider m-0">Admin Capabilities</h4>
                  {showCapabilities ? <FaChevronUp className="text-violet-500 w-3 h-3" /> : <FaChevronDown className="text-violet-500 w-3 h-3" />}
                </button>
                {showCapabilities && (
                  <div className="p-4 pt-0 border-t border-violet-100/50">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {permissions.length > 0 ? permissions.map((perm, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-white text-zinc-700 border border-zinc-200 shadow-sm rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {perm}
                        </span>
                      )) : (
                        <span className="text-xs text-zinc-500 italic">No admin permissions granted.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setShowFeatures(!showFeatures)} 
                  className="w-full flex items-center justify-between p-4 focus:outline-none hover:bg-emerald-100/50 transition-colors"
                >
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider m-0">Enabled Features</h4>
                  {showFeatures ? <FaChevronUp className="text-emerald-500 w-3 h-3" /> : <FaChevronDown className="text-emerald-500 w-3 h-3" />}
                </button>
                {showFeatures && (
                  <div className="p-4 pt-0 border-t border-emerald-100/50">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {teacher.enabled_features && teacher.enabled_features.length > 0 ? teacher.enabled_features.map((feature, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-white text-zinc-700 border border-zinc-200 shadow-sm rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {feature.replace(/_/g, ' ')}
                        </span>
                      )) : (
                        <span className="text-xs text-zinc-500 italic">No features enabled.</span>
                      )}
                    </div>
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
