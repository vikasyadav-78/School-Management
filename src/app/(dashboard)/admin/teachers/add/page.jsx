"use client";

import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherForm from "@/features/teachers/components/TeacherForm";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { addTeachersItem } from "@/features/teachers/redux/teacherThunk";

export default function AddTeacherPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleAddSubmit = (data) => {
    dispatch(addTeachersItem(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        router.push("/admin/teachers");
      }
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Add Teacher"
        subtitle="Create a new teacher entry inside the school registry."
        action={
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <TeacherForm onSubmit={handleAddSubmit} />
    </DashboardLayout>
  );
}
