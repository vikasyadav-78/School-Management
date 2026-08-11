"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaArrowLeft, FaTrash, FaEnvelope, FaUser, FaBuilding, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaUserCircle, FaDownload, FaSignInAlt, FaCheckCircle } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { fetchStudentsById, deleteStudentsItem, toggleStudentStatus } from "@/features/students/redux/studentThunk";
import { impersonateStudentUser } from "@/features/auth/redux/moduleThunk";
import { getStudentSummary } from "@/features/attendance/redux/attendanceThunk";
import { fetchStudentFeeDetails } from "@/features/finance/redux/financeThunk";
import { resetFeeDetails } from "@/features/finance/redux/financeSlice";

import { toast } from "sonner";
import { api } from "@/services/api";
import { useAppDialog } from "@/context/DialogContext";

export default function StudentProfilePage() {
  const dialog = useAppDialog();
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { selectedItem: student, loading } = useSelector((state) => state.students);
  const { studentSummary } = useSelector((state) => state.attendance);
  const { studentFeeDetails } = useSelector((state) => state.finance);

  console.log("StudentProfilePage: student =", student, "loading =", loading, "id =", id);

  useEffect(() => {
    if (id) {
      dispatch(resetFeeDetails());
      dispatch(fetchStudentsById(id));
      dispatch(getStudentSummary(id));
      dispatch(fetchStudentFeeDetails(id));
    }
  }, [dispatch, id]);

  const handleDelete = async (studentId, studentName, redirectUrl) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Student",
      message: `Are you sure you want to delete student "${studentName}"?`,
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (isConfirmed) {
      dispatch(deleteStudentsItem(studentId)).then(() => {
        router.push(redirectUrl);
      });
    }
  };

  const handleToggleStatus = async () => {
    try {
      const resultAction = await dispatch(toggleStudentStatus(student.id));
      if (toggleStudentStatus.fulfilled.match(resultAction)) {
        toast.success(student.is_active ? "Student deactivated successfully." : "Student activated successfully.");
        dispatch(fetchStudentsById(id));
      } else {
        toast.error("Failed to update student status.");
      }
    } catch (err) {
      toast.error("Failed to update student status.");
    }
  };

  const handleLoginAsStudent = async () => {
    try {
      const resultAction = await dispatch(impersonateStudentUser(student.id));
      if (impersonateStudentUser.fulfilled.match(resultAction)) {
        toast.success("Logged in as student successfully!");
        window.location.href = "/student/dashboard";
      } else {
        toast.error(resultAction.payload || "Failed to login as student.");
      }
    } catch (err) {
      toast.error("Failed to login as student.");
    }
  };

  const handleDownloadQR = () => {
    if (!student?.qr_image) return;
    const link = document.createElement("a");
    link.href = student.qr_image;
    link.download = `student-qr-${student.roll_no || student.student_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  const handleOpenIDCard = async (url) => {
    if (!url) return;
    try {
      toast.info("Loading student ID card...");
      const response = await api.get(url.replace("https://erp.trishpay.in/api", ""));
      const htmlContent = response.data;
      
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.focus();
      } else {
        toast.error("Popup blocker prevented opening the ID card.");
      }
    } catch (err) {
      toast.error("Failed to load ID card: " + (err.message || err));
    }
  };

  const renderStudentAvatar = () => {
    if (!student) return null;
    let img = student.photo || student.profileImage;
    if (img && typeof img === "object" && img.constructor && img.constructor.name === "FileList") {
      img = img[0];
    }
    if (img instanceof File || (img && typeof img === "object" && img.name && img.size)) {
      try {
        const objectUrl = URL.createObjectURL(img);
        return <img src={objectUrl} alt={student.full_name || "Student"} className="w-full h-full object-cover rounded-full" />;
      } catch (e) {
        return <FaUserCircle className="text-zinc-300 w-full h-full" />;
      }
    }
    const hasImageString = img && typeof img === "string" && (
      img.includes("/") || img.includes(".") || img.length > 10
    );
    if (hasImageString) {
      return <img src={img} alt={student.full_name || "Student"} className="w-full h-full object-cover rounded-full" />;
    }
    return <FaUserCircle className="text-zinc-300 w-full h-full" />;
  };

  if (loading && !student) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  const backUrl = student?.class ? `/admin/students/class/${student.class.replace(/class/i, '').trim() || student.class}` : "/admin/students";

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Profile"
        subtitle={`Viewing academic record for ${student?.full_name || id}`}
        action={
          <Link href={backUrl}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Class list
            </Button>
          </Link>
        }
      />

      {student ? (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column - Card Profile & QR Code */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-center space-y-6 md:col-span-1">
            <div className="w-28 h-28 rounded-full bg-violet-100 flex items-center justify-center text-4xl mx-auto shadow-inner overflow-hidden border border-zinc-200">
              {renderStudentAvatar()}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-800">{student.full_name || "-"}</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Class {student.class || "-"} - Section {student.section || "-"}
              </p>
              <span className={`inline-flex items-center mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${student.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                }`}>
                {student.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {student.qr_image && (
              <div className="border-t border-zinc-100 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-zinc-800 tracking-tight">Quick QR</h4>
                <div className="space-y-2">
                  <img
                    src={student.qr_image}
                    alt="Student QR Code"
                    className="w-32 h-32 mx-auto border border-zinc-150 rounded-xl bg-white p-1 select-none shadow-sm"
                  />
                  <p className="text-xs text-zinc-500 font-medium">Roll: {student.roll_no || "-"}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-extrabold rounded-xl py-2 text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <FaDownload className="w-3 h-3 text-zinc-500" /> Download QR
                  </button>
                  {student.id_card_url && (
                    <button
                      onClick={() => handleOpenIDCard(student.id_card_url)}
                      className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl py-2.5 text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      Open Full ID Card
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-medium tracking-tight">
                  Photo, name, roll, guardian on card
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Academic Details, Documents, Summaries */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm md:col-span-2 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-3 mb-4">Academic & Personal Profile</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-650">
                <div className="flex items-center gap-3">
                  <FaIdCard className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Student ID</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.student_id || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Admission Number</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.admission_no || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Roll Number</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.roll_no || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaIdCard className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">APAAR ID</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.apaar_id || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">First Name</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.first_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Last Name</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.last_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Gender</p>
                    <p className="text-zinc-800 font-bold mt-0.5 capitalize">{student.gender || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaBuilding className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Grade Class & Section</p>
                    <p className="text-zinc-800 font-bold mt-0.5">Class {student.class || "-"} - Section {student.section || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Academic Year</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.academic_year || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Admission Date</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.admission_date || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.date_of_birth_label || student.date_of_birth || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Father Name</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.father_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Mother Name</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.mother_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Guardian Phone</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.guardian_phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <FaEnvelope className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-zinc-800 font-bold mt-0.5 break-all">{student.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <FaMapMarkerAlt className="text-zinc-400 w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Home Address</p>
                    <p className="text-zinc-800 font-bold mt-0.5">{student.address || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents & Certificates Grid */}
            <div className="border-t border-zinc-150 pt-5 text-left space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Documents & Certificates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Birth Certificate */}
                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-zinc-700">Birth Certificate</p>
                    <p className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
                      {student.documents?.birth_certificate?.file_name || "Not uploaded"}
                    </p>
                  </div>
                  {student.documents?.birth_certificate?.url && (
                    <a
                      href={student.documents.birth_certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-extrabold rounded-lg text-[9px] uppercase transition-colors shrink-0 ml-2"
                    >
                      View
                    </a>
                  )}
                </div>

                {/* Aadhaar Card */}
                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-zinc-700">Aadhaar Card</p>
                    <p className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
                      {student.documents?.aadhaar?.file_name || "Not uploaded"}
                    </p>
                  </div>
                  {student.documents?.aadhaar?.url && (
                    <a
                      href={student.documents.aadhaar.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-extrabold rounded-lg text-[9px] uppercase transition-colors shrink-0 ml-2"
                    >
                      View
                    </a>
                  )}
                </div>

                {/* Transfer Certificate */}
                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-zinc-700">TC Certificate</p>
                    <p className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">
                      {student.documents?.transfer_certificate?.file_name || "Not uploaded"}
                    </p>
                  </div>
                  {student.documents?.transfer_certificate?.url && (
                    <a
                      href={student.documents.transfer_certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-extrabold rounded-lg text-[9px] uppercase transition-colors shrink-0 ml-2"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            {studentSummary && (
              <div className="border-t border-zinc-100 pt-6 text-left space-y-4">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Attendance Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-emerald-600/80 uppercase">Present</span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-0.5">{studentSummary.presentDays} Days</span>
                  </div>
                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-rose-600/80 uppercase">Absent</span>
                    <span className="text-sm font-extrabold text-rose-600 mt-0.5">{studentSummary.absentDays} Days</span>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-amber-600/80 uppercase">Leave</span>
                    <span className="text-sm font-extrabold text-amber-600 mt-0.5">{studentSummary.leaveDays} Days</span>
                  </div>
                  <div className="bg-violet-50/50 p-2.5 rounded-xl border border-violet-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-violet-600/80 uppercase">Attendance %</span>
                    <span className="text-sm font-extrabold text-violet-600 mt-0.5">{studentSummary.attendancePercentage}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Summary */}
            {studentFeeDetails && (
              <div className="border-t border-zinc-100 pt-6 text-left space-y-4">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Fee Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-blue-600/80 uppercase">Total Fee</span>
                    <span className="text-sm font-extrabold text-blue-600 mt-0.5">${(studentFeeDetails.totalFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-emerald-600/80 uppercase">Paid Fee</span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-0.5">${(studentFeeDetails.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-rose-600/80 uppercase">Due Fee</span>
                    <span className="text-sm font-extrabold text-rose-600 mt-0.5">${(studentFeeDetails.remainingAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-violet-50/50 p-2.5 rounded-xl border border-violet-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-violet-600/80 uppercase">Last Payment Date</span>
                    <span className="text-xs font-bold text-violet-600 mt-0.5">{studentFeeDetails.lastPaymentDate || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Styled Action Buttons */}
            <div className="pt-6 border-t border-zinc-150">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* VIEW (Back to list) */}
                <Link href={backUrl}>
                  <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-extrabold rounded-xl py-2 px-4.5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm">
                    <FaArrowLeft className="w-3 h-3" /> View List
                  </button>
                </Link>

                {/* EDIT */}
                <Link href={`/admin/students/edit/${student.id}`}>
                  <button className="bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-600 font-extrabold rounded-xl py-2 px-4.5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm">
                    <FaUserCircle className="w-3 h-3 text-violet-500" /> Edit
                  </button>
                </Link>

                {/* TOGGLE STATUS (ACTIVE/INACTIVE) */}
                <button
                  onClick={handleToggleStatus}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-extrabold rounded-xl py-2 px-4.5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm"
                >
                  <FaCheckCircle className="w-3.5 h-3.5 text-amber-600" /> {student.is_active ? "Inactive" : "Active"}
                </button>

                {/* DELETE */}
                <button
                  onClick={() => handleDelete(student.id, student.full_name, backUrl)}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold rounded-xl py-2 px-4.5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm"
                >
                  <FaTrash className="w-3 h-3 text-rose-500" /> Delete
                </button>

                {/* LOGIN */}
                <button
                  onClick={handleLoginAsStudent}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold rounded-xl py-2 px-4.5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm"
                >
                  <FaSignInAlt className="w-3.5 h-3.5 text-emerald-600" /> Login
                </button>

                {/* ID CARD */}
                {student.id_card_url && (
                  <button
                    onClick={() => handleOpenIDCard(student.id_card_url)}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-extrabold rounded-xl py-2 px-5 text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shadow-sm"
                  >
                    <FaIdCard className="w-3.5 h-3.5 text-blue-500" /> ID Card
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xs text-zinc-400">Failed to load student profile.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
