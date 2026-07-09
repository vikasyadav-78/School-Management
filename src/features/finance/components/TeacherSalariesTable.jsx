"use client";

import { useState } from "react";
import { FaUserCircle, FaCreditCard, FaCheckCircle, FaSearch } from "react-icons/fa";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function TeacherSalariesTable({ records = [], onPay, onViewReceipt }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter records
  const filteredRecords = records.filter((rec) =>
    rec.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const statusColors = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100"
  };

  return (
    <div className="space-y-6">
      {/* Search Filter Panel */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search teacher name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Teacher</th>
                <th className="px-6 py-4 whitespace-nowrap">Department</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Base Salary</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Working Days</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Present</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Absent</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Half Day</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Leave</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Per Day</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Deductions</th>
                <th className="px-6 py-4 text-right font-bold text-violet-700 whitespace-nowrap">Payable Salary</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
              {paginatedRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-50/50 transition-colors">
                  {/* Avatar Profile */}
                  <td className="px-6 py-3.5 flex items-center gap-3 whitespace-nowrap">
                    <FaUserCircle className="w-8 h-8 text-zinc-300 shrink-0" />
                    <div>
                      <Link href={`/admin/teachers/profile/${rec.teacherId}`} className="font-bold text-zinc-800 hover:text-violet-600">
                        {rec.teacherName}
                      </Link>
                      <span className="text-[10px] text-zinc-400 block font-semibold mt-0.5">{rec.teacherId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-600 whitespace-nowrap">{rec.department || "General"}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-zinc-700 whitespace-nowrap">₹{(rec.monthlySalary || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center font-semibold text-zinc-600 whitespace-nowrap">{rec.totalWorkingDays || 22}</td>
                  <td className="px-6 py-3.5 text-center font-bold text-emerald-600 whitespace-nowrap">{rec.presentDays || 0}</td>
                  <td className="px-6 py-3.5 text-center font-bold text-rose-600 whitespace-nowrap">{rec.absentDays || 0}</td>
                  <td className="px-6 py-3.5 text-center font-bold text-blue-600 whitespace-nowrap">{rec.halfDayDays || 0}</td>
                  <td className="px-6 py-3.5 text-center font-bold text-amber-500 whitespace-nowrap">{rec.leaveDays || 0}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-zinc-600 whitespace-nowrap">₹{(rec.perDaySalary || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-rose-500 whitespace-nowrap">-₹{(rec.deductions || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-zinc-850 whitespace-nowrap">₹{(rec.finalSalary || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${statusColors[rec.status]}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex gap-2 justify-center items-center">
                      {rec.status === "Pending" ? (
                        <button
                          onClick={() => onPay(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 rounded-xl text-[10px] font-bold transition-all"
                        >
                          <FaCreditCard className="w-3.5 h-3.5" />
                          <span>Pay Salary</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewReceipt(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-xl text-[10px] font-bold transition-all"
                        >
                          <FaCheckCircle className="w-3.5 h-3.5" />
                          <span>Voucher</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="13" className="text-center py-12 text-zinc-400 font-medium">
                    No teacher salary records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        {filteredRecords.length > itemsPerPage && (
          <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
            <Pagination
              currentPage={currentPage}
              totalCount={filteredRecords.length}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
