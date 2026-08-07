"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaSearch, FaChevronDown, FaChevronRight, FaPenSquare } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DataTable from "@/components/tables/DataTable";
import Button from "@/components/ui/Button";
import { getMarksExams } from "@/features/admin/services/marks.service";
import { toast } from "sonner";

export default function AdminMarksDirectoryPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Track which exam's classes are expanded
  const [expandedExams, setExpandedExams] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMarksExams();
      setExams(res.exams || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load exams list");
      toast.error(err.message || "Failed to load exams list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpandExam = (examId) => {
    setExpandedExams((prev) => ({
      ...prev,
      [examId]: !prev[examId]
    }));
  };

  const filteredExams = exams.filter((ex) => {
    const text = searchTerm.toLowerCase();
    return ex.name?.toLowerCase().includes(text) || ex.type_label?.toLowerCase().includes(text);
  });

  const totalCount = filteredExams.length;
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      header: "Exam Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleExpandExam(row.id)}
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {expandedExams[row.id] ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />}
          </button>
          <span className="font-bold text-zinc-900">{row.name}</span>
        </div>
      )
    },
    { header: "Type", accessor: "type_label" },
    { header: "Start Date", accessor: "start_date" },
    { header: "End Date", accessor: "end_date" },
    {
      header: "Classes",
      accessor: "classes_count",
      render: (row) => `${row.classes?.length || 0} mapped`
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Marks Entry Directory"
        subtitle="Manage student marks and academic evaluation grade rosters."
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

        {loading && exams.length === 0 ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <PageLoader />
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white text-xs text-zinc-700">
                  {paginatedExams.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-10 text-center font-medium text-zinc-400">
                        No exams mapped for marks entry.
                      </td>
                    </tr>
                  ) : (
                    paginatedExams.map((row) => (
                      <>
                        <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                          {columns.map((col, colIdx) => (
                            <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                              {col.render ? col.render(row) : row[col.accessor]}
                            </td>
                          ))}
                        </tr>
                        {expandedExams[row.id] && (
                          <tr>
                            <td colSpan={columns.length} className="bg-zinc-50/40 px-8 py-4">
                              <div className="space-y-3">
                                <h4 className="font-extrabold text-zinc-800 text-[10px] uppercase tracking-wider">
                                  Class-wise Marks Entry Lists
                                </h4>
                                {(!row.classes || row.classes.length === 0) ? (
                                  <p className="text-zinc-400 font-semibold text-[10px]">
                                    No classes configured for this exam.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {row.classes.map((cls, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center shadow-sm"
                                      >
                                        <div>
                                          <p className="font-extrabold text-zinc-800 text-xs">
                                            {cls.class_name} ({cls.section_name})
                                          </p>
                                          <p className="text-zinc-400 text-[10px] font-semibold mt-0.5">
                                            Schedules: {cls.schedule_count} | Students: {cls.student_count}
                                          </p>
                                          <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                                            <div
                                              className="h-full bg-violet-600 rounded-full"
                                              style={{
                                                width: `${(cls.student_count > 0 ? (cls.marks_entered / cls.student_count) * 100 : 0)}%`
                                              }}
                                            />
                                          </div>
                                          <span className="text-[9px] text-zinc-400 font-semibold mt-1 block">
                                            {cls.marks_entered}/{cls.student_count} entered
                                          </span>
                                        </div>

                                        <Link
                                          href={`/admin/marks/${row.id}/class?class_id=${cls.school_class_id}&section_id=${cls.section_id}`}
                                        >
                                          <Button variant="primary" size="sm" className="py-1.5 text-[10px] font-bold">
                                            <FaPenSquare className="mr-1" /> Marks Entry
                                          </Button>
                                        </Link>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
