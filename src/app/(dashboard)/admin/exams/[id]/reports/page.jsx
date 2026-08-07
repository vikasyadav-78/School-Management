"use client";

import { useEffect, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { FaArrowLeft, FaChartBar, FaGraduationCap, FaListOl, FaAward, FaUserTimes, FaBuilding } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { fetchExamById } from "@/features/exams/redux/examThunk";

export default function ExamReportsLandingPage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();

  const { selectedItem, loading } = useSelector((state) => state.exams);

  useEffect(() => {
    dispatch(fetchExamById(id));
  }, [dispatch, id]);

  const cards = [
    {
      title: "Overview",
      description: "Appeared vs Absent, Passed vs Failed counts, overall pass percentages.",
      icon: FaChartBar,
      color: "text-violet-500 bg-violet-50 border-violet-100",
      path: `/admin/exams/${id}/reports/overview`
    },
    {
      title: "Class Wise Reports",
      description: "Comprehensive exam scorecards categorized by class and section.",
      icon: FaBuilding,
      color: "text-blue-500 bg-blue-50 border-blue-100",
      path: `/admin/exams/${id}/reports/class-wise`
    },
    {
      title: "Subject Wise Reports",
      description: "Subject performance stats, averages, highest/lowest marks, and pass rates.",
      icon: FaGraduationCap,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
      path: `/admin/exams/${id}/reports/subject-wise`
    },
    {
      title: "Toppers List",
      description: "Top performing students ranked by total obtained marks and percentage.",
      icon: FaAward,
      color: "text-amber-500 bg-amber-50 border-amber-100",
      path: `/admin/exams/${id}/reports/toppers`
    },
    {
      title: "Merit List",
      description: "Full merit standing of students with marks, final percentages, and grades.",
      icon: FaListOl,
      color: "text-indigo-500 bg-indigo-50 border-indigo-100",
      path: `/admin/exams/${id}/reports/merit-list`
    },
    {
      title: "Fail List",
      description: "Report of failed students, failed subjects, and corresponding marks.",
      icon: FaUserTimes,
      color: "text-rose-500 bg-rose-50 border-rose-100",
      path: `/admin/exams/${id}/reports/fail-list`
    }
  ];

  if (loading && !selectedItem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedItem) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-zinc-400 font-medium text-xs">
          Exam not found. <Link href="/admin/exams" className="text-violet-600 hover:underline">Back to Directory</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`${selectedItem.name} — Reports`}
        subtitle="Select a performance report category to analyze student and subject scores."
        action={
          <Link href={`/admin/exams/${id}`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Details
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <Link
              key={idx}
              href={card.path}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between text-left group"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-zinc-800 text-sm group-hover:text-violet-600 transition-colors">
                  {card.title}
                </h4>
                <p className="text-zinc-500 font-semibold text-xs leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="pt-4 text-violet-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Report &rarr;
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
