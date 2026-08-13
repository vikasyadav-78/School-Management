"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import DataTable from "@/components/tables/DataTable";
import Select from "@/components/ui/Select";

export default function ExamResults({ rankings = [], classes = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter sections by class
  const currentClass = classes.find(c => c.id === selectedClassId);
  const sections = currentClass?.sections || [];

  // Filtering
  const filtered = rankings.filter(row => {
    const text = searchTerm.toLowerCase();
    const matchesSearch =
      row.student?.full_name?.toLowerCase().includes(text) ||
      row.student?.student_id?.toLowerCase().includes(text);

    const matchesClass = selectedClassId
      ? row.student?.class?.toLowerCase() === currentClass?.name?.toLowerCase()
      : true;

    const matchesSection = selectedSectionId
      ? row.student?.section?.toLowerCase() === sections.find(s => s.id === selectedSectionId)?.name?.toLowerCase()
      : true;

    const matchesStatus = selectedStatus
      ? row.status?.toLowerCase() === selectedStatus.toLowerCase()
      : true;

    return matchesSearch && matchesClass && matchesSection && matchesStatus;
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { header: "Rank", accessor: "rank", render: (row) => <span className="font-extrabold text-zinc-900">#{row.rank}</span> },
    { header: "Student Name", accessor: "student_name", render: (row) => row.student?.full_name },
    { header: "Student ID", accessor: "student_id", render: (row) => row.student?.student_id },
    { header: "Class", accessor: "class", render: (row) => `${row.student?.class} (${row.student?.section})` },
    { header: "Roll No", accessor: "roll_no", render: (row) => row.student?.roll_no },
    { header: "Total Obtained", accessor: "total_obtained", render: (row) => `${row.total_obtained}/${row.total_max}` },
    { header: "Percentage", accessor: "percentage", render: (row) => `${row.percentage}%` },
    { header: "Grade", accessor: "grade", render: (row) => <span className="font-bold text-violet-600">{row.grade}</span> },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.status?.toLowerCase() === "pass"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-black">
        <h3 className="font-extrabold text-zinc-800 text-sm mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId("");
            }}
            options={[
              { value: "", label: "All Classes" },
              ...classes.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
          <Select
            label="Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            options={[
              { value: "", label: "All Sections" },
              ...sections.map(s => ({ value: s.id, label: s.name }))
            ]}
            disabled={!selectedClassId}
          />
          <Select
            label="Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "", label: "All Status" },
              { value: "Pass", label: "Pass" },
              { value: "Fail", label: "Fail" }
            ]}
          />
          <div className="relative flex items-center mt-3">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        emptyMessage="No results computed for this exam."
      />
    </div>
  );
}
