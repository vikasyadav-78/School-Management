"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaCalendarAlt, FaChalkboard, FaUser, FaClipboardList, FaSearch, FaChevronLeft
} from "react-icons/fa";
import { 
  getHomeworkMeta,
  getHomeworkReportClass,
  getHomeworkReportTeacher,
  getHomeworkReportStudent,
  getHomeworkReportMonthly
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminHomeworkReportsPage() {
  const [activeTab, setActiveTab] = useState("class"); // "class" | "teacher" | "student" | "monthly"
  const [loading, setLoading] = useState(true);
  const [dataRows, setDataRows] = useState([]);
  
  // Roster options
  const [classes, setClasses] = useState([]);
  
  // Filter variables
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  // Load roster classes
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await getHomeworkMeta();
        setClasses(data.classes || []);
        if (data.classes?.length > 0) {
          setSelectedClassId(data.classes[0].id);
          const targetSecs = data.classes[0].sections || [];
          setSelectedSectionId(targetSecs.length > 0 ? targetSecs[0].id : "");
        }
      } catch (err) {
        console.warn("Failed to load metadata options:", err);
      }
    };
    fetchMeta();
  }, []);

  const formClassObj = classes.find(c => c.id === selectedClassId);
  const formSections = formClassObj?.sections || [];

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id === classId);
    const targetSecs = targetClass?.sections || [];
    setSelectedSectionId(targetSecs.length > 0 ? targetSecs[0].id : "");
  };

  // Fetch Report rows depending on active tab
  const fetchReport = async () => {
    try {
      setLoading(true);
      let res;
      if (activeTab === "class") {
        res = await getHomeworkReportClass();
      } else if (activeTab === "teacher") {
        res = await getHomeworkReportTeacher({ month: selectedMonth });
      } else if (activeTab === "student") {
        if (!selectedClassId) {
          setDataRows([]);
          setLoading(false);
          return;
        }
        const params = { class_id: selectedClassId };
        if (selectedSectionId) params.section_id = selectedSectionId;
        res = await getHomeworkReportStudent(params);
      } else if (activeTab === "monthly") {
        res = await getHomeworkReportMonthly({ year: selectedYear });
      }
      
      setDataRows(res.rows || res.data || []);
    } catch (err) {
      toast.error("Failed to load homework report details: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, selectedMonth, selectedYear, selectedClassId, selectedSectionId]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/homework" 
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="Homework Analytics & Reports"
            subtitle="Track assignment submission analytics, monthly metrics summaries, and teacher grading reports."
          />
        </div>

        {/* Tab Headers */}
        <div className="bg-white border border-zinc-200 p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("class")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "class" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaChalkboard className="w-3.5 h-3.5" /> Class Reports
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "teacher" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaUser className="w-3.5 h-3.5" /> Teacher Reports
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "student" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaClipboardList className="w-3.5 h-3.5" /> Student Reports
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "monthly" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaCalendarAlt className="w-3.5 h-3.5" /> Monthly Summary
          </button>
        </div>

        {/* Filters bar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <h4 className="font-extrabold text-zinc-800 text-xs capitalize">{activeTab} Analytics Filters</h4>
          
          <div className="flex items-center gap-3">
            {/* Monthly Report Year select */}
            {activeTab === "monthly" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Target Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            )}

            {/* Teacher Report Month input */}
            {activeTab === "teacher" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Target Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3.5 py-1 border border-zinc-200 rounded-xl outline-none text-xs font-semibold text-zinc-700 bg-zinc-50"
                />
              </div>
            )}

            {/* Student Report Class & Section selects */}
            {activeTab === "student" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Class</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Section</span>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer"
                  >
                    <option value="">All Sections</option>
                    {formSections.map(s => (
                      <option key={s.id} value={s.id}>Section {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="py-12"><PageLoader /></div>
        ) : dataRows.length === 0 ? (
          <EmptyState 
            title="No Report Metrics Available" 
            desc="No analytics rows matching your active selection were returned by the server." 
          />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                {/* 1. Class Report header & rows */}
                {activeTab === "class" && (
                  <>
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Section</th>
                        <th className="px-6 py-4 text-center">Homework Count</th>
                        <th className="px-6 py-4 text-center">Student Count</th>
                        <th className="px-6 py-4 text-center">Submissions</th>
                        <th className="px-6 py-4 text-center">Expected Submissions</th>
                        <th className="px-6 py-4 text-right">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {dataRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800">{row.class?.name}</td>
                          <td className="px-6 py-4">Section {row.section?.name}</td>
                          <td className="px-6 py-4 text-center font-extrabold">{row.homework_count}</td>
                          <td className="px-6 py-4 text-center">{row.student_count}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-emerald-600">{row.submissions}</td>
                          <td className="px-6 py-4 text-center text-zinc-500">{row.expected}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black bg-violet-50 text-violet-600 border border-violet-100">
                              {row.completion_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 2. Teacher Report header & rows */}
                {activeTab === "teacher" && (
                  <>
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Teacher Name</th>
                        <th className="px-6 py-4">Employee ID</th>
                        <th className="px-6 py-4 text-center">Homework Assigned</th>
                        <th className="px-6 py-4 text-center">Submissions Received</th>
                        <th className="px-6 py-4 text-right">Graded Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {dataRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800">{row.teacher?.full_name}</td>
                          <td className="px-6 py-4 text-zinc-500 uppercase">{row.teacher?.employee_id || "N/A"}</td>
                          <td className="px-6 py-4 text-center font-extrabold">{row.homework_count}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-emerald-600">{row.submission_count}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-violet-50 text-violet-600 border border-violet-100 uppercase">
                              {row.graded_count} Graded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 3. Student Report header & rows */}
                {activeTab === "student" && (
                  <>
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Student Info</th>
                        <th className="px-6 py-4">Class Room</th>
                        <th className="px-6 py-4 text-center">Assigned Homework</th>
                        <th className="px-6 py-4 text-center">Submitted Tasks</th>
                        <th className="px-6 py-4 text-center">Pending Tasks</th>
                        <th className="px-6 py-4 text-right">Graded Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {dataRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-zinc-800 block">{row.student?.full_name}</span>
                              <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">
                                Roll No: {row.student?.roll_no || "N/A"} • ID: {row.student?.student_id || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{row.student?.class} (Sec {row.student?.section})</td>
                          <td className="px-6 py-4 text-center font-extrabold">{row.total_assigned}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-emerald-600">{row.submitted}</td>
                          <td className="px-6 py-4 text-center text-amber-600 font-extrabold">{row.pending}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 uppercase">
                              {row.graded} Graded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 4. Monthly Report header & rows */}
                {activeTab === "monthly" && (
                  <>
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Month</th>
                        <th className="px-6 py-4 text-center">Homework Count</th>
                        <th className="px-6 py-4 text-center">Submissions Received</th>
                        <th className="px-6 py-4 text-right">Graded Tasks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                      {dataRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800">{row.label}</td>
                          <td className="px-6 py-4 text-center font-extrabold">{row.homework_count}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-emerald-600">{row.submission_count}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 uppercase">
                              {row.graded_count} Graded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
