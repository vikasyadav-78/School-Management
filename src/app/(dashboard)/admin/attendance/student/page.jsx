"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaCalendarAlt, FaUserGraduate, FaCheckCircle, FaTimesCircle, 
  FaQrcode, FaSearch, FaCheck, FaTimes, FaUserClock, FaAdjust, FaArrowLeft, FaExclamationCircle
} from "react-icons/fa";
import { 
  getAttendanceClasses, 
  getAttendanceRoster, 
  saveAttendanceRoster,
  qrLookup,
  qrMark
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function StudentAttendancePage() {
  const getTodayDateStr = () => new Date().toISOString().split("T")[0];

  // State Management
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // QR Scanning Simulation State
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Meta Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setMetaLoading(true);
        const data = await getAttendanceClasses();
        const classesList = data.classes || data.data || data || [];
        setClasses(classesList);
        if (classesList.length > 0) {
          setSelectedClass(classesList[0].id);
          if (classesList[0].sections?.length > 0) {
            setSelectedSection(classesList[0].sections[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to load classes dropdown metadata: " + (err.message || err));
      } finally {
        setMetaLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch daily student roster when filters change
  const fetchRoster = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    try {
      setLoading(true);
      const data = await getAttendanceRoster({
        school_class_id: selectedClass,
        section_id: selectedSection,
        date: selectedDate
      });
      // Roster response items map to student list
      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.students)) {
          records = data.students;
        } else if (Array.isArray(data.records)) {
          records = data.records;
        } else if (Array.isArray(data.data)) {
          records = data.data;
        } else if (Array.isArray(data.items)) {
          records = data.items;
        } else {
          const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
          if (arrayKey) {
            records = data[arrayKey];
          }
        }
      }
      // Normalize statuses to lowercase
      const normalized = records.map(r => {
        // If there's already marked attendance in the roster, use its status
        const currentStatus = r.attendance?.status || r.status || "present";
        return {
          id: r.id || r.student_id,
          name: r.full_name || r.student_name || r.name || "Student",
          admission_no: r.student_id || r.admission_no || r.student_code || "N/A",
          roll_no: r.roll_no || "—",
          photo: r.photo_url || r.photo || r.profile_image || null,
          status: currentStatus.toLowerCase()
        };
      });
      setRoster(normalized);
    } catch (err) {
      toast.error("Failed to load student roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    setCurrentPage(1);
    setSearchTerm("");
  }, [selectedClass, selectedSection, selectedDate]);

  // Handle Class change to dynamically update sections
  const handleClassChange = (e) => {
    const cid = e.target.value;
    setSelectedClass(cid);
    const matched = classes.find(c => c.id === cid);
    if (matched && matched.sections?.length > 0) {
      setSelectedSection(matched.sections[0].id);
    } else {
      setSelectedSection("");
    }
  };

  // Bulk Actions
  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(s => ({ ...s, status })));
    toast.success(`Marked all as ${status.toUpperCase()}`);
  };

  // Individual status update
  const handleStatusChange = (studentId, status) => {
    setRoster(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  // Submit to backend
  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true);
      const payload = {
        date: selectedDate,
        attendance: roster.map(s => ({
          student_id: s.id,
          status: s.status
        }))
      };
      await saveAttendanceRoster(payload);
      toast.success("Student attendance roster updated successfully!");
      fetchRoster();
    } catch (err) {
      toast.error("Failed to update student attendance: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // QR Look up & Mark Simulation
  const handleQrLookup = async (e) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;
    try {
      setQrLoading(true);
      setQrResult(null);
      const data = await qrLookup({ qr_code: qrCodeInput.trim() });
      setQrResult(data.student || data.data || data);
    } catch (err) {
      toast.error("QR Code lookup failed: " + (err.message || err));
    } finally {
      setQrLoading(false);
    }
  };

  const handleQrMark = async (status) => {
    if (!qrResult) return;
    try {
      setQrLoading(true);
      await qrMark({
        student_id: qrResult.id,
        status: status
      });
      toast.success(`Student ${qrResult.full_name || qrResult.name} marked ${status.toUpperCase()} via QR Scanner!`);
      // Update local state if this student is in the current roster list
      setRoster(prev => prev.map(s => s.id === qrResult.id ? { ...s, status } : s));
      setIsQrModalOpen(false);
      setQrCodeInput("");
      setQrResult(null);
    } catch (err) {
      toast.error("Failed to mark attendance via QR: " + (err.message || err));
    } finally {
      setQrLoading(false);
    }
  };

  // Filtering & Pagination Calculations
  const filteredRoster = roster.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    return !term || s.name.toLowerCase().includes(term) || s.admission_no.toLowerCase().includes(term);
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoster = filteredRoster.slice(startIndex, startIndex + itemsPerPage);

  const selectedClassObj = classes.find(c => c.id === selectedClass);
  const sectionsList = selectedClassObj?.sections || [];

  // Roster Summary Stats
  const totalCount = roster.length;
  const presentCount = roster.filter(s => s.status === "present").length;
  const absentCount = roster.filter(s => s.status === "absent").length;
  const lateCount = roster.filter(s => s.status === "late").length;
  const halfDayCount = roster.filter(s => s.status === "half_day").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader 
            title="Student Roster Attendance"
            subtitle="View, modify, and distribute daily student attendance logs with QR lookup validation."
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <FaQrcode className="w-3.5 h-3.5" />
              QR Attendance Scan
            </button>
            <Link href="/admin/attendance">
              <Button variant="outline" className="text-xs font-bold py-2 px-3">
                <FaArrowLeft className="mr-1.5" /> Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Attendance Date</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={sectionsList.length === 0}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer disabled:opacity-60"
            >
              {sectionsList.map(s => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary widgets */}
        {roster.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 text-center shadow-sm">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Students</span>
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
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Half Day
              </span>
              <span className="text-xl font-extrabold text-indigo-600 mt-1 block">{halfDayCount}</span>
            </div>
          </div>
        )}

        {/* Attendance Main Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <PageLoader />
          </div>
        ) : roster.length === 0 ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider bg-white rounded-2xl border border-zinc-200 shadow-sm">
            No Students Found in Selected Roster Scope
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            {/* Table Header toolbar */}
            <div className="p-4 border-b border-zinc-150/60 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <FaSearch className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="text"
                  placeholder="Search student name or ADM code..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-1.5 border text-black border-zinc-200 rounded-xl text-xs outline-none bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold"
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

            {/* Roster list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Admission No.</th>
                    <th className="px-6 py-4">Roll No.</th>
                    <th className="px-6 py-4 text-center">Status Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150/60 text-zinc-700">
                  {paginatedRoster.map(student => (
                    <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center font-extrabold text-violet-600">
                            {student.photo ? (
                              <img src={student.photo} alt={student.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-zinc-800 uppercase tracking-wide">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-bold text-zinc-500 uppercase">{student.admission_no}</td>
                      <td className="px-6 py-3 font-bold text-zinc-500">{student.roll_no}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {[
                            { key: "present", label: "P", color: "emerald", bg: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-600 border-emerald-600 text-white" },
                            { key: "absent", label: "A", color: "rose", bg: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-600 border-rose-600 text-white" },
                            { key: "late", label: "L", color: "amber", bg: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-500 border-amber-500 text-white" },
                            { key: "half_day", label: "H", color: "indigo", bg: "bg-indigo-50 text-indigo-600 border-indigo-100", activeBg: "bg-indigo-600 border-indigo-600 text-white" }
                          ].map(opt => {
                            const active = student.status === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleStatusChange(student.id, opt.key)}
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
              {submitting ? "Updating Database..." : "Save Daily Attendance"}
            </Button>
          </div>
        )}

        {/* QR Scan Simulation Modal */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaQrcode className="text-violet-500" />
                  QR Attendance Scanner
                </h3>
                <button onClick={() => { setIsQrModalOpen(false); setQrResult(null); setQrCodeInput(""); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <form onSubmit={handleQrLookup} className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Scan QR Code / Code ID Input</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Scan qr code or enter code (e.g. STU-001)"
                      value={qrCodeInput}
                      onChange={(e) => setQrCodeInput(e.target.value)}
                      className="flex-1 text-black px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={qrLoading}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer text-xs"
                    >
                      Lookup
                    </button>
                  </div>
                </form>

                {qrLoading && (
                  <div className="py-8 flex justify-center"><PageLoader /></div>
                )}

                {qrResult && (
                  <div className="bg-zinc-50 p-4 border border-zinc-150 rounded-2xl space-y-4 animate-fade-in text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold">
                        {qrResult.full_name ? qrResult.full_name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-zinc-800 text-xs uppercase">{qrResult.full_name || qrResult.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                          {qrResult.admission_no || qrResult.student_id} • {qrResult.class || "Class"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200">
                      <button
                        onClick={() => handleQrMark("present")}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer text-xs"
                      >
                        <FaCheck className="w-3 h-3" /> Mark Present
                      </button>
                      <button
                        onClick={() => handleQrMark("absent")}
                        className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer text-xs"
                      >
                        <FaTimes className="w-3 h-3" /> Mark Absent
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
