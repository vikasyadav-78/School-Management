"use client";

import { useEffect, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "@/features/students/components/StudentForm";
import { addStudentsItem, fetchStudentsMeta } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";

function AddStudentFormContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meta } = useSelector((state) => state.students);

  const preselectedClassId = searchParams.get("class_id") || "";
  const preselectedSectionId = searchParams.get("section_id") || "";

  useEffect(() => {
    if (!meta) dispatch(fetchStudentsMeta());
  }, [dispatch, meta]);

  const handleAddSubmit = (data) => {
    const formData = new FormData();
    
    if (data.first_name) formData.append("first_name", data.first_name.trim());
    if (data.last_name) formData.append("last_name", data.last_name.trim());
    if (data.roll_no) formData.append("roll_no", data.roll_no.trim());
    if (data.apaar_id) formData.append("apaar_id", data.apaar_id.trim());
    
    formData.append("school_class_id", data.school_class_id || "");
    formData.append("section_id", data.section_id || "");
    formData.append("academic_year_id", data.academic_year_id || "");
    if (data.stream) formData.append("stream", data.stream);
    
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
    if (data.password) formData.append("password", data.password);
    if (data.address) formData.append("address", data.address.trim());
    
    if (data.id_card_theme) {
      formData.append("id_card_theme", data.id_card_theme);
    }
    
    formData.append("auto_generate_id", data.auto_generate_id ? "1" : "0");
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

    dispatch(addStudentsItem(formData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        toast.success("Student registered successfully!");
        router.push(`/admin/students`);
      } else {
        const errorMsg = res.payload || "Failed to create student.";
        toast.error(errorMsg);
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Add Student"
        subtitle="Create a new student entry inside the school registry."
        action={
          <Link href="/admin/students">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <StudentForm 
        onSubmit={handleAddSubmit} 
        meta={meta} 
        preselectedClassId={preselectedClassId} 
        preselectedSectionId={preselectedSectionId} 
      />
    </>
  );
}

export default function AddStudentPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center p-12 min-h-[400px]">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs animate-pulse">Loading Register Form...</span>
        </div>
      }>
        <AddStudentFormContent />
      </Suspense>
    </DashboardLayout>
  );
}
