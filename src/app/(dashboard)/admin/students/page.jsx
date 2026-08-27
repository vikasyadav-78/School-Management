"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaChevronRight, FaUsers, FaUserCheck, FaChalkboardTeacher, 
  FaTimes, FaDownload, FaUpload, FaFileExcel, FaChartBar, FaExchangeAlt,
  FaCalendarCheck, FaNetworkWired, FaBook, FaHospital, FaArrowLeft
} from "react-icons/fa";
import { fetchStudentsMeta } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";
import { downloadImportTemplate, importStudents } from "@/features/students/services/module.service";
import {
  getClassReportsStrength,
  getClassReportsClassStudents,
  getClassReportsSectionStudents,
  getClassReportsAttendance,
  getClassReportsSubjectTeachers,
  getClassReportsTransfers
} from "@/features/admin/services/admin.service";

export default function StudentsClassDirectoryPage() {
  const dispatch = useDispatch();
  const { classSummaries, loading: metaLoading, list: studentsList } = useSelector((state) => state.students);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-08");

  // Tab View state
  const [pageTab, setPageTab] = useState("directory"); // directory, reports

  // Reports specific states
  const [reportsLoading, setReportsLoading] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState("strength"); // strength, class-students, section-students, attendance, subject-teachers, transfers
  
  const [strengthReport, setStrengthReport] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [attendanceMonth, setAttendanceMonth] = useState("2026-08");
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  const [transfersReport, setTransfersReport] = useState([]);

  // Selected filters for reports
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  // Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  const handleDownloadTemplate = async () => {
    try {
      toast.loading("Downloading template...", { id: "download-template" });
      const blob = await downloadImportTemplate();
      
      if (blob.type === "application/json") {
        const text = await blob.text();
        let errObj = {};
        try {
          errObj = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Failed to parse JSON error blob", e);
        }
        throw new Error(errObj.message || "Failed to download template.");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Template downloaded successfully!", { id: "download-template" });
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to download template.";
      try {
        if (err instanceof Blob) {
          const text = await err.text();
          const errObj = JSON.parse(text);
          errorMsg = errObj.message || errorMsg;
        } else if (err && err.response && err.response.data instanceof Blob) {
          const text = await err.response.data.text();
          const errObj = JSON.parse(text);
          errorMsg = errObj.message || errorMsg;
        } else if (err && err.message) {
          errorMsg = err.message;
        }
      } catch (e) {
        console.error("Failed to parse error blob", e);
      }
      toast.error(errorMsg, { id: "download-template" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Please select a valid Excel file (.xlsx)");
        return;
      }
      setSelectedFile(file);
      setImportErrors([]);
      setImportSuccessMessage("");
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to import.");
      return;
    }

    try {
      setUploading(true);
      setImportErrors([]);
      setImportSuccessMessage("");
      toast.loading("Importing students...", { id: "import-students" });

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await importStudents(formData);
      
      if (res.success) {
        toast.success(res.message || "Students imported successfully!", { id: "import-students" });
        setImportSuccessMessage(res.message || "Students imported successfully!");
        setSelectedFile(null);
        dispatch(fetchStudentsMeta());
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccessMessage("");
        }, 1500);
      } else {
        toast.error(res.message || "Failed to import students.", { id: "import-students" });
        if (res.errors) {
          const errs = Object.values(res.errors).flat();
          setImportErrors(errs);
        } else if (res.failures) {
          const errs = res.failures.map(f => `Row ${f.row}: ${f.errors.join(", ")}`);
          setImportErrors(errs);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to import students.", { id: "import-students" });
      const data = err.response?.data;
      if (data?.errors) {
        const errs = Object.values(data.errors).flat();
        setImportErrors(errs);
      } else if (data?.failures) {
        const errs = data.failures.map(f => `Row ${f.row}: ${f.errors.join(", ")}`);
        setImportErrors(errs);
      } else if (data?.message) {
        setImportErrors([data.message]);
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchStudentsMeta());
  }, [dispatch]);

  // Load individual class reports
  const loadClassReportData = async (reportType) => {
    setReportsLoading(true);
    try {
      if (reportType === "strength") {
        const res = await getClassReportsStrength();
        setStrengthReport(res.rows || []);
      } else if (reportType === "class-students") {
        const params = {};
        if (selectedClassId && selectedClassId !== "all") {
          params.class_id = selectedClassId;
        }
        const res = await getClassReportsClassStudents(params);
        setClassStudents(res.students || []);
      } else if (reportType === "section-students") {
        const res = await getClassReportsSectionStudents({ section_id: selectedSectionId });
        setSectionStudents(res.students || []);
      } else if (reportType === "attendance") {
        const res = await getClassReportsAttendance({ month: attendanceMonth });
        setAttendanceReport(res.rows || []);
      } else if (reportType === "subject-teachers") {
        const res = await getClassReportsSubjectTeachers();
        setSubjectTeachers(res.rows || []);
      } else if (reportType === "transfers") {
        const res = await getClassReportsTransfers();
        setTransfersReport(res.transfers || []);
      }
    } catch (err) {
      toast.error("Failed to load class report metrics: " + (err.message || err));
    } finally {
      setReportsLoading(false);
    }
  };

  // Re-fetch when report tab or filters change
  useEffect(() => {
    if (pageTab === "reports") {
      loadClassReportData(activeReportTab);
    }
  }, [pageTab, activeReportTab, selectedClassId, selectedSectionId]);

  // Real-time Class Card search filtering and dynamic new/existing count calculations
  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const [selYear, selMonth] = selectedMonth.split("-").map(Number);
    const targetMonthIndex = selMonth - 1;

    const getCreationDateFromId = (id) => {
      if (!id || typeof id !== "string") return null;
      const cleanId = id.replace(/-/g, "");
      if (cleanId.length < 12) return null;
      const hexTimestamp = cleanId.substring(0, 12);
      const ms = parseInt(hexTimestamp, 16);
      if (isNaN(ms) || ms < 1000000000000) return null;
      return new Date(ms);
    };

    const getStudentDate = (s) => {
      if (s.admission_date) return new Date(s.admission_date);
      return getCreationDateFromId(s.id);
    };

    const mappedSummaries = classSummaries.map((cls) => {
      const classStudents = (studentsList || []).filter(s => s.school_class_id === cls.id);
      
      const newCount = classStudents.filter(s => {
        const date = getStudentDate(s);
        return date && date.getMonth() === targetMonthIndex && date.getFullYear() === selYear;
      }).length;

      return {
        ...cls,
        newStudents: newCount,
        existingStudents: Math.max(0, cls.totalStudents - newCount)
      };
    });

    mappedSummaries.sort((a, b) => {
      const getNumericVal = (classNameStr) => {
        const match = String(classNameStr).match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      return getNumericVal(a.className) - getNumericVal(b.className);
    });

    if (!query) return mappedSummaries;

    return mappedSummaries.filter((cls) => {
      const clsNameStr = String(cls.className).toLowerCase();
      const fullLabel = `class ${clsNameStr}`;
      return clsNameStr.includes(query) || fullLabel.includes(query);
    });
  }, [classSummaries, studentsList, searchQuery, selectedMonth]);

  const monthFilter = (
    <div className="flex items-center gap-2">
      {pageTab === "directory" ? (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value || "2026-08")}
          className="px-4 py-2 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
        />
      ) : null}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader
          title="Students & Classes Directory"
          subtitle="Manage student details, classes, and sections for the academic year."
          action={monthFilter}
        />

        {/* Tab Selection headers */}
        <div className="flex border-b border-zinc-200">
          <button 
            onClick={() => setPageTab("directory")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${pageTab === "directory" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaUsers className="inline mr-1.5 text-xl" /> Class Directory
          </button>
          <button 
            onClick={() => setPageTab("reports")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${pageTab === "reports" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaChartBar className="inline mr-1.5 text-xl" /> Classes Reports & Analytics
          </button>
        </div>

        {/* --- VIEW 1: DIRECTORY --- */}
        {pageTab === "directory" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-800">Class Directory</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <FaSearch className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search classes (e.g. 10, Class 5)..."
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="whitespace-nowrap font-bold shadow-sm"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  Import Students
                </Button>
                <Link href="/admin/classes">
                  <Button size="sm" className="whitespace-nowrap shadow-sm">
                    Create Class
                  </Button>
                </Link>
              </div>
            </div>

            {metaLoading ? (
              <div className="py-12">
                <PageLoader />
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState
                title="No classes found"
                desc={`We couldn't find any classes matching "${searchQuery}". Please refine your search.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.className}
                    className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300 p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-zinc-900 text-base">Class {cls.className}</h3>
                        {cls.isStreamBased ? (
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider w-43">
                            Streams: {cls.streams && cls.streams.length > 0 ? cls.streams.join(", ") : "—"}
                          </p>
                        ) : (
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                            Sections: {cls.sections && cls.sections.length > 0 ? cls.sections.join(", ") : "—"}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                        {cls.isStreamBased 
                          ? `${cls.totalSections} ${cls.totalSections === 1 ? "Section" : "Sections"}`
                          : `${cls.sections?.length || 0} ${cls.sections?.length === 1 ? "Section" : "Sections"}`
                        }
                      </span>
                    </div>

                    <div className="border-t border-b border-zinc-100 py-3.5 space-y-2.5 text-xs text-zinc-650">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-zinc-400" />
                          <span className="font-semibold text-zinc-500">Total Students</span>
                        </div>
                        <span className="font-bold text-zinc-800">{cls.totalStudents}</span>
                      </div>
                      <div className="border-t border-zinc-100/50"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FaUserCheck className="text-emerald-500" />
                          <span className="font-semibold text-zinc-500">New Students</span>
                        </div>
                        <span className="font-bold text-emerald-600">+{cls.newStudents}</span>
                      </div>
                      <div className="border-t border-zinc-100/50"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] text-zinc-400 font-extrabold">E</span>
                          <span className="font-semibold text-zinc-500">Existing Students</span>
                        </div>
                        <span className="font-bold text-zinc-700">{cls.existingStudents}</span>
                      </div>
                      <div className="border-t border-zinc-100/50"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FaChalkboardTeacher className="text-zinc-400" />
                          <span className="font-semibold text-zinc-500">Class Teachers</span>
                        </div>
                        <span className="font-bold text-zinc-800">{cls.classTeachers}</span>
                      </div>
                    </div>

                    <Link href={`/admin/students/class/${cls.className}`} className="block">
                      <button className="w-full py-2.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow">
                        View Students
                        <FaChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: REPORTS & ANALYTICS --- */}
        {pageTab === "reports" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar menu list for reports */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block border-b border-zinc-100 pb-2">Class Reports Modules</span>
              <div className="space-y-1">
                {[
                  { id: "strength", label: "Class Strength Report", desc: "Rosters and students count per class" },
                  { id: "class-students", label: "Class Student List", desc: "View student directories by class" },
                  { id: "section-students", label: "Section Student List", desc: "View student directories by section" },
                  { id: "attendance", label: "Monthly Attendance", desc: "Class attendance summary statistics" },
                  { id: "subject-teachers", label: "Subject-Teacher Maps", desc: "Academics faculty distribution registry" },
                  { id: "transfers", label: "Student Transfers", desc: "Academic transfer registry history log" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveReportTab(item.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${activeReportTab === item.id ? "bg-violet-50 text-violet-700 border-l-4 border-violet-600" : "hover:bg-zinc-50 text-zinc-650"}`}
                  >
                    <span className="font-extrabold text-[11px] block">{item.label}</span>
                    <span className="text-[9px] text-zinc-400 block font-medium mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main report data viewer */}
            <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
              
              {reportsLoading ? (
                <div className="flex items-center justify-center grow py-12">
                  <PageLoader />
                </div>
              ) : (
                <div className="grow space-y-6">
                  
                  {/* --- REPORT 1: CLASS STRENGTH --- */}
                  {activeReportTab === "strength" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-2">
                        <h3 className="text-sm font-black text-zinc-800">Class-wise Students Strength</h3>
                        <p className="text-[10px] text-zinc-450 mt-0.5">Summary count of enrolled students mapped to respective classes and sections.</p>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class Name</th>
                              <th className="p-3">Total Students Count</th>
                              <th className="p-3">Sections Breakdown</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {strengthReport.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-zinc-400">No records found.</td>
                              </tr>
                            ) : (
                              strengthReport.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-800 capitalize">{row.name}</td>
                                  <td className="p-3 font-bold text-violet-600">{row.students_count} students</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1.5">
                                      {row.sections?.map((sec) => (
                                        <span key={sec.id} className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600">
                                          Sec {sec.name}: {sec.students_count} students
                                        </span>
                                      )) || "—"}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- REPORT 2: CLASS-WISE STUDENTS --- */}
                  {activeReportTab === "class-students" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-sm font-black text-zinc-800">Class Roster Directory</h3>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Filter and query enrolled student profiles mapped directly to class levels.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Class</label>
                          <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-800 outline-none font-bold"
                          >
                            <option value="all">All Classes</option>
                            {classSummaries.map((cls) => (
                              <option key={cls.id} value={cls.id}>Class {cls.className}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Admission No</th>
                              <th className="p-3">Roll No</th>
                              <th className="p-3">Class Level</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {classStudents.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-400">No students are currently allocated.</td>
                              </tr>
                            ) : (
                              classStudents.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-800">{row.full_name}</td>
                                  <td className="p-3">{row.admission_no || "—"}</td>
                                  <td className="p-3 font-bold text-zinc-700">{row.roll_no || "—"}</td>
                                  <td className="p-3 capitalize">{row.class} - {row.section}</td>
                                  <td className="p-3 text-right">
                                    <Link href={`/admin/students/profile/${row.id}`} className="text-violet-600 hover:text-violet-700 font-bold">
                                      View Profile &rarr;
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- REPORT 3: SECTION-WISE STUDENTS --- */}
                  {activeReportTab === "section-students" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-sm font-black text-zinc-800">Section Roster Directory</h3>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Filter and query enrolled student profiles mapped directly to class section streams.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Section ID</label>
                          <input 
                            type="text"
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            placeholder="Paste Section UUID..."
                            className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-800 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Admission No</th>
                              <th className="p-3">Roll No</th>
                              <th className="p-3">Class/Section</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {!selectedSectionId ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-400">Enter a Section UUID in the input filter above to list section-specific students.</td>
                              </tr>
                            ) : sectionStudents.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-400">No students are currently allocated to this section.</td>
                              </tr>
                            ) : (
                              sectionStudents.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-800">{row.full_name}</td>
                                  <td className="p-3">{row.admission_no || "—"}</td>
                                  <td className="p-3 font-bold text-zinc-700">{row.roll_no || "—"}</td>
                                  <td className="p-3 capitalize">{row.class} - {row.section}</td>
                                  <td className="p-3 text-right">
                                    <Link href={`/admin/students/profile/${row.id}`} className="text-violet-600 hover:text-violet-700 font-bold">
                                      View Profile &rarr;
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- REPORT 4: MONTHLY ATTENDANCE --- */}
                  {activeReportTab === "attendance" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-black text-zinc-800">Class Attendance Summary Report</h3>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Review monthly summaries, active presents, absents, and total logs breakdown.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-zinc-450 uppercase text-[9px]">Select Month</label>
                          <input 
                            type="month"
                            value={attendanceMonth}
                            onChange={(e) => {
                              setAttendanceMonth(e.target.value);
                              loadClassReportData("attendance");
                            }}
                            className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-zinc-800 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class</th>
                              <th className="p-3">Section</th>
                              <th className="p-3">Present</th>
                              <th className="p-3">Absent</th>
                              <th className="p-3">Late Log</th>
                              <th className="p-3">Half Day</th>
                              <th className="p-3 text-right">Total Logs</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {attendanceReport.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-4 text-center text-zinc-400">No attendance reports logs found for the selected month.</td>
                              </tr>
                            ) : (
                              attendanceReport.map((row, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-800 capitalize">{row.class_name}</td>
                                  <td className="p-3 font-bold text-zinc-800">{row.section_name}</td>
                                  <td className="p-3 text-emerald-650 font-bold">{row.present}</td>
                                  <td className="p-3 text-rose-550 font-bold">{row.absent}</td>
                                  <td className="p-3">{row.late}</td>
                                  <td className="p-3">{row.half_day}</td>
                                  <td className="p-3 font-bold text-zinc-800 text-right">{row.total}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- REPORT 5: SUBJECT TEACHERS --- */}
                  {activeReportTab === "subject-teachers" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-2">
                        <h3 className="text-sm font-black text-zinc-800">Class Subject-Teacher Registry</h3>
                        <p className="text-[10px] text-zinc-450 mt-0.5">Faculty distribution registry mapping subject curriculums to active classroom instructors.</p>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Class</th>
                              <th className="p-3">Subject Name</th>
                              <th className="p-3">Assigned Faculty</th>
                              <th className="p-3 text-right">Employee Code</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {subjectTeachers.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-zinc-400">No subject teacher allocations recorded.</td>
                              </tr>
                            ) : (
                              subjectTeachers.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-800 capitalize">{row.class}</td>
                                  <td className="p-3 font-bold text-violet-600 capitalize">{row.subject}</td>
                                  <td className="p-3 font-bold text-zinc-700">{row.teacher || "—"}</td>
                                  <td className="p-3 text-right text-zinc-450">{row.employee_id || "—"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- REPORT 6: TRANSFERS HISTORY --- */}
                  {activeReportTab === "transfers" && (
                    <div className="space-y-4">
                      <div className="border-b border-zinc-100 pb-2">
                        <h3 className="text-sm font-black text-zinc-800">Student Transfer History Logs</h3>
                        <p className="text-[10px] text-zinc-450 mt-0.5">Audit registry logs tracking classroom reallocation and student transfers.</p>
                      </div>

                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">From Class (Section)</th>
                              <th className="p-3">To Class (Section)</th>
                              <th className="p-3 text-right">Transferred By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                            {transfersReport.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-zinc-400">No transfer history records exist.</td>
                              </tr>
                            ) : (
                              transfersReport.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-50/50">
                                  <td className="p-3 font-bold text-zinc-850">{new Date(row.created_at).toLocaleDateString()}</td>
                                  <td className="p-3 font-bold text-zinc-800">{row.student_name}</td>
                                  <td className="p-3">{row.from_class} ({row.from_section})</td>
                                  <td className="p-3">{row.to_class} ({row.to_section})</td>
                                  <td className="p-3 font-bold text-zinc-700 text-right">{row.by}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileExcel className="text-emerald-500 w-4 h-4" />
                Import Students from Excel
              </h3>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportErrors([]); setImportSuccessMessage(""); setSelectedFile(null); }} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-zinc-600 font-semibold">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2">
                <p className="text-[11px] text-zinc-600 leading-relaxed font-semibold">
                  Use our sample template to format your student records correctly. Columns like <code className="text-violet-600 bg-violet-50 px-1 py-0.5 rounded font-mono font-bold">first_name</code> are mandatory. Ensure the class names match existing records.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  <FaDownload className="w-2.5 h-2.5" /> Download Excel Template
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block">Excel File</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400 space-y-1">
                      <FaUpload className="w-6 h-6 text-zinc-350" />
                      <p className="font-bold text-[11px] text-zinc-500">
                        {selectedFile ? selectedFile.name : "Click to select student Excel roster"}
                      </p>
                      <p className="text-[9px] font-semibold text-zinc-400">XLSX file format only</p>
                    </div>
                    <input type="file" className="hidden" accept=".xlsx" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-rose-700 space-y-1">
                  <span className="font-extrabold text-[10px] uppercase block">Failed to import due to validation errors:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    {importErrors.slice(0, 10).map((err, i) => (
                      <li key={i} className="font-bold">{err}</li>
                    ))}
                    {importErrors.length > 10 && <li className="font-bold">& {importErrors.length - 10} more failures...</li>}
                  </ul>
                </div>
              )}

              {importSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-700 font-bold flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                  {importSuccessMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsImportModalOpen(false); setImportErrors([]); setImportSuccessMessage(""); setSelectedFile(null); }}
                  className="font-bold text-xs py-2 px-4 shadow-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="font-bold text-white bg-violet-600 hover:bg-violet-700 text-xs py-2 px-4 rounded-xl shadow-sm"
                >
                  {uploading ? "Importing Roster..." : "Upload & Parse"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
