"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaCalendarAlt, FaSearch, FaRegCalendar, FaThLarge, 
  FaInfoCircle, FaCalendarCheck, FaClock, FaHistory, FaTimes, FaExternalLinkAlt
} from "react-icons/fa";
import { fetchStudentHolidays, fetchStudentHolidayDetail } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";

export default function StudentHolidaysPage() {
  const dispatch = useDispatch();
  const { holidays, holidayDetail, loadingHolidayDetail, loading, error } = useSelector((state) => state.students);

  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "upcoming" | "ongoing" | "past"
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("card"); // "card" | "calendar"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    dispatch(fetchStudentHolidays());
  }, [dispatch]);

  if (loading && !holidays) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load holidays: {error}
      </div>
    );
  }

  const holidayList = Array.isArray(holidays) ? holidays : (holidays?.holidays || []);

  // Sort: Newest holidays first based on announced_at or from_date
  const sortedHolidays = [...holidayList].sort((a, b) => new Date(b.from_date || 0) - new Date(a.from_date || 0));

  // Summary counts
  const totalCount = sortedHolidays.length;
  const upcomingCount = sortedHolidays.filter(h => h.is_upcoming || h.status?.toLowerCase() === "upcoming").length;
  const ongoingCount = sortedHolidays.filter(h => h.is_ongoing || h.status?.toLowerCase() === "ongoing").length;
  const pastCount = sortedHolidays.filter(h => h.status?.toLowerCase() === "past" || (!h.is_upcoming && !h.is_ongoing)).length;

  // Filtered list
  const filteredHolidays = sortedHolidays.filter(h => {
    // 1. Filter Tab
    if (activeFilter === "upcoming" && !(h.is_upcoming || h.status?.toLowerCase() === "upcoming")) return false;
    if (activeFilter === "ongoing" && !(h.is_ongoing || h.status?.toLowerCase() === "ongoing")) return false;
    if (activeFilter === "past" && h.status?.toLowerCase() !== "past" && (h.is_upcoming || h.is_ongoing)) return false;

    // 2. Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = h.title?.toLowerCase().includes(q);
      const descMatch = h.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }

    return true;
  });

  const getStatusBadge = (h) => {
    if (h.is_ongoing || h.status?.toLowerCase() === "ongoing") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
          Ongoing
        </span>
      );
    }
    if (h.is_upcoming || h.status?.toLowerCase() === "upcoming") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider">
          Upcoming
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-500 uppercase tracking-wider">
        Past
      </span>
    );
  };

  const handleOpenDetail = (id) => {
    setIsModalOpen(true);
    dispatch(fetchStudentHolidayDetail(id));
  };

  // --- Calendar Builder Helper Helpers ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { startDay, totalDays };
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const { startDay, totalDays } = getDaysInMonth(currentMonth);
  const calendarCells = [];
  
  // Fill blank cells at start
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  
  // Fill actual dates
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }

  // Check if date lies within any holiday range
  const getHolidayForDate = (date) => {
    if (!date) return null;
    return holidayList.find(h => {
      const start = new Date(h.from_date);
      const end = new Date(h.to_date);
      const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return target >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             target <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Holidays & Vacations"
          subtitle="Stay informed with upcoming academic seasonal breaks, calendar events, and declared holidays."
        />
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/50 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[10px] ${
              viewMode === "card" 
                ? "bg-white text-zinc-800 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <FaThLarge className="w-3.5 h-3.5" />
            <span>Card View</span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[10px] ${
              viewMode === "calendar" 
                ? "bg-white text-zinc-800 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <FaRegCalendar className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Holidays</span>
          <h3 className="text-xl font-extrabold text-zinc-800 mt-1">{totalCount}</h3>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Upcoming</span>
          <h3 className="text-xl font-extrabold text-blue-700 mt-1">{upcomingCount}</h3>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Ongoing</span>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{ongoingCount}</h3>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center animate-pulse-once">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Past</span>
          <h3 className="text-xl font-extrabold text-zinc-600 mt-1">{pastCount}</h3>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 md:pb-0 scrollbar-none">
          {["all", "upcoming", "ongoing", "past"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeFilter === tab
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border border-zinc-200/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search holidays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>
      </div>

      {/* Views */}
      {viewMode === "card" ? (
        filteredHolidays.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Holidays Available</span>
            <span className="text-zinc-400/80 text-[10px]">No academic holidays match your active filter or search term.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHolidays.map((h) => (
              <div 
                key={h.id} 
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group text-left"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-extrabold text-zinc-800 text-sm group-hover:text-violet-600 transition-colors line-clamp-1">
                      {h.title}
                    </h4>
                    {getStatusBadge(h)}
                  </div>

                  <p className="text-zinc-400 text-[10px] leading-relaxed line-clamp-2">
                    {h.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider pt-2 border-t border-zinc-100">
                    <FaClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{h.date_range_label || `${h.from_date} – ${h.to_date}`}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-zinc-100">
                  <span className="text-[10px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                    {h.total_days} {h.total_days === 1 ? "Day" : "Days"}
                  </span>
                  <button 
                    onClick={() => handleOpenDetail(h.id)}
                    className="text-[10px] text-zinc-500 hover:text-violet-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    View Details <FaExternalLinkAlt className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-6 text-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
            <h3 className="font-extrabold text-zinc-800 text-sm">
              {currentMonth.toLocaleDateString("default", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 border border-zinc-300 hover:bg-zinc-50 rounded-lg font-bold text-black/60" 
              >
                Previous
              </button>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 border border-zinc-300 hover:bg-zinc-50 rounded-lg font-bold text-black/60"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-bold text-zinc-400 uppercase tracking-wider mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="py-2 text-[10px]">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="p-3 bg-zinc-50/50 rounded-lg min-h-[44px]" />;
              
              const holiday = getHolidayForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              let cellStyle = "bg-zinc-50/40 text-zinc-700 hover:bg-zinc-100";
              if (holiday) {
                if (holiday.is_ongoing) cellStyle = "bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 cursor-pointer";
                else if (holiday.is_upcoming) cellStyle = "bg-blue-50 text-blue-800 border border-blue-300 font-bold hover:bg-blue-100 cursor-pointer";
                else cellStyle = "bg-zinc-100 text-zinc-600 border border-zinc-300 font-semibold hover:bg-zinc-200 cursor-pointer";
              } else if (isToday) {
                cellStyle = "bg-violet-50 text-violet-700 border border-violet-300 font-bold hover:bg-violet-100";
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => holiday && handleOpenDetail(holiday.id)}
                  className={`p-2.5 rounded-lg min-h-[64px] flex flex-col justify-start items-start gap-1.5 transition-all select-none duration-200 border border-transparent ${cellStyle}`}
                  title={holiday ? `${holiday.title}: ${holiday.description}` : ""}
                >
                  <span className="text-[10px] font-bold self-start">{date.getDate()}</span>
                  {holiday && (
                    <span 
                      className={`px-1.5 py-0.5 rounded border text-[8px] font-bold truncate w-full block text-left flex items-center gap-1 bg-white/50 border-zinc-200/55 text-zinc-700`}
                    >
                      <span>📅</span>
                      <span className="truncate">{holiday.title}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Holiday Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" />
                Holiday Details
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {loadingHolidayDetail || !holidayDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                (() => {
                  const activeDetail = holidayDetail?.holiday || holidayDetail || {};
                  return (
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-base font-extrabold text-zinc-800 leading-tight">
                          {activeDetail.title}
                        </h2>
                        {getStatusBadge(activeDetail)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Duration</span>
                          <span className="font-bold text-zinc-700 block text-xs">{activeDetail.date_range_label}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Days</span>
                          <span className="font-bold text-zinc-700 block text-xs">{activeDetail.total_days} {activeDetail.total_days === 1 ? "Day" : "Days"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">From Date</span>
                          <span className="font-bold text-zinc-700 block text-xs">{activeDetail.from_date}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">To Date</span>
                          <span className="font-bold text-zinc-700 block text-xs">{activeDetail.to_date}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Description</span>
                        <p className="text-xs text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">
                          {activeDetail.description || "No description provided."}
                        </p>
                      </div>

                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider pt-4 border-t border-zinc-100 flex justify-between">
                        <span>Announced Date</span>
                        <span>{activeDetail.announced_at_label || "N/A"}</span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
