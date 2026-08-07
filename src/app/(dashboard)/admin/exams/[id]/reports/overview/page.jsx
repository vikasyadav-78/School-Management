"use client";

import { useEffect, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { FaArrowLeft, FaUserGraduate, FaCheckCircle, FaTimesCircle, FaPercentage, FaBookmark, FaFileAlt } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import StatCard from "@/components/cards/StatCard";
import { fetchExamReportOverview, fetchExamById } from "@/features/exams/redux/examThunk";

export default function ExamReportOverviewPage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();

  const { selectedItem, reports, loading, error } = useSelector((state) => state.exams);
  const overview = reports.overview;

  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamReportOverview(id));
  }, [dispatch, id]);

  if (loading && !overview) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
          Failed to load overview report: {error}
        </div>
      </DashboardLayout>
    );
  }

  const appeared = overview?.students_with_marks || 0;
  const passed = overview?.passed || 0;
  const failed = overview?.failed || 0;
  const passPercentage = appeared > 0 ? ((passed / appeared) * 100).toFixed(1) : 0;
  const failPercentage = appeared > 0 ? ((failed / appeared) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout>
      <PageHeader
        title={`${selectedItem?.name || "Exam"} — Overview Report`}
        subtitle="Performance stats, passed/failed student summary, and averages."
        action={
          <Link href={`/admin/exams/${id}/reports`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Reports
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={appeared}
          icon={FaUserGraduate}
          color="violet"
        />
        <StatCard
          title="Appeared"
          value={appeared}
          icon={FaUserGraduate}
          color="sky"
        />
        <StatCard
          title="Absent"
          value={0}
          icon={FaUserGraduate}
          color="amber"
        />
        <StatCard
          title="Passed"
          value={passed}
          icon={FaCheckCircle}
          color="emerald"
          progress={Number(passPercentage)}
        />
        <StatCard
          title="Failed"
          value={failed}
          icon={FaTimesCircle}
          color="violet"
          progress={Number(failPercentage)}
        />
        <StatCard
          title="Pass Percentage"
          value={`${passPercentage}%`}
          icon={FaPercentage}
          color="emerald"
        />
        <StatCard
          title="Fail Percentage"
          value={`${failPercentage}%`}
          icon={FaPercentage}
          color="violet"
        />
        <StatCard
          title="Average Percentage"
          value={`${overview?.average_percentage || 0}%`}
          icon={FaBookmark}
          color="sky"
        />
      </div>
    </DashboardLayout>
  );
}
