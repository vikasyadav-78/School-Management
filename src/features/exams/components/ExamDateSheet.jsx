"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import DataTable from "@/components/tables/DataTable";

export default function ExamDateSheet({ schedules = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("exam_date");
  const [sortDirection, setSortDirection] = useState("asc");
  const pageSize = 10;

  // Filter schedules
  const filtered = schedules.filter(row => {
    const text = searchTerm.toLowerCase();
    return (
      row.class?.toLowerCase().includes(text) ||
      row.section?.toLowerCase().includes(text) ||
      row.subject?.toLowerCase().includes(text) ||
      row.room?.toLowerCase().includes(text) ||
      row.exam_date?.toLowerCase().includes(text)
    );
  });

  // Sort schedules
  const sorted = [...filtered].sort((a, b) => {
    let fieldA = a[sortField] || "";
    let fieldB = b[sortField] || "";

    if (sortField === "exam_date") {
      return sortDirection === "asc"
        ? new Date(fieldA) - new Date(fieldB)
        : new Date(fieldB) - new Date(fieldA);
    }

    if (typeof fieldA === "string") {
      fieldA = fieldA.toLowerCase();
      fieldB = fieldB.toLowerCase();
    }

    if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalCount = sorted.length;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const columns = [
    {
      header: (
        <button type="button" onClick={() => handleSort("exam_date")} className="font-bold flex items-center gap-1">
          Date {sortField === "exam_date" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
      ),
      accessor: "exam_date"
    },
    {
      header: (
        <button type="button" onClick={() => handleSort("class")} className="font-bold flex items-center gap-1">
          Class {sortField === "class" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
      ),
      accessor: "class"
    },
    { header: "Section", accessor: "section" },
    {
      header: (
        <button type="button" onClick={() => handleSort("subject")} className="font-bold flex items-center gap-1">
          Subject {sortField === "subject" && (sortDirection === "asc" ? "↑" : "↓")}
        </button>
      ),
      accessor: "subject"
    },
    {
      header: "Timing",
      accessor: "time",
      render: (row) => `${row.start_time?.slice(0, 5)} - ${row.end_time?.slice(0, 5)}`
    },
    { header: "Room", accessor: "room" },
    { header: "Max Marks", accessor: "max_marks" },
    { header: "Pass Marks", accessor: "pass_marks" }
  ];

  return (
    <div className="space-y-4">
      {/* Search Filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search date sheet..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        loading={loading}
        emptyMessage="No datesheet / schedules mapped for this exam."
      />
    </div>
  );
}
