"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentsList } from "@/features/students/redux/studentThunk";
import { getAttendanceReport, resetReportData } from "../redux/attendanceSlice";
import { getAttendanceReport as fetchReportThunk } from "../redux/attendanceThunk";
import PageLoader from "@/components/common/PageLoader";
import Pagination from "@/components/ui/Pagination";

export default function AttendanceReport() {
  const dispatch = useDispatch();
  const { classSummaries } = useSelector((state) => state.students);
  const { reportData, loading, error } = useSelector((state) => state.attendance);

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  };

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Local Filter States
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [startDate, setStartDate] = useState(getThirtyDaysAgo());
  const [endDate, setEndDate] = useState(getToday());
  const [studentName, setStudentName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
 
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSection, selectedStream, startDate, endDate, studentName]);

  // Load classes/sections list on mount
  useEffect(() => {
    if (!classSummaries || classSummaries.length === 0) {
      dispatch(fetchStudentsList());
    }
    return () => {
      dispatch(resetReportData());
    };
  }, [dispatch, classSummaries]);

  // Determine sections dynamically based on class and stream
  const selectedClassInfo = classSummaries.find((c) => c.className === selectedClass);
  const sections = selectedClassInfo
    ? selectedClassInfo.isStreamBased
      ? selectedStream === "Science"
        ? ["A", "B"]
        : ["A"]
      : selectedClassInfo.sections || ["A"]
    : [];

  const handleClassChange = (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    if (cls === "11" || cls === "12") {
      setSelectedStream("Science");
      setSelectedSection("A");
    } else {
      setSelectedStream("");
      setSelectedSection(cls ? "A" : "");
    }
  };

  const handleStreamChange = (e) => {
    const stm = e.target.value;
    setSelectedStream(stm);
    setSelectedSection("A");
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Trigger search automatically when class, section, dates or stream changes
  useEffect(() => {
    if (selectedClass) {
      dispatch(
        fetchReportThunk({
          className: selectedClass,
          section: selectedSection,
          startDate,
          endDate,
          studentName: "",
          stream: selectedStream
        })
      );
    } else {
      dispatch(resetReportData());
    }
  }, [selectedClass, selectedSection, startDate, endDate, selectedStream, dispatch]);

  const { studentStats = [], summary = {} } = reportData || {};
 
  const filteredStats = studentStats.filter((stat) =>
    stat.name.toLowerCase().includes(studentName.toLowerCase())
  );
 
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = filteredStats.slice(startIndex, startIndex + itemsPerPage);

  const showStream = selectedClass === "11" || selectedClass === "12";

  return (
    <div className="space-y-6">
      {/* 1. Report Filters Card */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Class</label>
          <select
            value={selectedClass}
            onChange={handleClassChange}
            required
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          >
            <option value="">Select Class</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>

        {showStream ? (
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Academic Stream</label>
            <select
              value={selectedStream}
              onChange={handleStreamChange}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            >
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Student Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search name..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            />
          </div>
        </div>
      </form>

      {selectedClass ? (
        <>
          {/* 2. Aggregate Metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Total Students
              </span>
              <span className="text-xl font-extrabold text-zinc-800">
                {summary.totalStudents || 0}
              </span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 mb-1">
                Present Days
              </span>
              <span className="text-xl font-extrabold text-emerald-600">
                {summary.presentDays || 0}
              </span>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 mb-1">
                Absent Days
              </span>
              <span className="text-xl font-extrabold text-rose-600">
                {summary.absentDays || 0}
              </span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-1">
                Leave Days
              </span>
              <span className="text-xl font-extrabold text-amber-600">
                {summary.leaveDays || 0}
              </span>
            </div>
            <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600/80 mb-1">
                Avg Attendance
              </span>
              <span className="text-xl font-extrabold text-violet-600">
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
                <h3 className="text-xs font-bold text-zinc-700">Attendance Report Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Roll No</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Gender</th>
                      <th className="px-6 py-4 text-center">Present Days</th>
                      <th className="px-6 py-4 text-center">Absent Days</th>
                      <th className="px-6 py-4 text-center">Leave Days</th>
                      <th className="px-6 py-4 text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {paginatedStats.map((stat) => (
                      <tr key={stat.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-zinc-800">{stat.rollNo}</td>
                        <td className="px-6 py-3.5 font-semibold text-zinc-600">{stat.name}</td>
                        <td className="px-6 py-3.5 text-zinc-500">{stat.gender}</td>
                        <td className="px-6 py-3.5 text-center font-semibold text-emerald-600">
                          {stat.presentDays}
                        </td>
                        <td className="px-6 py-3.5 text-center font-semibold text-rose-600">
                          {stat.absentDays}
                        </td>
                        <td className="px-6 py-3.5 text-center font-semibold text-amber-600">
                          {stat.leaveDays}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              stat.attendancePercentage >= 90
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : stat.attendancePercentage >= 75
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}
                          >
                            {stat.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
 
                    {filteredStats.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-zinc-400 font-medium">
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
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs text-zinc-400 font-medium">
            Please select a Class to view the attendance reports.
          </p>
        </div>
      )}
    </div>
  );
}
