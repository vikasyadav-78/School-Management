"use client";

import { FaEdit } from "react-icons/fa";
import Link from "next/link";

export default function DashboardStudentTable({ students = [], toppers = [] }) {
  // Safe helper to get initial letter
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Exam Toppers Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-zinc-800">Exam Toppers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold">
                  <th className="pb-3 font-semibold">Roll No.</th>
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Class</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {toppers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-400">
                      No toppers calculated yet. Complete marks entry to update.
                    </td>
                  </tr>
                ) : (
                  toppers.map((topper, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-3 text-zinc-500 font-medium">{topper.roll_no}</td>
                      <td className="py-3 font-bold text-zinc-800 flex items-center gap-3">
                        {topper.photo_url ? (
                          <img 
                            src={topper.photo_url} 
                            alt={topper.name} 
                            className="w-7 h-7 rounded-full object-cover border border-violet-100 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {getInitial(topper.name)}
                          </div>
                        )}
                        <span className="truncate max-w-[120px]">{topper.name}</span>
                      </td>
                      <td className="py-3 text-zinc-500 font-medium">{topper.class_name}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {topper.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. New Student List Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-zinc-800">New Student List</h3>
            <Link href="/admin/students/add" className="text-xs font-bold text-violet-600 hover:text-violet-700">
              + Add Student
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold">
                  <th className="pb-3 font-semibold">No.</th>
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Class</th>
                  <th className="pb-3 font-semibold">Date Of Admit</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-zinc-400">
                      No new students registered recently.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-3 text-zinc-500 font-medium">{student.no}</td>
                      <td className="py-3 font-bold text-zinc-800 flex items-center gap-3">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={student.name} 
                            className="w-7 h-7 rounded-full object-cover border border-violet-100 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {getInitial(student.name)}
                          </div>
                        )}
                        <span className="truncate max-w-[120px] text-violet-600">{student.name}</span>
                      </td>
                      <td className="py-3 text-zinc-500 font-medium">{student.class_name}</td>
                      <td className="py-3 text-zinc-500 font-medium">{student.admission_date}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/students/edit/${student.id}`} className="text-violet-500 hover:text-violet-700 inline-flex items-center">
                          <FaEdit className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
