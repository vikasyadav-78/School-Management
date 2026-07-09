"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import AttendanceReport from "@/features/attendance/components/AttendanceReport";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function StudentAttendanceReportsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Student Attendance Reports"
        subtitle="Analyze student attendance percentages and stats"
        action={
          <Link href="/admin/attendance/reports">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Options
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        <AttendanceReport />
      </div>
    </DashboardLayout>
  );
}
