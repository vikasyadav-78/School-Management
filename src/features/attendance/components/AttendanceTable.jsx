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
 
export default function AttendanceTable({ records = [] }) {
  const dispatch = useDispatch();
  const students = useSelector((state) => state.students.list) || [];
 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
 
  // Reset page and search when records change (e.g. new class/section/date selected)
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [records.length, records[0]?.studentId]);
 
  const handleStatusChange = (studentId, status) => {
    dispatch(updateStudentStatus({ studentId, status }));
  };
 
  const filteredRecords = records.filter((rec) => {
    const student = students.find((s) => s.id === rec.studentId);
    const name = student ? student.name.toLowerCase() : "";
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
          <h3 className="text-xs font-bold text-zinc-700 uppercase">Student Attendance</h3>
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <th className="px-6 py-4">Profile</th>
              <th className="px-6 py-4">Roll No</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Gender</th>
              <th className="px-6 py-4 text-center">Attendance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {paginatedRecords.map((rec) => {
              const student = students.find((s) => s.id === rec.studentId);
              const rollNo = rec.studentId.replace("S", "");
 
              return (
                <tr key={rec.studentId} className="hover:bg-zinc-50/50 transition-colors">
                  {/* Profile Image */}
                  <td className="px-6 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                      {student && student.profileImage ? (
                        <img
                          src={student.profileImage}
                          alt={student.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="w-6 h-6" />
                      )}
                    </div>
                  </td>
 
                  {/* Roll Number */}
                  <td className="px-6 py-3.5 font-bold text-zinc-800">
                    {rollNo}
                  </td>
 
                  {/* Student Name */}
                  <td className="px-6 py-3.5 font-semibold text-zinc-600">
                    {student ? student.name : `Student (${rec.studentId})`}
                  </td>
 
                  {/* Gender */}
                  <td className="px-6 py-3.5 text-zinc-500">
                    {student ? student.gender : "N/A"}
                  </td>
 
                  {/* Attendance Actions */}
                  <td className="px-6 py-3.5">
                    <div className="flex justify-center items-center gap-2">
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
 
                      {/* Leave Button */}
                      <button
                        onClick={() => handleStatusChange(rec.studentId, "Leave")}
                        className={`w-20 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          rec.status === "Leave"
                            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                            : "bg-white border-amber-100 text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
 
            {records.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-zinc-400 font-medium">
                  No students loaded. Select a Class and Section above.
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
