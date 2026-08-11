"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import { FaSearch, FaChevronRight, FaUsers, FaUserCheck, FaChalkboardTeacher, FaTimes, FaDownload, FaUpload, FaFileExcel } from "react-icons/fa";
import { fetchStudentsMeta } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";
import { downloadImportTemplate, importStudents } from "@/features/students/services/module.service";

export default function StudentsClassDirectoryPage() {
  const dispatch = useDispatch();
  const { classSummaries, loading, list: studentsList } = useSelector((state) => state.students);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-08");

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
        // Refresh directory data
        dispatch(fetchStudentsMeta());
        // Close modal after a delay
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
      // Find students belonging to this class ID
      const classStudents = (studentsList || []).filter(s => s.school_class_id === cls.id);
      
      // Calculate dynamic new students based on selectedMonth
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

    // Sort classes numerically (e.g. Class 1, Class 2, Class 3... Class 11)
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
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value || "2026-08")}
        className="px-4 py-2 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Students Directory"
        subtitle="Manage student details, classes, and sections for the academic year."
        action={monthFilter}
      />

      {/* Class Search and Filter Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
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
            variant="secondary"
            className="whitespace-nowrap shadow-sm text-white bg-white border border-zinc-200 hover:bg-zinc-50 font-bold"
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

      {loading ? (
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
              {/* Header block with Class Name */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-zinc-800 text-base">Class {cls.className}</h3>
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

              {/* Counts metrics grid with dividers */}
              <div className="border-t border-b border-zinc-100 py-3.5 space-y-2.5 text-xs text-zinc-600">
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

              {/* Direct Footer Action Link */}
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

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            
            {/* Modal Header */}
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

            {/* Modal Content */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-zinc-600 font-semibold">
              
              {/* Info Alert */}
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

              {/* File Dropzone / Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Select Excel File (.xlsx) *</label>
                <div className="relative border-2 border-dashed border-zinc-200 hover:border-violet-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/20">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <FaUpload className="w-6 h-6 text-zinc-450 mx-auto" />
                    <p className="text-zinc-550 font-bold text-[11px]">
                      {selectedFile ? selectedFile.name : "Drag & drop file or click to browse"}
                    </p>
                    {selectedFile && (
                      <p className="text-[10px] text-zinc-400">
                        File Size: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Error Reports */}
              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[11px] rounded-xl font-bold">
                  {importSuccessMessage}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-500 uppercase block">Validation Failures / Errors ({importErrors.length})</label>
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl max-h-36 overflow-y-auto custom-scrollbar space-y-1.5">
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="text-rose-600 text-[10px] font-bold leading-normal flex items-start gap-1">
                        <span className="shrink-0">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportErrors([]); setImportSuccessMessage(""); setSelectedFile(null); }}
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:bg-zinc-250 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  {uploading ? "Importing..." : "Import Students"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
