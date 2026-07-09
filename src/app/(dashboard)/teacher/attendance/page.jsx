"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaCalendarCheck, FaHistory, FaQrcode, FaUser, FaSearch, 
  FaCalendarAlt, FaCamera, FaTimes, FaCheck, FaMoneyBillWave 
} from "react-icons/fa";
import { toast } from "sonner";
import { 
  getAttendanceClasses, 
  getAttendanceRoster, 
  saveAttendanceRoster, 
  getAttendanceHistory, 
  qrLookup, 
  qrMark, 
  quickQrScan,
  getMyAttendance
} from "@/features/teachers/services/teacher.service";

export default function TeacherAttendancePage() {
  const [activeTab, setActiveTab] = useState("manual"); // "manual", "qr", "history", "my-attendance"

  // Shared classes state
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Fetch classes once
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const data = await getAttendanceClasses();
        setClasses(data?.classes || data || []);
      } catch (err) {
        setGlobalError("Failed to load classes roster: " + (err.message || err));
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance Center"
        subtitle="Manage student classroom attendance logs, execute QR scans, and view history ledgers."
      />

      {globalError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          {globalError}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex bg-zinc-100 p-1 rounded-xl w-full max-w-2xl border border-zinc-200">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "manual"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <FaCalendarCheck className="w-3.5 h-3.5" />
          <span>Mark Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab("qr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "qr"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <FaQrcode className="w-3.5 h-3.5" />
          <span>QR Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <FaHistory className="w-3.5 h-3.5" />
          <span>History Log</span>
        </button>
        <button
          onClick={() => setActiveTab("my-attendance")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "my-attendance"
              ? "bg-white text-violet-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <FaUser className="w-3.5 h-3.5" />
          <span>My Attendance</span>
        </button>
      </div>

      {classesLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : (
        <>
          {activeTab === "manual" && <ManualAttendanceSection classes={classes} />}
          {activeTab === "qr" && <QrAttendanceSection />}
          {activeTab === "history" && <AttendanceHistorySection classes={classes} />}
          {activeTab === "my-attendance" && <MyAttendanceSection />}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 1. MANUAL ATTENDANCE COMPONENT
// ----------------------------------------------------
function ManualAttendanceSection({ classes }) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Default selection
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id.toString());
      const firstClassSecs = classes[0].sections || [];
      if (firstClassSecs.length > 0) {
        setSelectedSectionId(firstClassSecs[0].id?.toString() || firstClassSecs[0].name || firstClassSecs[0]);
      }
    }
  }, [classes, selectedClassId]);

  const activeClassObj = classes.find(c => c.id.toString() === selectedClassId);
  const sections = activeClassObj?.sections || [];

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id.toString() === classId);
    const targetSecs = targetClass?.sections || [];
    setSelectedSectionId(targetSecs.length > 0 ? (targetSecs[0].id?.toString() || targetSecs[0].name || targetSecs[0]) : "");
  };

  // Fetch Attendance Roster
  const fetchRoster = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    try {
      setLoading(true);
      const data = await getAttendanceRoster({
        school_class_id: selectedClassId,
        section_id: selectedSectionId,
        date: selectedDate
      });
      setStudents(data.students || data || []);
      
      // Initialize state map with existing or default status
      const initialMap = {};
      const list = data.students || data || [];
      list.forEach((student) => {
        initialMap[student.id] = student.attendance_status || student.status || "present";
      });
      setAttendanceRecords(initialMap);
    } catch (err) {
      toast.error("Failed to load student roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedClassId, selectedSectionId, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updatedMap = {};
    students.forEach((s) => {
      updatedMap[s.id] = status;
    });
    setAttendanceRecords(updatedMap);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate,
        attendance: Object.keys(attendanceRecords).map((studentId) => ({
          student_id: studentId,
          status: attendanceRecords[studentId].toLowerCase().replace(" ", "_")
        }))
      };
      await saveAttendanceRoster(payload);
      toast.success("Attendance Saved Successfully");
      fetchRoster(); // Refresh the list
    } catch (err) {
      toast.error("Something Went Wrong: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const query = searchTerm.toLowerCase().trim();
    return students.filter(
      (s) =>
        (s.full_name || s.name || "").toLowerCase().includes(query) ||
        (s.roll_number || s.rollNo || "").toString().toLowerCase().includes(query)
    );
  }, [students, searchTerm]);

  // Aggregate stats
  const totalCount = students.length;
  const presentCount = Object.values(attendanceRecords).filter(v => v.toLowerCase() === "present").length;
  const absentCount = Object.values(attendanceRecords).filter(v => v.toLowerCase() === "absent").length;
  const lateCount = Object.values(attendanceRecords).filter(v => v.toLowerCase() === "late").length;
  const halfDayCount = Object.values(attendanceRecords).filter(v => v.toLowerCase() === "half_day" || v.toLowerCase() === "half day").length;

  return (
    <div className="space-y-6">
      {/* Roster Filter Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold"
            >
              <option value="">Choose Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name || cls.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold"
              disabled={!selectedClassId}
            >
              <option value="">Choose Section</option>
              {sections.map((sec, idx) => {
                const val = sec.id?.toString() || sec.name || sec;
                const label = sec.name || sec;
                return (
                  <option key={sec.id || idx} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <FaCalendarAlt className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Stats aggregate header */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-3.5">Attendance Summary Overview</label>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
              <span className="text-xs font-extrabold text-zinc-700 block">{totalCount}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">Total</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
              <span className="text-xs font-extrabold text-emerald-600 block">{presentCount}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">Present</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <span className="text-xs font-extrabold text-rose-600 block">{absentCount}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">Absent</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
              <span className="text-xs font-extrabold text-amber-600 block">{lateCount}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">Late</span>
            </div>
            <div className="bg-violet-50 border border-violet-100 p-3 rounded-xl">
              <span className="text-xs font-extrabold text-violet-600 block">{halfDayCount}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 block">Half Day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual marking roster block */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <FaSearch className="w-3 h-3 text-zinc-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name or roll..."
              className="w-full pl-8 pr-4 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none bg-white focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleMarkAll("present")}
              className="px-3 py-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("absent")}
              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <PageLoader />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs">
            No Students Found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Photo</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4 text-center">Class / Section</th>
                  <th className="px-6 py-4 text-center">Attendance Status Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs">
                {filteredStudents.map((s) => {
                  const status = attendanceRecords[s.id] || "present";
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3">
                        {s.photo ? (
                          <img 
                            src={s.photo} 
                            alt={s.full_name || s.name} 
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=100";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-650 font-extrabold text-[11px]">
                            {(s.full_name || s.name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-semibold text-zinc-600 whitespace-nowrap">
                        {s.roll_number || s.rollNo || "N/A"}
                      </td>
                      <td className="px-6 py-3 font-bold text-zinc-800 whitespace-nowrap">
                        {s.full_name || s.name}
                      </td>
                      <td className="px-6 py-3 text-zinc-500 font-semibold text-center whitespace-nowrap">
                        {s.class_name || s.className || "N/A"} - {s.section_name || s.section || "N/A"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          {["present", "absent", "late", "half_day"].map((opt) => {
                            let label = opt.charAt(0).toUpperCase() + opt.slice(1).replace("_", " ");
                            let activeClass = "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50";
                            if (status.toLowerCase().replace(" ", "_") === opt) {
                              if (opt === "present") activeClass = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
                              else if (opt === "absent") activeClass = "bg-rose-600 border-rose-600 text-white shadow-sm";
                              else if (opt === "late") activeClass = "bg-amber-500 border-amber-500 text-white shadow-sm";
                              else if (opt === "half_day") activeClass = "bg-violet-600 border-violet-600 text-white shadow-sm";
                            }
                            return (
                              <button
                                key={opt}
                                onClick={() => handleStatusChange(s.id, opt)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider ${activeClass}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/10 cursor-pointer"
        >
          {loading ? "Saving Logs..." : "Save Daily Attendance"}
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. QR ATTENDANCE COMPONENT
// ----------------------------------------------------
const QrAttendanceSection = () => {
  const [quickScan, setQuickScan] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const qrReaderRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setScannedStudent(null);
      setScannerActive(true);
      
      // Delay initialization slightly to ensure element is in DOM
      setTimeout(async () => {
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;

          const config = { fps: 10, qrbox: { width: 250, height: 250 } };
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              handleQrScan(decodedText);
            },
            () => {} // silent scan failure callback
          );
        } catch (err) {
          toast.error("Camera access failed or permission denied: " + (err.message || err));
          setScannerActive(false);
        }
      }, 300);
    } catch (err) {
      toast.error("Scanner startup failed: " + err.message);
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner cleanly:", err);
      }
    }
    setScannerActive(false);
  };

  const handleQrScan = async (codeText) => {
    await stopScanner();
    
    if (quickScan) {
      // Instant present mark
      try {
        setLoading(true);
        const data = await quickQrScan({ qr_code: codeText });
        toast.success(
          <div className="flex items-center gap-2 text-emerald-600">
            <FaCheck className="w-4 h-4 shrink-0" />
            <span>Attendance marked present successfully for {data.student?.name || "Student"}!</span>
          </div>
        );
        // Automatically start scanning again for the next student
        setTimeout(() => startScanner(), 1500);
      } catch (err) {
        toast.error(err.message || "Failed to instantly scan QR code.");
        setScannerActive(false);
      } finally {
        setLoading(false);
      }
    } else {
      // Lookup and confirm flow
      try {
        setLoading(true);
        const data = await qrLookup({ qr_code: codeText });
        setScannedStudent(data.student || data);
      } catch (err) {
        toast.error(err.message || "QR Code Invalid or student not found.");
        setScannerActive(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmAttendance = async () => {
    if (!scannedStudent) return;
    try {
      setLoading(true);
      await qrMark({ student_id: scannedStudent.id, status: "present" });
      toast.success("Attendance Marked Successfully");
      setScannedStudent(null);
      // Restart scanner automatically for next scan
      startScanner();
    } catch (err) {
      toast.error("Failed to confirm attendance: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      {/* Scanner Panel */}
      <div className="space-y-6 flex flex-col justify-center items-center border-r border-zinc-100 pr-0 md:pr-8">
        <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
          <FaQrcode className="text-violet-500" /> Camera Scanner Control
        </h3>
        
        {/* Toggle Option */}
        <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-150 p-3 rounded-xl w-full select-none cursor-pointer">
          <input 
            type="checkbox" 
            checked={quickScan} 
            onChange={(e) => setQuickScan(e.target.checked)} 
            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-zinc-300 rounded"
          />
          <div>
            <span className="font-extrabold text-zinc-800 block">Instant Quick Scan Mode</span>
            <span className="text-[10px] text-zinc-400 font-semibold block">Auto-marks student present instantly without confirmation prompts</span>
          </div>
        </label>

        {/* Reader element container */}
        <div className="relative w-full max-w-sm aspect-square bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-250">
          {scannerActive ? (
            <div id="reader" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center space-y-3 p-6">
              <FaCamera className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
              <p className="text-zinc-500 font-semibold">Webcam Scanner is currently inactive</p>
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          {!scannerActive ? (
            <Button
              onClick={startScanner}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-650/10 cursor-pointer"
            >
              <FaCamera className="w-3.5 h-3.5" /> Start Scanning
            </Button>
          ) : (
            <Button
              onClick={stopScanner}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-650/10 cursor-pointer"
            >
              <FaTimes className="w-3.5 h-3.5" /> Stop Camera
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation & Display Panel */}
      <div className="flex flex-col justify-center items-center space-y-6">
        <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Scanned Student Details</h3>
        
        {loading ? (
          <PageLoader />
        ) : scannedStudent ? (
          <div className="w-full max-w-md bg-zinc-50 border border-zinc-150 p-6 rounded-2xl space-y-6 animate-fade-in text-center shadow-inner">
            {scannedStudent.photo ? (
              <img 
                src={scannedStudent.photo} 
                alt={scannedStudent.full_name || scannedStudent.name} 
                className="w-20 h-20 rounded-full object-cover mx-auto border border-violet-200/50 shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  // e.target.src = "https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=100";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 font-extrabold text-2xl mx-auto shadow-inner">
                {(scannedStudent.full_name || scannedStudent.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-zinc-800">{scannedStudent.full_name || scannedStudent.name}</h4>
              <p className="text-[10px] text-zinc-400 font-bold">Roll: {scannedStudent.roll_number || scannedStudent.rollNo || "N/A"} • ID: {scannedStudent.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left border-t border-zinc-200/60 pt-4">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Class</span>
                <span className="font-extrabold text-zinc-700">{scannedStudent.class_name || scannedStudent.className || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">Section</span>
                <span className="font-extrabold text-zinc-700">{scannedStudent.section_name || scannedStudent.section || "N/A"}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                onClick={() => {
                  setScannedStudent(null);
                  startScanner();
                }}
                className="flex-1 bg-white border border-zinc-250 text-zinc-600 hover:bg-zinc-50 font-bold py-2 rounded-xl cursor-pointer"
              >
                Scan Again
              </Button>
              <Button
                onClick={handleConfirmAttendance}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl shadow-lg shadow-emerald-650/15 cursor-pointer"
              >
                Confirm Attendance
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-zinc-50 border border-zinc-100 rounded-xl w-full max-w-sm text-zinc-400 font-semibold">
            Ready for scanner input. Scan a student's ID badge QR code to look up information.
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. ATTENDANCE HISTORY LOG COMPONENT
// ----------------------------------------------------
function AttendanceHistorySection({ classes }) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default values
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id.toString());
      const secs = classes[0].sections || [];
      if (secs.length > 0) {
        setSelectedSectionId(secs[0].id?.toString() || secs[0].name || secs[0]);
      }
    }
  }, [classes, selectedClassId]);

  const currentClassObj = classes.find(c => c.id.toString() === selectedClassId);
  const sections = currentClassObj?.sections || [];

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id.toString() === classId);
    const targetSecs = targetClass?.sections || [];
    setSelectedSectionId(targetSecs.length > 0 ? (targetSecs[0].id?.toString() || targetSecs[0].name || targetSecs[0]) : "");
  };

  const fetchHistory = async () => {
    if (!selectedClassId || !selectedSectionId) return;
    try {
      setLoading(true);
      const data = await getAttendanceHistory({
        month: selectedMonth,
        school_class_id: selectedClassId,
        section_id: selectedSectionId,
        search: searchQuery
      });
      setHistoryList(data.records || data || []);
    } catch (err) {
      toast.error("Failed to load attendance logs: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedClassId, selectedSectionId, selectedMonth, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Dynamic Filters header */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold"
          >
            <option value="">Choose Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name || cls.class_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Select Section</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 font-bold"
          >
            <option value="">Choose Section</option>
            {sections.map((sec, idx) => {
              const val = sec.id?.toString() || sec.name || sec;
              const label = sec.name || sec;
              return (
                <option key={sec.id || idx} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Student Search</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-450">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-450 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* History table view */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <PageLoader />
          </div>
        ) : historyList.length === 0 ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs">
            No Attendance History
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4 text-center">Present</th>
                  <th className="px-6 py-4 text-center">Absent</th>
                  <th className="px-6 py-4 text-center">Late</th>
                  <th className="px-6 py-4 text-center">Half Day</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs">
                {historyList.map((row) => (
                  <tr key={row.student_id || row.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {row.student_photo || row.photo ? (
                          <img 
                            src={row.student_photo || row.photo} 
                            alt={row.student_name || row.name} 
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=100";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-55/10 border border-violet-100 flex items-center justify-center text-violet-650 font-extrabold text-[11px]">
                            {(row.student_name || row.name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-zinc-800">{row.student_name || row.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-semibold text-zinc-650 whitespace-nowrap">
                      {row.roll_number || row.rollNo || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-emerald-600 font-bold text-center whitespace-nowrap">
                      {row.total_present || row.present || 0}
                    </td>
                    <td className="px-6 py-3 text-rose-600 font-bold text-center whitespace-nowrap">
                      {row.total_absent || row.absent || 0}
                    </td>
                    <td className="px-6 py-3 text-amber-600 font-bold text-center whitespace-nowrap">
                      {row.total_late || row.late || 0}
                    </td>
                    <td className="px-6 py-3 text-violet-600 font-bold text-center whitespace-nowrap">
                      {row.total_half_day || row.half_day || 0}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
                        (row.attendance_percentage || row.percentage || 0) >= 75
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-105"
                      }`}>
                        {row.attendance_percentage || row.percentage || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. MY ATTENDANCE VIEW COMPONENT
// ----------------------------------------------------
function MyAttendanceSection() {
  const [myAttendance, setMyAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyLogs = async () => {
      try {
        setLoading(true);
        const data = await getMyAttendance();
        setMyAttendance(data);
      } catch (err) {
        toast.error("Failed to load my attendance: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMyLogs();
  }, []);

  if (loading || !myAttendance) {
    return (
      <div className="flex items-center justify-center py-20">
        <PageLoader />
      </div>
    );
  }

  const stats = myAttendance.stats || {};
  const salaryPreview = myAttendance.salary_preview || {};
  const records = myAttendance.records || [];

  return (
    <div className="space-y-6">
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Days</label>
          <h3 className="text-xl font-extrabold text-zinc-800 mt-1">{stats.total_days || 0}</h3>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
          <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Present</label>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{stats.present || 0}</h3>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 text-center">
          <label className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">Absent</label>
          <h3 className="text-xl font-extrabold text-rose-700 mt-1">{stats.absent || 0}</h3>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
          <label className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Late</label>
          <h3 className="text-xl font-extrabold text-amber-700 mt-1">{stats.late || 0}</h3>
        </div>
        <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 text-center">
          <label className="text-[9px] font-bold text-violet-600 uppercase tracking-wider block">Half Day</label>
          <h3 className="text-xl font-extrabold text-violet-700 mt-1">{stats.half_day || 0}</h3>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
          <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Leave</label>
          <h3 className="text-xl font-extrabold text-blue-700 mt-1">{stats.leave || 0}</h3>
        </div>
        <div className="bg-violet-600 text-white p-4 rounded-xl shadow-sm text-center">
          <label className="text-[9px] font-bold text-violet-200 uppercase tracking-wider block">Payable Days</label>
          <h3 className="text-xl font-extrabold mt-1">{stats.payable_days || 0}</h3>
        </div>
      </div>

      {/* Salary Preview Block */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-100 pb-3 flex items-center gap-2">
          <FaMoneyBillWave className="text-violet-500 w-4 h-4" /> Estimated Salary Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Monthly Salary</span>
            <span className="text-base font-extrabold text-zinc-800">₹{(salaryPreview.monthly_salary || 0).toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Working Days</span>
            <span className="text-base font-extrabold text-zinc-800">{salaryPreview.working_days || 0} Days</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Payable Days</span>
            <span className="text-base font-extrabold text-zinc-800">{salaryPreview.payable_days || 0} Days</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Gross Salary</span>
            <span className="text-base font-extrabold text-zinc-800">₹{(salaryPreview.gross_salary || 0).toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-violet-600 font-bold uppercase tracking-wider block">Net Est. Salary</span>
            <span className="text-base font-extrabold text-violet-600">₹{(salaryPreview.net_salary || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Historical Payments Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h3 className="text-xs font-bold text-zinc-700 uppercase">My Attendance Records ({myAttendance.month_label || "N/A"})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-xs">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                    {r.date_label || r.date || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide border ${
                      r.status_label === "Present" || r.status === "Present" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                      r.status_label === "Absent" || r.status === "Absent" ? "text-rose-600 bg-rose-50 border-rose-100" :
                      r.status_label === "Late" || r.status === "Late" ? "text-amber-600 bg-amber-50 border-amber-100" :
                      r.status_label === "Half Day" || r.status === "Half Day" ? "text-violet-600 bg-violet-50 border-violet-100" :
                      "text-zinc-600 bg-zinc-50 border-zinc-100"
                    }`}>
                      {r.status_label || r.status || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-medium">
                    {r.remarks || "N/A"}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-zinc-400 font-semibold">
                    No Attendance Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
