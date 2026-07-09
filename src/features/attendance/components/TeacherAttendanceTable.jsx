"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import Pagination from "@/components/ui/Pagination";
import {
  updateStudentStatus,
  markAllPresent,
  markAllAbsent
} from "../redux/attendanceSlice";
 
export default function TeacherAttendanceTable({ records = [] }) {
  const dispatch = useDispatch();
  const teachers = useSelector((state) => state.teachers.list) || [];
 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
 
  // Reset page and search when records change (e.g. date selected)
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [records.length, records[0]?.studentId]);
 
  const handleStatusChange = (teacherId, status) => {
    dispatch(updateStudentStatus({ studentId: teacherId, status }));
  };
 
  const filteredRecords = records.filter((rec) => {
    const teacher = teachers.find((t) => t.id === rec.studentId);
    const name = teacher ? teacher.name.toLowerCase() : "";
    const id = rec.studentId.toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    return !query || name.includes(query) || id.includes(query);
  });
 
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);
 
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Bulk Action & Search Header */}
      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-4">
          <h3 className="text-xs font-bold text-zinc-700 uppercase">Teacher Attendance</h3>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <FaSearch className="w-3 h-3 text-zinc-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name or ID..."
              className="w-full pl-8 pr-4 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none bg-white focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold shadow-sm"
            />
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => dispatch(markAllPresent())}
            className="px-3 py-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          >
            Mark All Present
          </button>
          <button
            onClick={() => dispatch(markAllAbsent())}
            className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border-spacing-0">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
              <th className="px-6 py-4 whitespace-nowrap">Profile</th>
              <th className="px-6 py-4 whitespace-nowrap">Teacher Name</th>
              <th className="px-6 py-4 whitespace-nowrap">Department</th>
              <th className="px-6 py-4 whitespace-nowrap">Mobile</th>
              <th className="px-6 py-4 whitespace-nowrap">Email</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Attendance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {paginatedRecords.map((rec) => {
              const teacher = teachers.find((t) => t.id === rec.studentId);
 
              return (
                <tr key={rec.studentId} className="hover:bg-zinc-50/50 transition-colors whitespace-nowrap">
                  {/* Profile Image */}
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 overflow-hidden whitespace-nowrap">
                      {teacher && teacher.profileImage ? (
                        <img
                          src={teacher.profileImage}
                          alt={teacher.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="w-6 h-6" />
                      )}
                    </div>
                  </td>
 
                  {/* Teacher Name */}
                  <td className="px-6 py-3.5 font-bold text-zinc-800 whitespace-nowrap">
                    {teacher ? teacher.name : `Teacher (${rec.studentId})`}
                  </td>
 
                  {/* Department */}
                  <td className="px-6 py-3.5 font-semibold text-zinc-600 whitespace-nowrap">
                    {teacher ? teacher.department : "N/A"}
                  </td>
 
                  {/* Mobile */}
                  <td className="px-6 py-3.5 text-zinc-500 font-medium whitespace-nowrap">
                    {teacher ? teacher.mobile : "N/A"}
                  </td>
 
                  {/* Email */}
                  <td className="px-6 py-3.5 text-zinc-500 font-medium whitespace-nowrap">
                    {teacher ? teacher.email : "N/A"}
                  </td>
 
                  {/* Attendance Actions */}
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2 whitespace-nowrap">
                      {/* Present Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Present")}
                        className={`w-20 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Present"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                            : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        Present
                      </button>
 
                      {/* Absent Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Absent")}
                        className={`w-20 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Absent"
                            ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                            : "bg-white border-rose-100 text-rose-600 hover:bg-rose-50"
                        }`}
                      >
                        Absent
                      </button>
 
                      {/* Half Day Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Half Day")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Half Day"
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-white border-blue-100 text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        Half Day
                      </button>
 
                      {/* Paid Leave Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Paid Leave")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Paid Leave"
                            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                            : "bg-white border-amber-100 text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        Paid Leave
                      </button>
 
                      {/* Unpaid Leave Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Unpaid Leave")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Unpaid Leave"
                            ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                            : "bg-white border-orange-100 text-orange-600 hover:bg-orange-50"
                        }`}
                      >
                        Unpaid Leave
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
 
            {records.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-zinc-400 font-medium whitespace-nowrap">
                  No teachers loaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
 
      {records.length > itemsPerPage && (
        <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
          <Pagination
            currentPage={currentPage}
            totalCount={records.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
