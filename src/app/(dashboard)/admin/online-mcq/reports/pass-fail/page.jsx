"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DataTable from "@/components/tables/DataTable";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { getAdminOnlineMcqPassFailReports, getAdminOnlineMcqMeta } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function AdminOnlineMcqPassFailReportPage() {
  const [reports, setReports] = useState([]);
  const [classesMeta, setClassesMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load pass-fail report data
      const res = await getAdminOnlineMcqPassFailReports({
        class_id: selectedClassId || undefined
      });
      setReports(res.rows || res.data || []);

      // Load exams/classes metadata
      const meta = await getAdminOnlineMcqMeta();
      const metaObj = meta.meta || meta.data || meta;
      setClassesMeta(metaObj.classes || []);
    } catch (err) {
      setError(err.message || "Failed to load pass/fail report");
      toast.error(err.message || "Failed to load pass/fail report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const filteredReports = reports.filter((row) => {
    const text = searchTerm.toLowerCase();
    return (
      row.exam?.title?.toLowerCase().includes(text) ||
      row.exam?.subject?.toLowerCase().includes(text) ||
      row.exam?.class?.toLowerCase().includes(text)
    );
  });

  const totalCount = filteredReports.length;
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { header: "Exam Title", accessor: "title", render: (row) => <span className="font-bold text-zinc-900">{row.exam?.title}</span> },
    { header: "Class", accessor: "class", render: (row) => `${row.exam?.class} (${row.exam?.section})` },
    { header: "Subject", accessor: "subject", render: (row) => <span className="capitalize">{row.exam?.subject}</span> },
    { header: "Total Attempts", accessor: "total_attempts" },
    { header: "Passed", accessor: "pass_count", render: (row) => <span className="text-emerald-600 font-bold">{row.pass_count || 0}</span> },
    { header: "Failed", accessor: "fail_count", render: (row) => <span className="text-rose-600 font-bold">{row.fail_count || 0}</span> },
    {
      header: "Pass %",
      accessor: "pass_pct",
      render: (row) => {
        const total = row.total_attempts || 0;
        const passed = row.pass_count || 0;
        return total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : "0.0%";
      }
    },
    {
      header: "Fail %",
      accessor: "fail_pct",
      render: (row) => {
        const total = row.total_attempts || 0;
        const failed = row.fail_count || 0;
        return total > 0 ? `${((failed / total) * 100).toFixed(1)}%` : "0.0%";
      }
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Pass/Fail Analysis Reports"
        subtitle="Analyze pass percentages, failed student counts, and averages across Online MCQ exams."
        action={
          <Link href="/admin/online-mcq/reports">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Filters Panel */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:max-w-xs text-xs font-semibold">
            <Select
              label="Filter Class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Classes" },
                ...classesMeta.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>
          <div className="relative flex items-end w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pb-3 pointer-events-none text-zinc-400">
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
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
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
          data={paginatedReports}
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          loading={loading}
          emptyMessage="No pass/fail reports calculated."
        />
      </div>
    </DashboardLayout>
  );
}
