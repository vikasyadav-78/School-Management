"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  FaFilter, FaSearch, FaArrowLeft
} from "react-icons/fa";
import {
  getAttendanceClasses,
  getAttendanceHistory,
  getTeacherStudents
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function StudentAttendanceReportsPage() {
  const getActiveMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // State Management
  const [month, setMonth] = useState(getActiveMonthStr());
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentsRegistry, setStudentsRegistry] = useState([]);

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, half_day: 0 });
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 30;

  // Helper function to capitalize and format class names (e.g. "class-2" -> "Class 2")
  const formatClassName = (str) => {
    if (!str) return "N/A";
    return str
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Load Classes Meta & Student Registry on Mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await getAttendanceClasses();
        setClasses(data.classes || data.data || data || []);

        try {
          const invMeta = await getTeacherStudents({ per_page: 1000 });
          const stds = invMeta.students || invMeta.data?.students || invMeta.data || [];
          setStudentsRegistry(stds);
        } catch (stErr) {
          console.error("Student Registry meta error:", stErr);
        }
      } catch (err) {
        toast.error("Failed to load configuration: " + (err.message || err));
      } finally {
        setMetaLoading(false);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Attendance History list
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        month,
        page: currentPage,
        per_page: itemsPerPage
      };
      if (selectedClass) params.school_class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getAttendanceHistory(params);

      setRecords(data.records || data.items || data.data || []);
      setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, half_day: 0 });
      setTotalRecords(data.count || data.total || 0);
    } catch (err) {
      toast.error("Failed to load attendance reports: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [month, selectedClass, selectedSection, searchQuery, currentPage]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSection("");
    setCurrentPage(1);
  };

  // Student Map for fast lookup by student_id
  const studentMap = useMemo(() => {
    const map = new Map();
    studentsRegistry.forEach((st) => {
      if (st.id) {
        const className = st.class?.name || st.class || st.class_name;
        const sectionName = st.section?.name || st.section || st.section_name;
        map.set(st.id, { className, sectionName });
      }
    });
    return map;
  }, [studentsRegistry]);

  // Helper to resolve Class & Section Object
  const getClassAndSection = (rec) => {
    const s = rec.student || {};
    let className = rec.class_name || rec.class || s.class || s.class_name;
    let sectionName = rec.section_name || rec.section || s.section || s.section_name;

    const studentIdVal = rec.student_id || s.id || s.student_id;
    if ((!className || !sectionName) && studentIdVal && studentMap.has(studentIdVal)) {
      const reg = studentMap.get(studentIdVal);
      if (!className) className = reg.className;
      if (!sectionName) sectionName = reg.sectionName;
    }

    if (!className && selectedClass) {
      const matchedClass = classes.find((c) => String(c.id) === String(selectedClass));
      if (matchedClass) className = matchedClass.name;
    }

    if (!sectionName && selectedClassObj?.sections) {
      const matchedSec = selectedClassObj.sections.find((s) => String(s.id) === String(selectedSection));
      if (matchedSec) sectionName = matchedSec.name;
    }

    return {
      className: formatClassName(className),
      sectionName: sectionName ? `Section ${sectionName}` : null
    };
  };

  const selectedClassObj = classes.find((c) => String(c.id) === String(selectedClass));
  const sectionsList = selectedClassObj?.sections || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Student Attendance Report Logs"
          subtitle="Browse monthly logs, student-wise histories, and aggregate attendance ratios."
        />
        <Link href="/teacher/admin/attendance/reports">
          <Button variant="outline" className="text-xs font-bold py-2 px-3">
            <FaArrowLeft className="mr-1.5" /> Back
          </Button>
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
          <FaFilter className="text-violet-500 w-3.5 h-3.5" /> Filters:
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 font-semibold text-zinc-800 transition-all"
          />
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setCurrentPage(1); }}
          className="px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white text-zinc-800 font-bold cursor-pointer transition-all"
        />

        <select
          value={selectedClass}
          onChange={handleClassChange}
          className="px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white text-zinc-800 font-bold cursor-pointer transition-all"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{formatClassName(c.name)}</option>
          ))}
        </select>

        <select
          value={selectedSection}
          onChange={(e) => { setSelectedSection(e.target.value); setCurrentPage(1); }}
          disabled={!selectedClass}
          className="px-3.5 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white text-zinc-800 font-bold cursor-pointer disabled:opacity-50 transition-all"
        >
          <option value="">All Sections</option>
          {sectionsList.map(s => (
            <option key={s.id} value={s.id}>Section {s.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Logged</span>
            <span className="text-xl font-black text-zinc-800 mt-1 block">{stats.total || 0}</span>
          </div>
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{stats.present || 0}</span>
          </div>
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{stats.absent || 0}</span>
          </div>
          <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{stats.late || 0}</span>
          </div>
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Half Day</span>
            <span className="text-xl font-black text-indigo-700 mt-1 block">{stats.half_day || 0}</span>
          </div>
        </div>
      )}

      {/* Roster Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <PageLoader />
        </div>
      ) : records.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider bg-white border border-zinc-200 rounded-2xl shadow-sm">
          No Attendance History Records Found
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-6 py-4">Class & Section</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {records.map(rec => {
                  const statusLower = rec.status?.toLowerCase();
                  const isPresent = statusLower === "present";
                  const isAbsent = statusLower === "absent";
                  const isLate = statusLower === "late";

                  const info = getClassAndSection(rec);

                  return (
                    <tr key={rec.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                        {rec.date_label || rec.date}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-zinc-900 capitalize text-xs block">
                            {rec.student_name || rec.student?.full_name || rec.student?.name || "Student"}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono font-bold uppercase tracking-wider mt-0.5 block">
                            Roll: {rec.roll_no || rec.student?.roll_no || "N/A"} • Adm: {rec.admission_no || rec.student?.admission_no || rec.student?.student_id || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md text-[11px]">
                            {info.className}
                          </span>
                          {info.sectionName && (
                            <span className="text-zinc-400 text-[11px]">
                              • {info.sectionName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPresent ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            isAbsent ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              isLate ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}>
                          {rec.status_label || rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalRecords > itemsPerPage && (
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
              <Pagination
                currentPage={currentPage}
                totalCount={totalRecords}
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
