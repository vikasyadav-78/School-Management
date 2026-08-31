"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAttendanceReport, resetReportData } from "../redux/attendanceSlice";
import { getAttendanceReport as fetchReportThunk } from "../redux/attendanceThunk";
import PageLoader from "@/components/common/PageLoader";
import { FaUserCircle } from "react-icons/fa";
import Pagination from "@/components/ui/Pagination";

export default function TeacherAttendanceReport() {
  const dispatch = useDispatch();
  const { reportData, loading } = useSelector((state) => state.attendance);

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  };

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Local Filter States
  const [startDate, setStartDate] = useState(getThirtyDaysAgo());
  const [endDate, setEndDate] = useState(getToday());
  const [teacherName, setTeacherName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
 
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, teacherName]);

  // Clean up report state on unmount
  useEffect(() => {
    return () => {
      dispatch(resetReportData());
    };
  }, [dispatch]);

  // Trigger search automatically when date range changes
  useEffect(() => {
    dispatch(
      fetchReportThunk({
        className: "",
        section: "",
        startDate,
        endDate,
        studentName: "",
        targetType: "teacher"
      })
    );
  }, [startDate, endDate, dispatch]);

  const { teacherStats = [], summary = {} } = reportData || {};
 
  const filteredStats = teacherStats.filter((stat) =>
    stat.name.toLowerCase().includes(teacherName.toLowerCase())
  );
 
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = filteredStats.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* 1. Report Filters Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-amber-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-amber-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Teacher Name</label>
          <input
            type="text"
            placeholder="Search name..."
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* 2. Aggregate Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 whitespace-nowrap">
            Total Teachers
          </span>
          <span className="text-xl font-extrabold text-zinc-800 whitespace-nowrap">
            {summary.totalTeachers || 0}
          </span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 mb-1 whitespace-nowrap">
            Present Days
          </span>
          <span className="text-xl font-extrabold text-emerald-600 whitespace-nowrap">
            {summary.presentDays || 0}
          </span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 mb-1 whitespace-nowrap">
            Absent Days
          </span>
          <span className="text-xl font-extrabold text-rose-600 whitespace-nowrap">
            {summary.absentDays || 0}
          </span>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 mb-1 whitespace-nowrap">
            Half Days
          </span>
          <span className="text-xl font-extrabold text-blue-600 whitespace-nowrap">
            {summary.halfDayDays || 0}
          </span>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-1 whitespace-nowrap">
            Leave Days
          </span>
          <span className="text-xl font-extrabold text-amber-600 whitespace-nowrap">
            {summary.leaveDays || 0}
          </span>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-1 whitespace-nowrap">
            Avg Attendance
          </span>
          <span className="text-xl font-extrabold text-amber-600 whitespace-nowrap">
            {summary.averagePercentage || 100}%
          </span>
        </div>
      </div>

      {/* 3. Reports Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-xs font-bold text-zinc-700">Teacher Attendance Report Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-6 py-4 whitespace-nowrap">Profile</th>
                  <th className="px-6 py-4 whitespace-nowrap">Teacher Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Gender</th>
                  <th className="px-6 py-4 whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Present Days</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Absent Days</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Half Days</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Leave Days</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {paginatedStats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-zinc-50/50 transition-colors whitespace-nowrap">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shadow-sm whitespace-nowrap">
                        {stat.profileImage ? (
                          <img
                            src={stat.profileImage}
                            alt={stat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement?.classList.add("bg-amber-50", "text-amber-500");
                            }}
                          />
                        ) : (
                          <FaUserCircle className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-zinc-800 whitespace-nowrap">{stat.name}</td>
                    <td className="px-6 py-3.5 text-zinc-500 whitespace-nowrap">{stat.gender}</td>
                    <td className="px-6 py-3.5 font-semibold text-zinc-600 whitespace-nowrap">{stat.department}</td>
                    <td className="px-6 py-3.5 text-center font-semibold text-emerald-600 whitespace-nowrap">
                      {stat.presentDays}
                    </td>
                    <td className="px-6 py-3.5 text-center font-semibold text-rose-600 whitespace-nowrap">
                      {stat.absentDays}
                    </td>
                    <td className="px-6 py-3.5 text-center font-semibold text-blue-600 whitespace-nowrap">
                      {stat.halfDayDays || 0}
                    </td>
                    <td className="px-6 py-3.5 text-center font-semibold text-amber-600 whitespace-nowrap">
                      {stat.leaveDays}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          stat.attendancePercentage >= 90
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : stat.attendancePercentage >= 75
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        } whitespace-nowrap`}
                      >
                        {stat.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
 
                {filteredStats.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-zinc-400 font-medium whitespace-nowrap">
                      No reports data found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
 
          {filteredStats.length > itemsPerPage && (
            <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
              <Pagination
                currentPage={currentPage}
                totalCount={filteredStats.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
