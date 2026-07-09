"use client";

import DataTable from "@/components/tables/DataTable";

export default function DashboardStudentTable({ students = [], loading = false }) {
  const columns = [
    { header: "No", accessor: "no" },
    { header: "Name", accessor: "name" },
    { header: "Class Teacher", accessor: "teacher" },
    { header: "Admission Date", accessor: "admissionDate" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const badges = {
          Checkin: "bg-emerald-50 text-emerald-600 border border-emerald-100",
          Pending: "bg-amber-50 text-amber-600 border border-amber-100",
          Canceled: "bg-red-50 text-red-600 border border-red-100"
        };
        const style = badges[row.status] || "bg-zinc-50 text-zinc-500 border border-zinc-200";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${style}`}>
            {row.status}
          </span>
        );
      }
    },
    { header: "Grade / Section", accessor: "grade" },
    { header: "Tuition Fee", accessor: "fees" }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-800">New Admissions List</h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Realtime list of student enrollment and admissions status</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        onEdit={(row) => alert(`Editing student: ${row.name}`)}
        onDelete={(row) => alert(`Deleting student: ${row.name}`)}
      />
    </div>
  );
}
