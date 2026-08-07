"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherProfile from "@/features/teachers/components/TeacherProfile";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { getTeacherTeacherDetail } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function TeacherProfileViewPage() {
  const params = useParams();
  const { id } = params;

  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const detailed = await getTeacherTeacherDetail(id);
        const teacherObj = detailed.teacher || detailed.data || detailed;
        setTeacherData(teacherObj);
      } catch (err) {
        toast.error("Failed to load teacher profile: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Profile"
        subtitle={`Viewing full educational details for ${teacherData?.full_name || teacherData?.name || id}`}
        action={
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <TeacherProfile teacher={teacherData || {}} />
    </DashboardLayout>
  );
}
