"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { FaSearch, FaEye } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";
import { fetchExamsList } from "@/features/exams/redux/examThunk";

export default function AdminExamsReportsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list = [], loading, error } = useSelector((state) => state.exams);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchExamsList());
  }, [dispatch]);

  const filteredExams = list.filter((exam) => {
    const text = searchTerm.toLowerCase();
    return (
      exam.name?.toLowerCase().includes(text) ||
      exam.type_label?.toLowerCase().includes(text)
    );
  });

  const totalCount = filteredExams.length;
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { header: "Exam Name", accessor: "name", render: (row) => <span className="font-bold text-zinc-900">{row.name}</span> },
    { header: "Exam Type", accessor: "type_label" },
    { header: "Academic Year", accessor: "academic_year_id", render: (row) => row.academic_year?.name || "2026-2027" },
    { header: "Status", accessor: "is_published", render: (row) => row.is_published ? "Published" : "Draft" },
    { header: "Schedules Count", accessor: "schedules_count", render: (row) => `${row.schedules_count || 0} subjects mapped` }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Exam Performance Reports"
        subtitle="Select an exam to view detailed rankings, grading, percentages, and marks status."
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
              placeholder="Search exams..."
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
          onView={(row) => router.push(`/admin/exams/${row.id}/reports`)}
          emptyMessage="No exams available for report generation."
        />
      </div>
    </DashboardLayout>
  );
}
