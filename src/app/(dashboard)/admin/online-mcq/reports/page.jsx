"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaSearch, FaEye, FaArrowLeft, FaFileAlt } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DataTable from "@/components/tables/DataTable";
import Button from "@/components/ui/Button";
import { getAdminOnlineMcqReports } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function AdminOnlineMcqReportsListPage() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOnlineMcqReports();
      setExams(res.exams || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load MCQ reports list");
      toast.error(err.message || "Failed to load MCQ reports list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExams = exams.filter((ex) => {
    const text = searchTerm.toLowerCase();
    return (
      ex.title?.toLowerCase().includes(text) ||
      ex.subject?.toLowerCase().includes(text) ||
      ex.class?.toLowerCase().includes(text)
    );
  });

  const totalCount = filteredExams.length;
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { header: "Exam Title", accessor: "title", render: (row) => <span className="font-bold text-zinc-900">{row.title}</span> },
    { header: "Class", accessor: "class", render: (row) => `${row.class} (${row.section})` },
    { header: "Subject", accessor: "subject", render: (row) => <span className="capitalize">{row.subject}</span> },
    { header: "Total Questions", accessor: "total_questions" },
    { header: "Total Marks", accessor: "total_marks" },
    { header: "Attempts", accessor: "attempts_count", render: (row) => row.report?.total_attempts || 0 },
    { header: "Avg Score", accessor: "avg_score", render: (row) => `${row.report?.avg_score || 0} (${row.report?.avg_percentage || 0}%)` },
    { header: "Passed", accessor: "pass_count", render: (row) => <span className="text-emerald-600 font-bold">{row.report?.pass_count || 0}</span> },
    { header: "Failed", accessor: "fail_count", render: (row) => <span className="text-rose-600 font-bold">{row.report?.fail_count || 0}</span> }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Online MCQ Exam Reports"
        subtitle="View and analyze leaderboard standing, attendee submission stats, and question analysis."
        action={
          <div className="flex gap-2">
            <Link href="/admin/online-mcq">
              <Button variant="outline" size="sm">
                <FaArrowLeft className="mr-1.5" /> Back to MCQ
              </Button>
            </Link>
            <Link href="/admin/online-mcq/reports/pass-fail">
              <Button variant="primary" size="sm">
                <FaFileAlt className="mr-1.5" /> Pass/Fail Reports
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <DataTable
          columns={columns}
          data={paginatedExams}
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          loading={loading}
          onView={(row) => router.push(`/admin/online-mcq/reports/${row.id}`)}
          emptyMessage="No Online MCQ reports available."
        />
      </div>
    </DashboardLayout>
  );
}
