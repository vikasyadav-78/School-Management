"use client";

import { useEffect, useState, useRef } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Link from "next/link";
import {
  FaGraduationCap, FaCalendarAlt, FaCheckCircle, FaHourglassHalf,
  FaClipboardList, FaUsers, FaArrowRight, FaSearch, FaTimes, FaUndo
} from "react-icons/fa";
import { getTeacherExams } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherMarksExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);

  const endDateInputRef = useRef(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getTeacherExams();
      setExams(response.exams || response.data || response || []);
    } catch (err) {
      const errMsg = err.message || err;
      setError(errMsg);
      toast.error("Failed to load exams: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val && !endDate) {
      setTimeout(() => {
        if (endDateInputRef.current) {
          endDateInputRef.current.focus();
          if (typeof endDateInputRef.current.showPicker === "function") {
            try {
              endDateInputRef.current.showPicker();
            } catch (e) {
              if (process.env.NODE_ENV === "development") {
                console.log("showPicker not supported directly:", e);
              }
            }
          }
        }
      }, 100);
    }
  };

  const handleEndDateChange = (val) => {
    if (startDate && val) {
      const start = new Date(startDate);
      const end = new Date(val);
      if (end < start) {
        toast.error("End Date cannot be earlier than Start Date.");
        setEndDate("");
        return;
      }
    }
    setEndDate(val);
  };

  const handleClearDateFilter = (e) => {
    e.stopPropagation();
    setStartDate("");
    setEndDate("");
    setShowDatePickerPopover(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load exams list: {error}
      </div>
    );
  }

  // Filter exams locally
  const filteredExams = exams.filter((exam) => {
    if (debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase();
      const nameMatch = exam.name?.toLowerCase().includes(q);
      const typeMatch = exam.type_label?.toLowerCase().includes(q) || exam.type?.toLowerCase().includes(q);
      if (!nameMatch && !typeMatch) return false;
    }

    if (startDate && endDate) {
      const examStart = exam.start_date ? new Date(exam.start_date) : null;
      const examEnd = exam.end_date ? new Date(exam.end_date) : null;

      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);

      if (examStart && examStart > filterEnd) return false;
      if (examEnd && examEnd < filterStart) return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== "" || (startDate !== "" && endDate !== "");
  const hasAnyDateSelected = startDate !== "" || endDate !== "";

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader
        title="Exam Marks Entry"
        subtitle="Manage student report cards by entering theory, practical, and internal assessment marks."
      />

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search exams by name or type (e.g. half yearly)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>

        {/* Date Filters Popover & Clear */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDatePickerPopover(!showDatePickerPopover)}
              className="px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold hover:bg-zinc-100 transition-all text-zinc-800 flex items-center gap-2 min-w-[200px] justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FaCalendarAlt className="text-zinc-400 w-3.5 h-3.5" />
                <span>
                  {startDate && endDate
                    ? `${formatDate(startDate)} → ${formatDate(endDate)}`
                    : "Select Date Range"}
                </span>
              </span>
              {hasAnyDateSelected && (
                <span
                  onClick={handleClearDateFilter}
                  className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-600 transition-all"
                  title="Clear Date Filter"
                >
                  <FaTimes className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* Custom Popover */}
            {showDatePickerPopover && (
              <div className="absolute right-0 mt-2 p-4 bg-white border border-zinc-200 shadow-2xl rounded-2xl z-50 space-y-4 w-72 animate-fade-in text-left">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <span className="font-bold text-zinc-800 text-xs">Select Date Range</span>
                  <button
                    onClick={() => setShowDatePickerPopover(false)}
                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800 font-mono cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">End Date</label>
                    <input
                      type="date"
                      ref={endDateInputRef}
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800 font-mono cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                  <button
                    onClick={handleClearDateFilter}
                    disabled={!hasAnyDateSelected}
                    className="text-[10px] text-zinc-400 hover:text-rose-600 font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                  <button
                    onClick={() => {
                      if (startDate && !endDate) {
                        toast.error("Please select both start and end dates.");
                      } else {
                        setShowDatePickerPopover(false);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer border border-zinc-200/50"
            >
              <FaTimes className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <FaGraduationCap className="w-12 h-12 text-zinc-300 mx-auto" />
          <div>
            <h3 className="text-zinc-700 font-extrabold uppercase tracking-wider text-xs">No Exams Found</h3>
            <p className="text-zinc-400 text-xs mt-1 font-semibold leading-relaxed">
              No academic exams match your active search name, type, or duration filters.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
            >
              <FaUndo className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredExams.map((exam) => {
            const startDateLabel = exam.start_date ? new Date(exam.start_date).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" }) : "";
            const endDateLabel = exam.end_date ? new Date(exam.end_date).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" }) : "";
            const isApproved = exam.admin_approval_status?.toLowerCase() === "approved";
            const isPublished = exam.is_published;

            return (
              <div
                key={exam.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300/80 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-100 uppercase tracking-wider">
                        {exam.type_label || exam.type || "Examination"}
                      </span>
                      <h3 className="font-extrabold text-zinc-900 text-sm mt-1.5 leading-tight tracking-tight">
                        {exam.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${isPublished
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                        {isPublished ? "Published" : "Draft"}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                        {exam.admin_approval_status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Date range & Schedule details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 font-semibold pt-1 font-mono">
                    <span className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-zinc-400 w-3 h-3" />
                      {startDateLabel && endDateLabel ? `${startDateLabel} – ${endDateLabel}` : "Date Range Not Configured"}
                    </span>
                    <span className="flex items-center gap-1.5 sm:border-l sm:border-zinc-200 sm:pl-4">
                      <FaClipboardList className="text-zinc-400 w-3 h-3" />
                      {exam.schedules_count || 0} Subject Schedules
                    </span>
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Assigned Classes</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(exam.classes || []).map((c, idx) => {
                      const totalSubjects = c.schedule_count || 0;
                      const completedSubjects = Math.min(c.marks_entered || 0, totalSubjects);
                      const isComplete = completedSubjects === totalSubjects && totalSubjects > 0;
                      return (
                        <div
                          key={idx}
                          className="flex flex-row items-center justify-between p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-violet-100 hover:bg-zinc-50/50 transition-all gap-4"
                        >
                          {/* Left Side: Class Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 bg-violet-600 rounded-full shrink-0" />
                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-zinc-900 text-xs whitespace-nowrap">
                                {c.class_name}-{c.section_name}
                              </h4>
                              <div className="flex flex-col text-[10px] text-zinc-500 font-semibold leading-relaxed">
                                <span className="whitespace-nowrap">Students: {c.student_count || 0}</span>
                                <span className="whitespace-nowrap">Subjects: {c.schedule_count || 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Action & Status Stacking */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider whitespace-nowrap min-w-[120px] text-center min-h-[26px] ${totalSubjects === 0
                                ? "bg-zinc-50 text-zinc-400 border-zinc-200"
                                : isComplete
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                              {totalSubjects === 0 ? <FaTimes className="shrink-0 w-2.5 h-2.5" /> : isComplete ? <FaCheckCircle className="shrink-0 w-2.5 h-2.5" /> : <FaHourglassHalf className="shrink-0 w-2.5 h-2.5" />}
                              {totalSubjects === 0 ? "No Schedule" : isComplete ? "Completed" : `${completedSubjects} / ${totalSubjects} Completed`}
                            </span>

                            {totalSubjects > 0 ? (
                              <Link
                                href={`/teacher/marks/entry?exam_id=${exam.id}&class_id=${c.school_class_id}&section_id=${c.section_id}`}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 hover:shadow-sm text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-xs whitespace-nowrap min-w-[120px] text-center min-h-[26px]"
                              >
                                <span>Enter Marks</span>
                                <FaArrowRight className="w-2.5 h-2.5 shrink-0" />
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="px-3 py-1.5 bg-zinc-100 text-zinc-400 rounded-lg font-bold flex items-center justify-center gap-1.5 text-xs whitespace-nowrap min-w-[120px] text-center min-h-[26px] cursor-not-allowed opacity-70 border border-zinc-200/50"
                              >
                                <span>No Subjects</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(!exam.classes || exam.classes.length === 0) && (
                      <div className="text-center py-4 text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
                        No Assigned Classes Available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}