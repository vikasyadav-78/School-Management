"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function EditTeacherPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Teacher Record"
        subtitle="Modify teacher designations, department assignments, and contact settings."
      />
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-zinc-800">Select a Teacher to Edit</h3>
        <p className="text-xs text-zinc-400 mt-2">To edit a teacher&apos;s details, please visit the Teachers directory, select a teacher to view their profile, and then click the &quot;Edit Teacher&quot; button.</p>
        <Link href="/admin/teachers" className="inline-block mt-6">
          <Button size="sm" className="bg-teacher-600 hover:bg-teacher-700 shadow-md shadow-teacher-600/10 focus:ring-teacher-500 border-none">
            <FaArrowLeft className="mr-1.5" /> Back to Teachers Directory
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
