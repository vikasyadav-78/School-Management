"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherAttendanceReport from "@/features/attendance/components/TeacherAttendanceReport";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function TeacherAttendanceReportsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Attendance Reports"
        subtitle="Analyze faculty and staff attendance percentages and logs"
        action={
          <Link href="/admin/attendance/reports">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Options
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        <TeacherAttendanceReport />
      </div>
    </DashboardLayout>
  );
}
