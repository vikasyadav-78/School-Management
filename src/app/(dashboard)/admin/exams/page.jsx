"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaPlus, FaSearch, FaEye, FaTrash, FaGraduationCap } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/tables/DataTable";
import Button from "@/components/ui/Button";
import { fetchExamsList, removeExam, togglePublishExam } from "@/features/exams/redux/examThunk";
import { useAppDialog } from "@/context/DialogContext";

export default function AdminExamsListPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const dialog = useAppDialog();

  const { list = [], loading, error } = useSelector((state) => state.exams);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchExamsList());
  }, [dispatch]);

  const handleTogglePublish = async (exam) => {
    const actionText = exam.is_published ? "unpublish" : "publish";
    const confirmed = await dialog.confirm({
      type: "warning",
      title: `${exam.is_published ? "Unpublish" : "Publish"} Exam`,
      message: `Are you sure you want to ${actionText} the exam "${exam.name}"?`
    });

    if (confirmed) {
      try {
        await dispatch(togglePublishExam(exam.id)).unwrap();
        toast.success(`Exam ${actionText}ed successfully!`);
        dispatch(fetchExamsList());
      } catch (err) {
        toast.error(err || `Failed to ${actionText} exam`);
      }
    }
  };

  const handleDeleteExam = async (exam) => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Exam",
      message: `Are you sure you want to delete the exam "${exam.name}"? All associated schedules will be deleted.`
    });

    if (confirmed) {
      try {
        await dispatch(removeExam(exam.id)).unwrap();
        toast.success("Exam deleted successfully.");
        dispatch(fetchExamsList());
      } catch (err) {
        toast.error(err || "Failed to delete exam");
      }
    }
  };

  // Filters & Search
  const filteredExams = list.filter((exam) => {
    const text = searchTerm.toLowerCase();
    return (
      exam.name?.toLowerCase().includes(text) ||
      exam.type_label?.toLowerCase().includes(text) ||
      exam.exam_center?.toLowerCase().includes(text)
    );
  });

  const totalCount = filteredExams.length;
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    { header: "Exam Name", accessor: "name", render: (row) => <span className="font-bold text-zinc-900">{row.name}</span> },
    { header: "Type", accessor: "type_label" },
    { header: "Start Date", accessor: "start_date" },
    { header: "End Date", accessor: "end_date" },
    { header: "Exam Center", accessor: "exam_center", render: (row) => row.exam_center || "N/A" },
    { header: "Schedules", accessor: "schedules_count", render: (row) => `${row.schedules_count || 0} mapped` },
    {
      header: "Status",
      accessor: "is_published",
      render: (row) => (
        <button
          onClick={() => handleTogglePublish(row)}
          className={`inline-flex px-3 py-1 rounded-full text-[13px] font-bold transition-colors ${
            row.is_published
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          {row.is_published ? "Published" : "Draft"}
        </button>
      )
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Exam Directory"
        subtitle="Manage exams, map schedules, generate results & admit cards."
        action={
          <div className="flex gap-2">
            <Link href="/admin/marks">
              <Button variant="outline" size="sm">
                Marks Entry
              </Button>
            </Link>
            <Link href="/admin/exams/create">
              <Button variant="primary" size="sm">
                <FaPlus className="mr-1.5" /> Create Exam
              </Button>
            </Link>
          </div>
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
          onView={(row) => router.push(`/admin/exams/${row.id}`)}
          onDelete={handleDeleteExam}
          emptyMessage="No exams created yet."
        />
      </div>
    </DashboardLayout>
  );
}
