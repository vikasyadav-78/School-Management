"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherForm from "@/features/teachers/components/TeacherForm";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { fetchTeachersById, updateTeachersItem } from "@/features/teachers/redux/teacherThunk";

export default function EditTeacherDetailPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { selectedItem, loading } = useSelector((state) => state.teachers);

  useEffect(() => {
    if (id) {
      dispatch(fetchTeachersById(id));
    }
  }, [dispatch, id]);

  const handleEditSubmit = (data) => {
    dispatch(updateTeachersItem({ id, data })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        router.push("/admin/teachers");
      }
    });
  };

  if (loading && !selectedItem) return <PageLoader />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Teacher Record"
        subtitle={`Modify and update information of teacher ${selectedItem?.name || id}`}
        action={
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <TeacherForm
        onSubmit={handleEditSubmit}
        initialData={selectedItem}
        isEdit={true}
      />
    </DashboardLayout>
  );
}
