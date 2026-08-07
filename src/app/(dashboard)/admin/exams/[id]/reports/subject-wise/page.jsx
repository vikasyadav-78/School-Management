"use client";

import { useEffect, useState, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";
import Button from "@/components/ui/Button";
import { fetchExamReportSubjectWise, fetchExamById } from "@/features/exams/redux/examThunk";

export default function ExamReportSubjectWisePage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();

  const { selectedItem, reports, loading, error } = useSelector((state) => state.exams);
  const reportList = reports.subjectWise || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamReportSubjectWise(id));
  }, [dispatch, id]);

  const filtered = reportList.filter(row => {
    const text = searchTerm.toLowerCase();
    return (
      row.subject?.toLowerCase().includes(text) ||
      row.class?.toLowerCase().includes(text)
    );
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Subject", accessor: "subject", render: (row) => <span className="capitalize font-bold">{row.subject}</span> },
    { header: "Class / Section", accessor: "class", render: (row) => `${row.class} (${row.section})` },
    { header: "Students", accessor: "students" },
    { header: "Average Marks", accessor: "average", render: (row) => `${row.average || 0}` },
    { header: "Highest Marks", accessor: "highest", render: (row) => `${row.highest || 0}` },
    {
      header: "Pass %",
      accessor: "pass_pct",
      render: (row) => {
        const total = row.students || 0;
        const passed = row.passed || 0;
        return total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : "0.0%";
      }
    },
    {
      header: "Fail %",
      accessor: "fail_pct",
      render: (row) => {
        const total = row.students || 0;
        const failed = row.failed || 0;
        return total > 0 ? `${((failed / total) * 100).toFixed(1)}%` : "0.0%";
      }
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`${selectedItem?.name || "Exam"} — Subject Wise Report`}
        subtitle="Analyze average scores, peak performances, and pass/fail statistics by subject."
        action={
          <Link href={`/admin/exams/${id}/reports`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Reports
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search subjects..."
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
          data={paginated}
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          loading={loading}
          emptyMessage="No subject reports calculated yet."
        />
      </div>
    </DashboardLayout>
  );
}
