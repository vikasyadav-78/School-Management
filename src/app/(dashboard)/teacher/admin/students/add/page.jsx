"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaUserCheck, FaArrowLeft } from "react-icons/fa";
import { 
  getTeacherStudentsMeta,
  addTeacherStudent
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import StudentForm from "@/features/students/components/StudentForm";

export default function TeacherStudentsAddPage() {
  const router = useRouter();

  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const loadMeta = async () => {
    try {
      const response = await getTeacherStudentsMeta();
      if (response.success) {
        setMeta(response);
      }
    } catch (error) {
      if (error?.status === 403 || error?.message?.includes("403")) {
        setForbidden(true);
      } else {
        toast.error(error.message || "Failed to load meta data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const handleAddSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Map StudentForm data to FormData
      if (data.first_name) formData.append("first_name", data.first_name.trim());
      if (data.last_name) formData.append("last_name", data.last_name.trim());
      if (data.roll_no) formData.append("roll_no", data.roll_no.trim());
      if (data.apaar_id) formData.append("apaar_id", data.apaar_id.trim());
      
      formData.append("school_class_id", data.school_class_id || "");
      formData.append("section_id", data.section_id || "");
      formData.append("academic_year_id", data.academic_year_id || "");
      
      formData.append("gender", (data.gender || "").toLowerCase());
      formData.append("date_of_birth", data.date_of_birth || "");
      
      if (data.admission_date) {
        formData.append("admission_date", data.admission_date);
      }
      
      // Auto ID generation
      formData.append("auto_generate_id", data.auto_generate_id ? "1" : "0");
      if (!data.auto_generate_id) {
        if (data.admissionNo) {
          formData.append("admission_no", data.admissionNo.trim());
          formData.append("admissionNo", data.admissionNo.trim());
        }
        if (data.student_id) {
          formData.append("student_id", data.student_id.trim());
        }
      }
      
      if (data.father_name) {
        formData.append("father_name", data.father_name.trim());
        formData.append("parentName", data.father_name.trim());
      }
      if (data.mother_name) formData.append("mother_name", data.mother_name.trim());
      if (data.phone) {
        formData.append("phone", data.phone.trim());
        formData.append("guardian_phone", data.phone.trim());
      }
      if (data.email) formData.append("email", data.email.trim());
      if (data.password) formData.append("password", data.password);
      if (data.address) formData.append("address", data.address.trim());
      
      formData.append("is_active", "1");
      
      // Append files
      if (data.profileImage && data.profileImage[0]) {
        formData.append("photo", data.profileImage[0]);
      }
      if (data.birth_certificate && data.birth_certificate[0]) {
        formData.append("birth_certificate", data.birth_certificate[0]);
      }
      if (data.aadhaar_card && data.aadhaar_card[0]) {
        formData.append("aadhaar_card", data.aadhaar_card[0]);
      }
      if (data.transfer_certificate && data.transfer_certificate[0]) {
        formData.append("transfer_certificate", data.transfer_certificate[0]);
      }

      const response = await addTeacherStudent(formData);
      if (response.success) {
        toast.success(response.message || "Student added successfully");
        router.push("/teacher/admin/students");
      } else {
        toast.error(response.message || "Failed to add student");
      }
    } catch (error) {
      console.error(error);
      const errMessage = error?.response?.data?.message || error?.message || "Failed to add student";
      toast.error(errMessage);
    }
  };

  if (loading) return <PageLoader />;

  if (forbidden) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto">
          <FaUserCheck className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-600 mt-2 text-sm">
            You do not have permission to manage students. Please contact the school administrator if you believe this is an error.
          </p>
          <Button 
            onClick={() => router.back()}
            className="mt-6 bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader 
        title="Add New Student" 
        subtitle="Register a new student into the system"
        action={
          <Button 
            variant="secondary"
            onClick={() => router.push('/teacher/admin/students')}
            className="flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Students
          </Button>
        }
      />

      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border border-zinc-200 shadow-sm">
        <StudentForm 
          onSubmit={handleAddSubmit} 
          meta={meta} 
          isEdit={false} 
        />
      </div>
    </div>
  );
}
