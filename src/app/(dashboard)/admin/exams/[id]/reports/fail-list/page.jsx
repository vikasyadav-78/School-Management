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
import { fetchExamReportFailList, fetchExamById, fetchExamsMeta } from "@/features/exams/redux/examThunk";

export default function ExamReportFailListPage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();

  const { selectedItem, reports, meta, loading, error } = useSelector((state) => state.exams);
  const failList = reports.failList || [];

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
      fetchExamReportFailList({
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

  const filtered = failList.filter(row => {
    const text = searchTerm.toLowerCase();
    return (
      row.student?.full_name?.toLowerCase().includes(text) ||
      row.student?.student_id?.toLowerCase().includes(text)
    );
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Student Name", accessor: "student_name", render: (row) => row.student?.full_name },
    { header: "Student ID", accessor: "student_id", render: (row) => row.student?.student_id },
    { header: "Class", accessor: "class", render: (row) => `${row.student?.class} (${row.student?.section})` },
    {
      header: "Failed Subjects",
      accessor: "failed_subjects",
      render: (row) => {
        // If there are unentered or failed subjects, show count or Status
        const unentered = (row.subjects_total || 0) - (row.subjects_entered || 0);
        return unentered > 0 ? `${unentered} Subject(s) uncompleted` : "Failed all/partially";
      }
    },
    { header: "Total Marks", accessor: "total_obtained", render: (row) => `${row.total_obtained}/${row.total_max}` },
    { header: "Grade", accessor: "grade", render: (row) => <span className="font-bold text-rose-600">{row.grade || "F"}</span> }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`${selectedItem?.name || "Exam"} — Fail List`}
        subtitle="Review students who did not meet passing criteria and need academic support."
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
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
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
              onChange={(e) => { setSelectedSectionId(e.target.value); setCurrentPage(1); }}
              options={[
                { value: "", label: "All Sections" },
                ...sections.map(s => ({ value: s.id, label: s.name }))
              ]}
              disabled={!selectedClassId}
            />
            <div className="relative flex items-end">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pb-3 pointer-events-none text-zinc-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
              />
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
          emptyMessage="No failed students found in the registry."
        />
      </div>
    </DashboardLayout>
  );
}
