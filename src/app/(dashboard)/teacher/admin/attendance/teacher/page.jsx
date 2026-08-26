"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaCalendarAlt, FaChalkboardTeacher, FaCheckCircle, FaSearch, 
  FaArrowLeft, FaCheck, FaTimes, FaUserClock, FaAdjust, FaHospital
} from "react-icons/fa";
import { 
  getTeacherManageTeacherAttendanceRoster, 
  saveTeacherManageTeacherAttendance 
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function TeacherAttendancePage() {
  const getTodayDateStr = () => new Date().toISOString().split("T")[0];

  // State Management
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const data = await getTeacherManageTeacherAttendanceRoster({ date: selectedDate });
      const teachersList = data.teachers || data.items || data.data || data || [];
      // Normalize values
      const normalized = teachersList.map(t => ({
        id: t.id || t.teacher_id,
        name: t.full_name || t.name || "Faculty Member",
        employee_id: t.employee_id || t.employee_code || "N/A",
        photo: t.photo || t.profile_image || null,
        status: t.status ? t.status.toLowerCase() : "present",
        remarks: t.remarks || ""
      }));
      setRoster(normalized);
    } catch (err) {
      toast.error("Failed to load teacher roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    setCurrentPage(1);
    setSearchTerm("");
  }, [selectedDate]);

  // Bulk Actions
  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(t => ({ ...t, status })));
    toast.success(`Marked all teachers as ${status.toUpperCase()}`);
  };

  // Status Change
  const handleStatusChange = (teacherId, status) => {
    setRoster(prev => prev.map(t => t.id === teacherId ? { ...t, status } : t));
  };

  // Remarks Change
  const handleRemarksChange = (teacherId, remarks) => {
    setRoster(prev => prev.map(t => t.id === teacherId ? { ...t, remarks } : t));
  };

  // Save changes
  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true);
      const payload = {
        date: selectedDate,
        attendance: roster.map(t => ({
          teacher_id: t.id,
          status: t.status,
          remarks: t.remarks.trim() || null
        }))
      };
      await saveTeacherManageTeacherAttendance(payload);
      toast.success("Teacher attendance roster updated successfully!");
      fetchRoster();
    } catch (err) {
      toast.error("Failed to update teacher attendance: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Pagination Calculations
  const filteredRoster = roster.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    return !term || t.name.toLowerCase().includes(term) || t.employee_id.toLowerCase().includes(term);
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoster = filteredRoster.slice(startIndex, startIndex + itemsPerPage);

  // Summary Metrics
  const totalCount = roster.length;
  const presentCount = roster.filter(t => t.status === "present").length;
  const absentCount = roster.filter(t => t.status === "absent").length;
  const lateCount = roster.filter(t => t.status === "late").length;
  const leaveCount = roster.filter(t => t.status === "leave").length;

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Teacher Staff Attendance"
          subtitle="Manage, verify, and mark daily logs for school faculty and instruction members."
        />
        <Link href="/teacher/admin/attendance">
          <Button variant="outline" className="text-xs font-bold py-2 px-3">
            <FaArrowLeft className="mr-1.5" /> Back
          </Button>
        </Link>
      </div>

      {/* Date Panel */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full max-w-sm">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Attendance Date</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Summary Widgets */}
      {roster.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Faculty</span>
            <span className="text-xl font-extrabold text-zinc-800 mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Present
            </span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block">{presentCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Absent
            </span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{absentCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Late
            </span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">{lateCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span> On Leave
            </span>
            <span className="text-xl font-extrabold text-amber-800 mt-1 block">{leaveCount}</span>
          </div>
        </div>
      )}

      {/* Roster Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <PageLoader />
        </div>
      ) : roster.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider bg-white rounded-2xl border border-zinc-200 shadow-sm">
          No Faculty Rosters Found
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Table toolbar */}
          <div className="p-4 border-b border-zinc-150/60 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text"
                placeholder="Search faculty name or ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAll("present")}
                className="px-3 py-1.5 border border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll("absent")}
                className="px-3 py-1.5 border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Roster table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4 text-center">Status Action</th>
                  <th className="px-6 py-4">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150/60 text-zinc-700">
                {paginatedRoster.map(t => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center font-extrabold text-violet-600">
                          {t.photo ? (
                            <img src={t.photo} alt={t.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            t.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-zinc-800 uppercase tracking-wide">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-zinc-500 uppercase">{t.employee_id}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { key: "present", label: "P", color: "emerald", bg: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-600 border-emerald-600 text-white" },
                          { key: "absent", label: "A", color: "rose", bg: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-600 border-rose-600 text-white" },
                          { key: "late", label: "L", color: "amber", bg: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-500 border-amber-500 text-white" },
                          { key: "half_day", label: "H", color: "indigo", bg: "bg-indigo-50 text-indigo-600 border-indigo-100", activeBg: "bg-indigo-600 border-indigo-600 text-white" },
                          { key: "leave", label: "V", color: "amber-700", bg: "bg-amber-50 text-amber-800 border-amber-200", activeBg: "bg-amber-700 border-amber-700 text-white" }
                        ].map(opt => {
                          const active = t.status === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleStatusChange(t.id, opt.key)}
                              className={`w-8 h-8 rounded-lg border font-bold text-[10px] uppercase transition-all flex items-center justify-center cursor-pointer ${
                                active ? opt.activeBg : `${opt.bg} hover:scale-105`
                              }`}
                              title={opt.key.toUpperCase()}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="text"
                        placeholder="Add remarks..."
                        value={t.remarks}
                        onChange={(e) => handleRemarksChange(t.id, e.target.value)}
                        className="w-full max-w-xs px-3 py-1 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 font-semibold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredRoster.length > itemsPerPage && (
            <div className="p-4 border-t border-zinc-150/60 bg-zinc-50/50">
              <Pagination
                currentPage={currentPage}
                totalCount={filteredRoster.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Save Roster Action */}
      {roster.length > 0 && !loading && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveAttendance}
            disabled={submitting}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 cursor-pointer text-xs"
          >
            {submitting ? "Saving..." : "Save Daily Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}
