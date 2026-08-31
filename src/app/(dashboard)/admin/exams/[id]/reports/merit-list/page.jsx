"use client";

import { useEffect, useState, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { fetchExamReportMeritList, fetchExamById, fetchExamsMeta } from "@/features/exams/redux/examThunk";

export default function ExamReportMeritListPage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();

  const { selectedItem, reports, meta, loading, error } = useSelector((state) => state.exams);
  const meritList = reports.meritList || [];

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamsMeta());
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(
      fetchExamReportMeritList({
        examId: id,
        params: {
          class_id: selectedClassId || undefined,
          section_id: selectedSectionId || undefined
        }
      })
    );
  }, [dispatch, id, selectedClassId, selectedSectionId]);

  const currentClass = meta.classes?.find(c => c.id === selectedClassId);
  const sections = currentClass?.sections || [];

  const filtered = meritList.filter(row => {
    const text = searchTerm.toLowerCase();
    return (
      row.student?.full_name?.toLowerCase().includes(text) ||
      row.student?.student_id?.toLowerCase().includes(text)
    );
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Rank", accessor: "rank", render: (row) => <span className="font-bold">#{row.rank}</span> },
    { header: "Student Name", accessor: "student_name", render: (row) => row.student?.full_name },
    { header: "Student ID", accessor: "student_id", render: (row) => row.student?.student_id },
    { header: "Class", accessor: "class", render: (row) => `${row.student?.class} (${row.student?.section})` },
    { header: "Marks", accessor: "total_obtained", render: (row) => `${row.total_obtained}/${row.total_max}` },
    { header: "Percentage", accessor: "percentage", render: (row) => `${row.percentage}%` },
    { header: "Grade", accessor: "grade", render: (row) => <span className="font-bold text-violet-600">{row.grade}</span> }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`${selectedItem?.name || "Exam"} — Merit List`}
        subtitle="View the academic standings and performance grades of passed students."
        action={
          <Link href={`/admin/exams/${id}/reports`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Reports
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-black">
          <h3 className="font-extrabold text-zinc-800 text-sm mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId("");
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Classes" },
                ...(meta.classes || []).map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              label="Section"
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Sections" },
                ...sections.map(s => ({ value: s.id, label: s.name }))
              ]}
              disabled={!selectedClassId}
            />
            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">Search</label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                  <FaSearch className="w-3 h-3" />
                </span>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-55 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-700 font-semibold"
                />
              </div>
            </div>
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
          emptyMessage="No merit entries found."
        />
      </div>
    </DashboardLayout>
  );
}
