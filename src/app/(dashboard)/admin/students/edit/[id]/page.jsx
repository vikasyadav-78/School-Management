"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "@/features/students/components/StudentForm";
import { fetchStudentsById, updateStudentsItem, fetchStudentsMeta } from "@/features/students/redux/studentThunk";

import { toast } from "sonner";

export default function EditStudentPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { selectedItem: student, loading, meta } = useSelector((state) => state.students);

  useEffect(() => {
    if (!meta) dispatch(fetchStudentsMeta());
  }, [dispatch, meta]);

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentsById(id));
    }
  }, [dispatch, id]);

  const handleEditSubmit = (data) => {
    const formData = new FormData();
    
    if (data.first_name) formData.append("first_name", data.first_name.trim());
    if (data.last_name) formData.append("last_name", data.last_name.trim());
    if (data.roll_no) formData.append("roll_no", data.roll_no.trim());
    if (data.apaar_id) formData.append("apaar_id", data.apaar_id.trim());
    
    formData.append("school_class_id", data.school_class_id || "");
    formData.append("section_id", data.section_id || "");
    formData.append("academic_year_id", data.academic_year_id || "");
    if (data.stream) formData.append("stream", data.stream);
    
    // Force lowercase for gender to satisfy backend validation
    formData.append("gender", (data.gender || "").toLowerCase());
    
    formData.append("date_of_birth", data.date_of_birth || "");
    
    if (data.admission_date) {
      formData.append("admission_date", data.admission_date);
    }
    
    if (data.admissionNo) {
      formData.append("admission_no", data.admissionNo.trim());
      formData.append("admissionNo", data.admissionNo.trim());
    }
    
    if (data.student_id) {
      formData.append("student_id", data.student_id.trim());
    }
    
    if (data.father_name) {
      formData.append("father_name", data.father_name.trim());
      formData.append("parentName", data.father_name.trim());
    }
    if (data.mother_name) {
      formData.append("mother_name", data.mother_name.trim());
    }
    
    if (data.phone) {
      formData.append("phone", data.phone.trim());
      formData.append("guardian_phone", data.phone.trim());
    }
    
    if (data.email) formData.append("email", data.email.trim());
    if (data.address) formData.append("address", data.address.trim());
    
    if (data.id_card_theme) {
      formData.append("id_card_theme", data.id_card_theme);
    }
    
    formData.append("is_active", data.status === "Active" ? "1" : "0");

    if (data.profileImage && typeof data.profileImage === "object" && data.profileImage.length > 0) {
      formData.append("photo", data.profileImage[0]);
    } else {
      formData.append("photo", "");
    }

    if (data.birth_certificate && typeof data.birth_certificate === "object" && data.birth_certificate.length > 0) {
      formData.append("birth_certificate", data.birth_certificate[0]);
    }
    if (data.aadhaar_card && typeof data.aadhaar_card === "object" && data.aadhaar_card.length > 0) {
      formData.append("aadhaar_card", data.aadhaar_card[0]);
    }
    if (data.transfer_certificate && typeof data.transfer_certificate === "object" && data.transfer_certificate.length > 0) {
      formData.append("transfer_certificate", data.transfer_certificate[0]);
    }

    dispatch(updateStudentsItem({ id, data: formData })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Student updated successfully!");
        router.push(`/admin/students/profile/${id}`);
      } else {
        const errorMsg = res.payload || "Failed to update student.";
        toast.error(errorMsg);
      }
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Student"
        subtitle={`Modify registry profile details for ${student?.name || id}`}
        action={
          <Link href={`/admin/students/profile/${id}`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Profile
            </Button>
          </Link>
        }
      />

      {loading ? (
        <PageLoader />
      ) : student ? (
        <StudentForm onSubmit={handleEditSubmit} initialData={student} isEdit={true} meta={meta} />
      ) : (
        <div className="text-center py-12 text-zinc-400">Student not found.</div>
      )}
    </DashboardLayout>
  );
}
