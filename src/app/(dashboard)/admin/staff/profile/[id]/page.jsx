"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import StaffProfile from "@/features/admin/components/StaffProfile";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { getAdminStaffDetail } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function StaffProfileViewPage() {
  const params = useParams();
  const { id } = params;

  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const detailed = await getAdminStaffDetail(id);
        const staffObj = detailed.staff || detailed.data || detailed;
        setStaffData(staffObj);
      } catch (err) {
        toast.error("Failed to load staff profile: " + (err.message || err));
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
        title="Staff Profile"
        subtitle={`Viewing full staff details for ${staffData?.full_name || staffData?.name || id}`}
        action={
          <Link href="/admin/staff">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <StaffProfile staff={staffData || {}} />
    </DashboardLayout>
  );
}
