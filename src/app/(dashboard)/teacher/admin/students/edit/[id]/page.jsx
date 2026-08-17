"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaUserCheck, FaArrowLeft } from "react-icons/fa";
import { 
  getTeacherStudentsMeta,
  getTeacherStudentDetail,
  updateTeacherStudent
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import StudentForm from "@/features/students/components/StudentForm";

export default function TeacherStudentsEditPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [meta, setMeta] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Meta and Detail concurrently
        const [metaRes, detailRes] = await Promise.all([
          getTeacherStudentsMeta().catch(e => { throw e; }),
          getTeacherStudentDetail(id).catch(e => { throw e; })
        ]);

        if (metaRes.success) setMeta(metaRes);
        
        if (detailRes.success && detailRes.student) {
          // Map backend student object to form fields expected by StudentForm
          const st = detailRes.student;
          setStudentDetail({
            id: st.id,
            first_name: st.first_name || "",
            last_name: st.last_name || "",
            gender: st.gender || "",
            date_of_birth: st.date_of_birth || "",
            apaar_id: st.apaar_id || "",
            auto_generate_id: false, // For edit, it's always false since they already have IDs
            student_id: st.student_id || "",
            admissionNo: st.admission_no || "", // StudentForm maps admissionNo
            school_class_id: st.school_class_id || "",
            section_id: st.section_id || "",
            academic_year_id: st.academic_year_id || "",
            roll_no: st.roll_no || "",
            admission_date: st.admission_date || "",
            father_name: st.father_name || "",
            mother_name: st.mother_name || "",
            phone: st.guardian_phone && st.guardian_phone !== "—" ? st.guardian_phone : "",
            address: st.address || "",
            status: st.is_active ? "Active" : "Inactive",
            existingPhoto: st.photo || null
          });
        }
      } catch (error) {
        if (error?.status === 403 || error?.message?.includes("403")) {
          setForbidden(true);
        } else {
          toast.error(error.message || "Failed to load student data");
          router.push("/teacher/admin/students");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleEditSubmit = async (data) => {
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
      
      if (data.father_name) formData.append("father_name", data.father_name.trim());
      if (data.mother_name) formData.append("mother_name", data.mother_name.trim());
      if (data.phone) formData.append("guardian_phone", data.phone.trim());
      if (data.address) formData.append("address", data.address.trim());
      
      if (data.status) {
        formData.append("is_active", data.status === "Active" ? "1" : "0");
      }
      
      // Append files if changed
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

      const response = await updateTeacherStudent(id, formData);
      if (response.success) {
        toast.success(response.message || "Student updated successfully");
        router.push("/teacher/admin/students");
      } else {
        toast.error(response.message || "Failed to update student");
      }
    } catch (error) {
      console.error(error);
      const errMessage = error?.response?.data?.message || error?.message || "Failed to update student";
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
        title="Edit Student" 
        subtitle="Update student information and records"
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
        {studentDetail && (
          <StudentForm 
            onSubmit={handleEditSubmit} 
            meta={meta} 
            isEdit={true} 
            initialData={studentDetail}
          />
        )}
      </div>
    </div>
  );
}
