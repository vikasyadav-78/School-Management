"use client";

import DataTable from "@/components/tables/DataTable";
import { FaUserCircle } from "react-icons/fa";

export default function TeacherTable({ teachers = [], loading = false, onView, onEdit, onDelete }) {
  const columns = [
    {
      header: "Profile",
      accessor: "profileImage",
      render: (row) => {
        const hasImage = row.profileImage && typeof row.profileImage === "string" && row.profileImage.startsWith("http");
        return (
          <div 
            onClick={() => onView && onView(row)}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 cursor-pointer overflow-hidden border border-zinc-200 shadow-inner hover:scale-110 transition-transform duration-200"
            title="View Profile"
          >
            {hasImage ? (
              <img src={row.profileImage} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <FaUserCircle className="w-6 h-6" />
            )}
          </div>
        );
      }
    },
    { 
      header: "Name", 
      accessor: "name",
      render: (row) => (
        <span 
          onClick={() => onView && onView(row)}
          className="font-semibold text-zinc-800 hover:text-teacher-600 cursor-pointer transition-colors duration-200"
          title="View Profile">
          {row.name}
        </span>
      )
    },
    { header: "Department", accessor: "department" },
    { header: "Gender", accessor: "gender" },
    { header: "Education", accessor: "education" },
    { header: "Mobile", accessor: "mobile" },
    { header: "Email", accessor: "email" },
    { header: "Join Date", accessor: "joiningDate" },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView && onView(row)}
            className="px-2.5 py-1.5 text-[10px] font-bold text-teacher-600 bg-teacher-50 hover:bg-teacher-100 rounded-lg transition-colors cursor-pointer"
            title="View Profile"
          >
            View Profile
          </button>
          <button
            onClick={() => onEdit && onEdit(row)}
            className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            title="Edit Record"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete && onDelete(row)}
            className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
            title="Delete Record"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={teachers}
      loading={loading}
    />
  );
}
