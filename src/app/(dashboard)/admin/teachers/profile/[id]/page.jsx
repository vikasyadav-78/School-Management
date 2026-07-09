"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherProfile from "@/features/teachers/components/TeacherProfile";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { fetchTeachersById } from "@/features/teachers/redux/teacherThunk";

export default function TeacherProfileViewPage() {
  const dispatch = useDispatch();
  const params = useParams();
  const { id } = params;

  const { selectedItem, loading } = useSelector((state) => state.teachers);

  useEffect(() => {
    if (id) {
      dispatch(fetchTeachersById(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedItem) return <PageLoader />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Profile"
        subtitle={`Viewing full educational details for ${selectedItem?.name || id}`}
        action={
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <TeacherProfile teacher={selectedItem || {}} />
    </DashboardLayout>
  );
}
