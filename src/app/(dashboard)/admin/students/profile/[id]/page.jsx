"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaArrowLeft, FaEnvelope, FaUser, FaBuilding, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { fetchStudentsById, deleteStudentsItem } from "@/features/students/redux/studentThunk";
import { getStudentSummary } from "@/features/attendance/redux/attendanceThunk";
import { fetchStudentFeeDetails } from "@/features/finance/redux/financeThunk";
import { resetFeeDetails } from "@/features/finance/redux/financeSlice";

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
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
          {/* Avatar and Basic Header Details */}
          <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center text-4xl mx-auto shadow-inner overflow-hidden border border-zinc-200">
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

          {/* Academic Info Grid Row Items */}
          <div className="border-t border-zinc-100 pt-6 text-left space-y-4 text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <FaIdCard className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Student ID:</span>
              <span className="text-zinc-800 font-semibold">{student.student_id || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaIdCard className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Admission Number:</span>
              <span className="text-zinc-800 font-semibold">{student.admission_no || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaIdCard className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Roll Number:</span>
              <span className="text-zinc-800 font-semibold">{student.roll_no || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaIdCard className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">APAAR ID:</span>
              <span className="text-zinc-800 font-semibold">{student.apaar_id || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">First Name:</span>
              <span className="text-zinc-800 font-semibold">{student.first_name || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Last Name:</span>
              <span className="text-zinc-800 font-semibold">{student.last_name || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Gender:</span>
              <span className="text-zinc-800 font-semibold">{student.gender || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaBuilding className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Grade Class:</span>
              <span className="text-zinc-800 font-semibold">Class {student.class || "-"} - Section {student.section || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Academic Year:</span>
              <span className="text-zinc-800 font-semibold">{student.academic_year || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Admission Date:</span>
              <span className="text-zinc-800 font-semibold">{student.admission_date || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Date of Birth:</span>
              <span className="text-zinc-800 font-semibold">{student.date_of_birth_label || student.date_of_birth || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Father Name:</span>
              <span className="text-zinc-800 font-semibold">{student.father_name || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Mother Name:</span>
              <span className="text-zinc-800 font-semibold">{student.mother_name || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaPhone className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Guardian Phone:</span>
              <span className="text-zinc-800 font-semibold">{student.guardian_phone || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="text-zinc-400 w-4 h-4" />
              <span className="font-semibold w-32 text-zinc-400">Home Address:</span>
              <span className="text-zinc-800 font-semibold">{student.address || "-"}</span>
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

          {/* Bottom Back Button Action */}
          <div className="flex gap-4 justify-center pt-4 border-t border-zinc-100">
            <Link href={backUrl} className="flex-1">
              <Button variant="outline" className="w-full text-xs py-2">
                Back to List
              </Button>
            </Link>
            <Link href={`/admin/students/edit/${student.id}`} className="flex-1">
              <Button variant="outline" className="w-full text-xs py-2 text-blue-600 border-blue-200 hover:bg-blue-50/50">
                Edit
              </Button>
            </Link>
            <Button
              onClick={() => handleDelete(student.id, student.full_name, backUrl)}
              variant="outline"
              className="flex-1 text-xs py-2 text-red-600 border-red-200 hover:bg-red-50/50"
            >
              Delete
            </Button>
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
