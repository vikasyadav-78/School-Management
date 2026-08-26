"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaCalendarAlt, FaHospital, FaSearch, FaArrowLeft } from "react-icons/fa";
import {
  getTeacherReportsStaffAttendance,
  saveTeacherReportsStaffAttendance
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function StaffAttendancePage() {
  const getTodayDateStr = () => new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const data = await getTeacherReportsStaffAttendance({ date: selectedDate });
      const staffList = data.staff || data.items || data.data || data || [];
      const normalized = staffList.map((staff) => ({
        id: staff.id || staff.staff_id,
        name: staff.full_name || staff.name || "Staff Member",
        employee_id: staff.employee_id || staff.employee_code || "N/A",
        photo: staff.photo || staff.profile_image || null,
        status: staff.status ? staff.status.toLowerCase() : "present",
        remarks: staff.remarks || ""
      }));
      setRoster(normalized);
    } catch (err) {
      toast.error("Failed to load staff roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    setCurrentPage(1);
    setSearchTerm("");
  }, [selectedDate]);

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
    toast.success(`Marked all staff as ${status.toUpperCase()}`);
  };

  const handleStatusChange = (staffId, status) => {
    setRoster((prev) => prev.map((item) => item.id === staffId ? { ...item, status } : item));
  };

  const handleRemarksChange = (staffId, remarks) => {
    setRoster((prev) => prev.map((item) => item.id === staffId ? { ...item, remarks } : item));
  };

  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true);
      const payload = {
        date: selectedDate,
        attendance: roster.map((item) => ({
          staff_id: item.id,
          status: item.status,
          remarks: item.remarks.trim() || null
        }))
      };
      await saveTeacherReportsStaffAttendance(payload);
      toast.success("Staff attendance roster updated successfully!");
      fetchRoster();
    } catch (err) {
      toast.error("Failed to update staff attendance: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoster = roster.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    return !term || item.name.toLowerCase().includes(term) || item.employee_id.toLowerCase().includes(term);
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoster = filteredRoster.slice(startIndex, startIndex + itemsPerPage);

  const totalCount = roster.length;
  const presentCount = roster.filter((item) => item.status === "present").length;
  const absentCount = roster.filter((item) => item.status === "absent").length;
  const lateCount = roster.filter((item) => item.status === "late").length;
  const leaveCount = roster.filter((item) => item.status === "leave").length;
  const halfDayCount = roster.filter((item) => item.status === "half_day").length;

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Staff Attendance"
          subtitle="Manage daily attendance and leave records for support and administration staff."
        />
        <Link href="/teacher/admin/attendance">
          <Button variant="outline" className="text-xs font-bold py-2 px-3">
            <FaArrowLeft className="mr-1.5" /> Back
          </Button>
        </Link>
      </div>

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

      {roster.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Staff</span>
            <span className="text-xl font-extrabold text-zinc-800 mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Present</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block">{presentCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Absent</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{absentCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Late</span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">{lateCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Half Day</span>
            <span className="text-xl font-extrabold text-indigo-600 mt-1 block">{halfDayCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">On Leave</span>
            <span className="text-xl font-extrabold text-amber-800 mt-1 block">{leaveCount}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
          <PageLoader />
        </div>
      ) : roster.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider bg-white rounded-2xl border border-zinc-200 shadow-sm">
          No staff roster found for selected date.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-150/60 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search staff name or ID..."
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150/60 text-zinc-700">
                {paginatedRoster.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center font-extrabold text-violet-600">
                          {item.photo ? (
                            <img src={item.photo} alt={item.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            item.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-zinc-800 uppercase tracking-wide">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-bold text-zinc-500 uppercase">{item.employee_id}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { key: "present", label: "P", bg: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-600 border-emerald-600 text-white" },
                          { key: "absent", label: "A", bg: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-600 border-rose-600 text-white" },
                          { key: "late", label: "L", bg: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-500 border-amber-500 text-white" },
                          { key: "half_day", label: "H", bg: "bg-indigo-50 text-indigo-600 border-indigo-100", activeBg: "bg-indigo-600 border-indigo-600 text-white" },
                          { key: "leave", label: "V", bg: "bg-amber-50 text-amber-800 border-amber-200", activeBg: "bg-amber-700 border-amber-700 text-white" }
                        ].map((opt) => {
                          const active = item.status === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleStatusChange(item.id, opt.key)}
                              className={`w-8 h-8 rounded-lg border font-bold text-[10px] uppercase transition-all flex items-center justify-center cursor-pointer ${active ? opt.activeBg : `${opt.bg} hover:scale-105`}`}
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
                        placeholder="Remarks..."
                        value={item.remarks}
                        onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                        className="w-full max-w-xs px-3 py-1 border border-zinc-200 rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 font-semibold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
