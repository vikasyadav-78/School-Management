"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  getGlobalReports,
  getReportsMeta,
  getReportsStudents,
  getReportsTeachers,
  getReportsStaff,
  exportReports
} from "@/features/super-admin/services/super-admin.service";
import { toast } from "sonner";
import {
  FaChartBar,
  FaBuilding,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserTie,
  FaCoins,
  FaCalendarAlt,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaCheck
} from "react-icons/fa";

export default function SuperAdminReportsPage() {
  const [meta, setMeta] = useState({ schools: [] });
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Tab control: "overview" | "students" | "teachers" | "staff"
  const [activeTab, setActiveTab] = useState("overview");

  // Filters State
  const [selectedSchool, setSelectedSchool] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Roster lists search & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Data States
  const [reportData, setReportData] = useState({ global: {}, by_school: [] });
  const [detailRecords, setDetailRecords] = useState([]);

  // Fetch Meta (schools dropdown)
  const fetchMeta = async () => {
    try {
      const res = await getReportsMeta();
      setMeta(res || { schools: [] });
    } catch (err) {
      console.error("Failed to load reports meta:", err);
    }
  };

  // Fetch Global KPI & School Summary
  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      const params = {
        school_id: selectedSchool || undefined,
        period,
        month: period === "monthly" ? selectedMonth : undefined,
        year: period === "monthly" || period === "yearly" ? selectedYear : undefined,
        date_from: period === "custom" ? dateFrom : undefined,
        date_to: period === "custom" ? dateTo : undefined
      };
      const res = await getGlobalReports(params);
      setReportData(res || { global: {}, by_school: [] });
    } catch (err) {
      toast.error("Failed to load global overview reports: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Detailed drill-down lists (students/teachers/staff)
  const fetchDetailList = async () => {
    try {
      setListLoading(true);
      const params = {
        school_id: selectedSchool || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        per_page: pageSize
      };

      let res = { data: [], count: 0 };
      if (activeTab === "students") {
        const response = await getReportsStudents(params);
        res.data = response.students || response.data || [];
        res.count = response.count || 0;
      } else if (activeTab === "teachers") {
        const response = await getReportsTeachers(params);
        res.data = response.teachers || response.data || [];
        res.count = response.count || 0;
      } else if (activeTab === "staff") {
        const response = await getReportsStaff(params);
        res.data = response.staff || response.data || [];
        res.count = response.count || 0;
      }

      setDetailRecords(res.data);
      setTotalCount(res.count);
    } catch (err) {
      toast.error("Failed to load drill-down records: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchGlobalData();
    } else {
      fetchDetailList();
    }
  }, [activeTab, selectedSchool, period, selectedMonth, selectedYear, dateFrom, dateTo, searchTerm, currentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setCurrentPage(1);
    setDetailRecords([]);
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const params = {
        school_id: selectedSchool || undefined,
        period,
        month: period === "monthly" ? selectedMonth : undefined,
        year: period === "monthly" || period === "yearly" ? selectedYear : undefined,
        date_from: period === "custom" ? dateFrom : undefined,
        date_to: period === "custom" ? dateTo : undefined
      };

      const response = await exportReports(format, params);

      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Global-Report-${period}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Report exported in ${format.toUpperCase()} successfully.`);
    } catch (err) {
      toast.error("Export failed: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const global = reportData.global || {};

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left w-full">
        {/* Page Header */}
        <PageHeader
          title="Global Reports & Analytics"
          description="Cross-institutional enrollment KPIs, consolidated financial statements, and staff tracking."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                disabled={exporting}
                onClick={() => handleExport("pdf")}
              >
                <FaFilePdf className="w-3.5 h-3.5 text-red-500" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                disabled={exporting}
                onClick={() => handleExport("excel")}
              >
                <FaFileExcel className="w-3.5 h-3.5 text-emerald-600" /> Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                disabled={exporting}
                onClick={() => handleExport("csv")}
              >
                <FaFileCsv className="w-3.5 h-3.5 text-blue-500" /> CSV
              </Button>
            </div>
          }
        />

        {/* Global Filters Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select School
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Schools</option>
                {(meta.schools || []).map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {period === "monthly" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </>
            )}

            {period === "yearly" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
            )}

            {period === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm font-semibold py-2.5 border-slate-200 hover:bg-slate-50 text-slate-600"
                onClick={() => {
                  setSelectedSchool("");
                  setPeriod("monthly");
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200/80 bg-white px-6 rounded-2xl shadow-sm gap-6 overflow-x-auto">
          <button
            onClick={() => handleTabChange("overview")}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FaChartBar className="w-3.5 h-3.5" /> Overview Summary
          </button>
          <button
            onClick={() => handleTabChange("students")}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "students"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FaUserGraduate className="w-3.5 h-3.5" /> Students Detailed
          </button>
          <button
            onClick={() => handleTabChange("teachers")}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "teachers"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FaChalkboardTeacher className="w-3.5 h-3.5" /> Teachers Detailed
          </button>
          <button
            onClick={() => handleTabChange("staff")}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "staff"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FaUserTie className="w-3.5 h-3.5" /> Staff Detailed
          </button>
        </div>

        {/* Tab Content: Overview Summary */}
        {activeTab === "overview" && (
          <>
            {loading ? (
              <div className="py-24 flex justify-center items-center">
                <PageLoader />
              </div>
            ) : (
              <>
                {/* Global KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Institutions Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Institutions
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                        <FaBuilding />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.schools || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Total registered schools</p>
                    </div>
                  </div>

                  {/* Total Students Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Students
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm ring-1 ring-blue-500/10">
                        <FaUserGraduate />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.students || 0}
                      </h3>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {global.active_students || 0} currently active
                      </p>
                    </div>
                  </div>

                  {/* Teachers Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Faculty Count
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                        <FaChalkboardTeacher />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.teachers || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Active faculty & teachers</p>
                    </div>
                  </div>

                  {/* Staff Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Support Staff
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm ring-1 ring-amber-500/10">
                        <FaUserTie />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.staff || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Administrative & ops staff</p>
                    </div>
                  </div>

                  {/* Admissions Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        New Admissions
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-sm ring-1 ring-teal-500/10">
                        <FaCalendarAlt />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.new_admissions || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Admitted in chosen period</p>
                    </div>
                  </div>

                  {/* Revenue Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Revenue Collected
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm ring-1 ring-indigo-500/10">
                        <FaCoins />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        ₹{(global.revenue || 0).toLocaleString()}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Consolidated fee payments</p>
                    </div>
                  </div>

                  {/* Pending Fees Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pending Fees
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm ring-1 ring-rose-500/10">
                        <FaCoins />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-rose-600 tracking-tight">
                        ₹{(global.pending_fees || 0).toLocaleString()}
                      </h3>
                      <p className="text-xs text-rose-500 mt-1">Outstanding fee balance</p>
                    </div>
                  </div>

                  {/* Attendance Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Attendance Present
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm ring-1 ring-sky-500/10">
                        <FaCheck />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {global.attendance_present || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Recorded present logs</p>
                    </div>
                  </div>
                </div>

                {/* School-wise Summary Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                    <h3 className="font-bold text-slate-900 text-sm">
                      School-wise Metrics Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Performance, headcount, and fee overview per school
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[220px]">School Name</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Tier Plan</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[100px]">Students</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[100px]">Teachers</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[100px]">Staff</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Fee Collected</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Pending Fees</th>
                          <th className="py-4 pl-4 pr-6 text-center whitespace-nowrap min-w-[130px]">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {reportData.by_school?.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-12 text-center text-slate-400 italic text-sm">
                              No school metrics matching search parameters.
                            </td>
                          </tr>
                        ) : (
                          reportData.by_school?.map((school) => (
                            <tr key={school.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 pl-6 pr-4 whitespace-nowrap font-semibold text-slate-900">
                                {school.name}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
                                  {school.plan?.name || "No Plan"}
                                </span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center font-semibold text-slate-800">
                                {school.students_count || 0}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center font-semibold text-slate-800">
                                {school.teachers_count || 0}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center font-semibold text-slate-800">
                                {school.staff_count || 0}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-semibold text-emerald-600">
                                ₹{(school.fee_collected || 0).toLocaleString()}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-semibold text-rose-600">
                                ₹{(school.pending_fees || 0).toLocaleString()}
                              </td>
                              <td className="py-4 pl-4 pr-6 whitespace-nowrap text-center font-mono text-xs text-slate-600">
                                {school.attendance_present || 0} Present
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Tab Content: Detailed Lists */}
        {activeTab !== "overview" && (
          <div className="space-y-4">
            {/* Search Filter for Drilldown */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center max-w-sm gap-2">
              <FaSearch className="text-slate-400 text-sm ml-1" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>

            {/* Drilldown Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              {listLoading ? (
                <div className="py-24 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {activeTab === "students" && (
                          <>
                            <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Student Name</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Admission No</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[100px]">Roll No</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Institution</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Class & Section</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Email Address</th>
                            <th className="py-4 pl-4 pr-6 text-center whitespace-nowrap min-w-[100px]">Status</th>
                          </>
                        )}
                        {activeTab === "teachers" && (
                          <>
                            <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Teacher Name</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Employee ID</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Email Address</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Institution</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Phone No</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Joining Date</th>
                            <th className="py-4 pl-4 pr-6 text-center whitespace-nowrap min-w-[100px]">Status</th>
                          </>
                        )}
                        {activeTab === "staff" && (
                          <>
                            <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Staff Name</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Employee ID</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Email Address</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Institution</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Dept & Designation</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Phone No</th>
                            <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Joining Date</th>
                            <th className="py-4 pl-4 pr-6 text-center whitespace-nowrap min-w-[100px]">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {detailRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={activeTab === "students" ? 7 : activeTab === "teachers" ? 7 : 8}
                            className="py-12 text-center text-slate-400 italic text-sm"
                          >
                            No records matching query.
                          </td>
                        </tr>
                      ) : (
                        detailRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                            {activeTab === "students" && (
                              <>
                                <td className="py-4 pl-6 pr-4 whitespace-nowrap font-semibold text-slate-900">
                                  {record.full_name}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="flex flex-col font-mono text-xs">
                                    <span className="text-slate-700 font-medium">{record.admission_no || "—"}</span>
                                    {record.student_id && (
                                      <span className="text-[11px] text-slate-400 font-normal">
                                        ID: {record.student_id}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                                  {record.roll_no || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                  {record.school?.name || record.school_name || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-700">
                                  {record.class || record.class_name ? (
                                    <span>
                                      {record.class || record.class_name}{" "}
                                      {record.section ? `(${record.section})` : ""}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-normal">
                                  {record.email || "—"}
                                </td>
                                <td className="py-4 pl-4 pr-6 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      record.is_active || record.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                    }`}
                                  >
                                    {record.is_active || record.status === "active" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </>
                            )}

                            {activeTab === "teachers" && (
                              <>
                                <td className="py-4 pl-6 pr-4 whitespace-nowrap font-semibold text-slate-900">
                                  {record.full_name}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600 font-medium">
                                  {record.employee_id || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-normal">
                                  {record.email || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                  {record.school?.name || record.school_name || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                                  {record.phone || record.mobile || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                  {record.joining_date || "—"}
                                </td>
                                <td className="py-4 pl-4 pr-6 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      record.is_active || record.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                    }`}
                                  >
                                    {record.is_active || record.status === "active" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </>
                            )}

                            {activeTab === "staff" && (
                              <>
                                <td className="py-4 pl-6 pr-4 whitespace-nowrap font-semibold text-slate-900">
                                  {record.full_name}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600 font-medium">
                                  {record.employee_id || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-normal">
                                  {record.email || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                  {record.school?.name || record.school_name || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                  <div className="flex flex-col text-xs">
                                    <span className="text-slate-800 font-medium">{record.designation || "—"}</span>
                                    {record.department && (
                                      <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                                        Dept: {record.department}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                                  {record.phone || record.mobile || "—"}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                  {record.joining_date || "—"}
                                </td>
                                <td className="py-4 pl-4 pr-6 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      record.is_active || record.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                    }`}
                                  >
                                    {record.is_active || record.status === "active" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {totalCount > pageSize && (
                <div className="px-6 py-4 border-t border-slate-100 bg-white">
                  <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}