"use client";

import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "@/features/students/components/StudentForm";
import { addStudentsItem } from "@/features/students/redux/studentThunk";

export default function AddStudentPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleAddSubmit = (data) => {
    console.log("Submitting new student data:", data);
    dispatch(addStudentsItem(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        router.push(`/admin/students/class/${data.className}`);
      }
    });
  };

  return (
    <DashboardLayout>
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

      <StudentForm onSubmit={handleAddSubmit} />

    </DashboardLayout>
  );
}
