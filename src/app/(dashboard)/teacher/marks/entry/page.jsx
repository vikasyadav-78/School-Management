"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { 
  FaArrowLeft, FaGraduationCap, FaUserCircle, FaSave, 
  FaUserEdit, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimes, FaSearch, FaHourglassHalf 
} from "react-icons/fa";
import { 
  getTeacherClassRoster, 
  saveTeacherClassMarks,
  getTeacherStudentMarks,
  saveTeacherStudentMarks
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

function ClassMarksEntryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const examId = searchParams.get("exam_id");
  const classId = searchParams.get("class_id");
  const sectionId = searchParams.get("section_id");

  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active Subject Tab
  const [activeScheduleId, setActiveScheduleId] = useState("");

  // Local state for modified marks
  const [editedMarks, setEditedMarks] = useState({});

  // Track editable student ids
  const [editableStudentIds, setEditableStudentIds] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Single Student modal state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [studentMarksDetail, setStudentMarksDetail] = useState(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchRoster = async () => {
    if (!examId || !classId || !sectionId) {
      toast.error("Missing required exam or class parameters.");
      router.push("/teacher/marks");
      return;
    }

    try {
      setLoading(true);
      const data = await getTeacherClassRoster(examId, classId, sectionId);
      setRoster(data);
      
      // Default to first schedule
      if (data.schedules && data.schedules.length > 0) {
        setActiveScheduleId(data.schedules[0].id);
      }

      // Initialize editedMarks grid state and editable list
      const initialMarks = {};
      const defaultEditableIds = [];
      (data.students || []).forEach(student => {
        initialMarks[student.id] = {};
        (data.schedules || []).forEach(sched => {
          const m = student.marks?.[sched.id] || {};
          initialMarks[student.id][sched.id] = {
            theory_marks: m.theory_marks !== null && m.theory_marks !== undefined ? m.theory_marks : "",
            practical_marks: m.practical_marks !== null && m.practical_marks !== undefined ? m.practical_marks : "",
            internal_marks: m.internal_marks !== null && m.internal_marks !== undefined ? m.internal_marks : "",
            is_absent: !!m.is_absent
          };
        });

        // Default to edit mode if student has no marks entered
        if (student.subjects_entered === 0) {
          defaultEditableIds.push(student.id);
        }
      });
      setEditedMarks(initialMarks);
      setEditableStudentIds(defaultEditableIds);
    } catch (err) {
      toast.error("Failed to load class roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [examId, classId, sectionId]);

  const handleCellChange = (studentId, scheduleId, field, value) => {
    setEditedMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [scheduleId]: {
          ...prev[studentId]?.[scheduleId],
          [field]: value
        }
      }
    }));
  };

  const getFieldError = (studentId, scheduleId, field) => {
    const marks = editedMarks[studentId]?.[scheduleId];
    if (!marks) return "";
    if (marks.is_absent) return "";

    const value = marks[field];
    if (value === "") return "";

    const valNum = parseFloat(value);
    if (isNaN(valNum)) return "";

    if (valNum < 0) {
      return "Marks cannot be negative.";
    }

    const sched = roster?.schedules?.find(s => s.id === scheduleId);
    if (!sched) return "";

    if (field === "theory_marks" && valNum > sched.theory_max) {
      return `You cannot enter more than ${sched.theory_max} marks.`;
    }
    if (field === "practical_marks" && valNum > sched.practical_max) {
      return `You cannot enter more than ${sched.practical_max} marks.`;
    }
    if (field === "internal_marks" && valNum > sched.internal_max) {
      return `You cannot enter more than ${sched.internal_max} marks.`;
    }

    return "";
  };

  const handleSaveStudentRow = async (student) => {
    const scheds = roster?.schedules || [];
    const studentId = student.id;
    const studentName = student.full_name;
    const marks = editedMarks[studentId] || {};

    const activeSched = scheds.find(s => s.id === activeScheduleId);
    if (!activeSched) return;

    const m = marks[activeScheduleId] || {};
    if (!m.is_absent) {
      // Empty validation check
      if (activeSched.theory_max > 0 && (m.theory_marks === "" || m.theory_marks === null || m.theory_marks === undefined)) {
        toast.error("Please enter theory marks.");
        return;
      }
      if (activeSched.practical_max > 0 && (m.practical_marks === "" || m.practical_marks === null || m.practical_marks === undefined)) {
        toast.error("Please enter practical marks.");
        return;
      }
      if (activeSched.internal_max > 0 && (m.internal_marks === "" || m.internal_marks === null || m.internal_marks === undefined)) {
        toast.error("Please enter internal marks.");
        return;
      }

      // Range/negative checks
      const tErr = getFieldError(studentId, activeScheduleId, "theory_marks");
      if (tErr) { toast.error(tErr); return; }
      const pErr = getFieldError(studentId, activeScheduleId, "practical_marks");
      if (pErr) { toast.error(pErr); return; }
      const iErr = getFieldError(studentId, activeScheduleId, "internal_marks");
      if (iErr) { toast.error(iErr); return; }
    }

    try {
      const payload = {
        marks: {
          [activeScheduleId]: {
            theory_marks: m.theory_marks !== "" && !m.is_absent ? parseFloat(m.theory_marks) : null,
            practical_marks: m.practical_marks !== "" && !m.is_absent ? parseFloat(m.practical_marks) : null,
            internal_marks: m.internal_marks !== "" && !m.is_absent ? parseFloat(m.internal_marks) : null,
            is_absent: !!m.is_absent
          }
        },
        remarks: ""
      };

      await saveTeacherStudentMarks(examId, studentId, payload);
      toast.success(`${studentName}'s marks saved successfully!`);
      
      // Remove from editable list
      setEditableStudentIds(prev => prev.filter(id => id !== studentId));
      fetchRoster(); // Reload dynamic class grid
    } catch (err) {
      toast.error("Failed to save student marks: " + (err.message || err));
    }
  };

  const validateMarks = () => {
    const students = roster?.students || [];
    const sched = roster?.schedules?.find(s => s.id === activeScheduleId);
    if (!sched) return true;

    for (const student of students) {
      const studentName = student.full_name;
      const marks = editedMarks[student.id]?.[activeScheduleId];
      if (!marks) continue;
      if (marks.is_absent) continue;

      // Theory marks validation
      if (sched.theory_max > 0 && marks.theory_marks !== "") {
        const tVal = parseFloat(marks.theory_marks);
        if (isNaN(tVal) || tVal < 0 || tVal > sched.theory_max) {
          toast.error(`${studentName}: Theory marks for ${sched.subject} must be between 0 and ${sched.theory_max}.`);
          return false;
        }
      }

      // Practical marks validation
      if (sched.practical_max > 0 && marks.practical_marks !== "") {
        const pVal = parseFloat(marks.practical_marks);
        if (isNaN(pVal) || pVal < 0 || pVal > sched.practical_max) {
          toast.error(`${studentName}: Practical marks for ${sched.subject} must be between 0 and ${sched.practical_max}.`);
          return false;
        }
      }

      // Internal marks validation
      if (sched.internal_max > 0 && marks.internal_marks !== "") {
        const iVal = parseFloat(marks.internal_marks);
        if (isNaN(iVal) || iVal < 0 || iVal > sched.internal_max) {
          toast.error(`${studentName}: Internal marks for ${sched.subject} must be between 0 and ${sched.internal_max}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveClass = async () => {
    if (!validateMarks()) return;

    try {
      setSaving(true);
      // Construct payload according to specifications
      const payload = {
        class_id: classId,
        section_id: sectionId,
        marks: {
          [activeScheduleId]: {}
        }
      };

      const students = roster?.students || [];

      students.forEach(student => {
        const marks = editedMarks[student.id]?.[activeScheduleId] || {};
        payload.marks[activeScheduleId][student.id] = {
          theory_marks: marks.theory_marks !== "" && !marks.is_absent ? parseFloat(marks.theory_marks) : null,
          practical_marks: marks.practical_marks !== "" && !marks.is_absent ? parseFloat(marks.practical_marks) : null,
          internal_marks: marks.internal_marks !== "" && !marks.is_absent ? parseFloat(marks.internal_marks) : null,
          is_absent: !!marks.is_absent
        };
      });

      await saveTeacherClassMarks(examId, payload);
      toast.success("Marks saved successfully.");
      setTimeout(() => {
        router.push("/teacher/marks");
        router.refresh();
      }, 1000);
    } catch (err) {
      toast.error("Failed to save class marks: " + (err.message || err));
      setSaving(false);
    }
  };

  // --- Student-wise marks modal handler ---
  const handleOpenStudentModal = async (student) => {
    setActiveStudent(student);
    setStudentModalOpen(true);
    setRemarks("");

    try {
      setLoadingStudentDetail(true);
      const data = await getTeacherStudentMarks(examId, student.id);
      setStudentMarksDetail(data);
      setRemarks(data.remarks || "");
    } catch (err) {
      toast.error("Failed to load student marks: " + (err.message || err));
      setStudentModalOpen(false);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  const handleStudentCellChange = (scheduleId, field, value) => {
    setStudentMarksDetail(prev => {
      const marks = prev.marks || {};
      const target = marks[scheduleId] || { theory_marks: null, practical_marks: null, internal_marks: null, is_absent: false };
      return {
        ...prev,
        marks: {
          ...marks,
          [scheduleId]: {
            ...target,
            [field]: value
          }
        }
      };
    });
  };

  const validateStudentMarks = () => {
    const schedules = roster?.schedules || [];
    const marksGrid = studentMarksDetail?.marks || {};

    for (const sched of schedules) {
      const marks = marksGrid[sched.id];
      if (!marks) continue;
      if (marks.is_absent) continue;

      if (sched.theory_max > 0 && marks.theory_marks !== null && marks.theory_marks !== "") {
        const val = parseFloat(marks.theory_marks);
        if (isNaN(val) || val < 0 || val > sched.theory_max) {
          toast.error(`Theory marks for ${sched.subject} must be between 0 and ${sched.theory_max}`);
          return false;
        }
      }
      if (sched.practical_max > 0 && marks.practical_marks !== null && marks.practical_marks !== "") {
        const val = parseFloat(marks.practical_marks);
        if (isNaN(val) || val < 0 || val > sched.practical_max) {
          toast.error(`Practical marks for ${sched.subject} must be between 0 and ${sched.practical_max}`);
          return false;
        }
      }
      if (sched.internal_max > 0 && marks.internal_marks !== null && marks.internal_marks !== "") {
        const val = parseFloat(marks.internal_marks);
        if (isNaN(val) || val < 0 || val > sched.internal_max) {
          toast.error(`Internal marks for ${sched.subject} must be between 0 and ${sched.internal_max}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveStudentMarks = async () => {
    if (!validateStudentMarks()) return;

    try {
      setSavingStudent(true);
      const payload = {
        marks: {},
        remarks: remarks.trim()
      };

      const schedules = roster?.schedules || [];
      const marksGrid = studentMarksDetail?.marks || {};

      schedules.forEach(sched => {
        const m = marksGrid[sched.id] || {};
        payload.marks[sched.id] = {
          theory_marks: m.theory_marks !== "" && m.theory_marks !== null && !m.is_absent ? parseFloat(m.theory_marks) : null,
          practical_marks: m.practical_marks !== "" && m.practical_marks !== null && !m.is_absent ? parseFloat(m.practical_marks) : null,
          internal_marks: m.internal_marks !== "" && m.internal_marks !== null && !m.is_absent ? parseFloat(m.internal_marks) : null,
          is_absent: !!m.is_absent
        };
      });

      await saveTeacherStudentMarks(examId, activeStudent.id, payload);
      toast.success(`${activeStudent.full_name}'s marks saved successfully!`);
      setStudentModalOpen(false);
      fetchRoster(); // Reload dynamic class grid
    } catch (err) {
      toast.error("Failed to save student marks: " + (err.message || err));
    } finally {
      setSavingStudent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const examInfo = roster?.exam || {};
  const classInfo = roster?.class || {};
  const schedules = roster?.schedules || [];
  const students = roster?.students || [];

  const activeSchedule = schedules.find(s => s.id === activeScheduleId) || {};

  const isStudentMarksEntered = (studentId, schedule) => {
    if (!schedule.id) return false;
    const marks = editedMarks[studentId]?.[schedule.id];
    if (!marks) return false;
    if (marks.is_absent) return true;

    if (schedule.theory_max > 0 && (marks.theory_marks === "" || marks.theory_marks === null || marks.theory_marks === undefined)) return false;
    if (schedule.practical_max > 0 && (marks.practical_marks === "" || marks.practical_marks === null || marks.practical_marks === undefined)) return false;
    if (schedule.internal_max > 0 && (marks.internal_marks === "" || marks.internal_marks === null || marks.internal_marks === undefined)) return false;

    return true;
  };

  const totalStudents = students.length;
  let marksEnteredCount = 0;
  students.forEach(student => {
    if (isStudentMarksEntered(student.id, activeSchedule)) {
      marksEnteredCount++;
    }
  });
  const pendingStudentsCount = totalStudents - marksEnteredCount;

  const filteredStudents = students.filter(student => {
    if (debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase();
      const nameMatch = student.full_name?.toLowerCase().includes(q);
      const idMatch = student.student_id?.toLowerCase().includes(q);
      const rollMatch = student.roll_no?.toString().toLowerCase().includes(q);
      if (!nameMatch && !idMatch && !rollMatch) return false;
    }

    const isEntered = isStudentMarksEntered(student.id, activeSchedule);
    if (statusFilter === "filled" && !isEntered) return false;
    if (statusFilter === "unfilled" && isEntered) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <Link 
          href="/teacher/marks" 
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 font-bold transition-all"
        >
          <FaArrowLeft className="w-3 h-3" />
          <span>Back to Exams List</span>
        </Link>
        <button
          onClick={handleSaveClass}
          disabled={saving}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FaSave className="w-4 h-4" />
          {saving ? "Saving..." : "Save Class Marks"}
        </button>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Active Exam</span>
          <h4 className="font-extrabold text-zinc-800 text-sm leading-tight">{examInfo.name}</h4>
          <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[8px] font-bold rounded uppercase tracking-wider">
            {examInfo.type_label || examInfo.type || "Examination"}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Assigned Section</span>
          <h4 className="font-extrabold text-zinc-800 text-sm leading-tight">
            {classInfo.name} • Section {classInfo.section}
          </h4>
          <span className="inline-block px-2 py-0.5 bg-zinc-50 text-zinc-500 border border-zinc-200/50 text-[8px] font-bold rounded uppercase tracking-wider">
            Total schedules: {schedules.length}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Students List</span>
          <h4 className="font-extrabold text-zinc-800 text-sm leading-tight">{students.length} Students Assigned</h4>
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-bold rounded uppercase tracking-wider">
            Exam Published: {examInfo.is_published ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Select Subject/Schedule for Grid Entry</label>
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            {schedules.map(sched => (
              <button
                key={sched.id}
                onClick={() => setActiveScheduleId(sched.id)}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeScheduleId === sched.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border border-zinc-200/50"
                }`}
              >
                {sched.subject}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Subject info box */}
        {activeSchedule.id && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-xl font-semibold text-zinc-600">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Assessment</span>
              <span className="text-zinc-800 text-xs font-bold capitalize">{activeSchedule.subject}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Theory Max</span>
              <span className="text-zinc-800 text-xs font-bold">{activeSchedule.theory_max || "N/A"} Marks</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Practical Max</span>
              <span className="text-zinc-800 text-xs font-bold">{activeSchedule.practical_max || "N/A"} Marks</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Internal Max</span>
              <span className="text-zinc-800 text-xs font-bold">{activeSchedule.internal_max || "N/A"} Marks</span>
            </div>
          </div>
        )}

        {/* Summary Card Container */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 grid grid-cols-3 gap-4 text-center font-semibold">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Students</span>
            <span className="text-zinc-800 text-sm font-extrabold">{totalStudents}</span>
          </div>
          <div className="space-y-1 border-l border-zinc-250">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Marks Entered</span>
            <span className="text-emerald-600 text-sm font-extrabold">{marksEnteredCount}</span>
          </div>
          <div className="space-y-1 border-l border-zinc-250">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Pending</span>
            <span className="text-amber-600 text-sm font-extrabold">{pendingStudentsCount}</span>
          </div>
        </div>

        {/* Search & Filter tools */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-2.5 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search student by name, roll number, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Students</option>
              <option value="filled">Filled</option>
              <option value="unfilled">Unfilled</option>
            </select>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Student</th>
                <th className="px-6 py-4 whitespace-nowrap">ID / Roll No</th>
                {activeSchedule.theory_max > 0 && <th className="px-6 py-4 whitespace-nowrap">Theory ({activeSchedule.theory_max})</th>}
                {activeSchedule.practical_max > 0 && <th className="px-6 py-4 whitespace-nowrap">Practical ({activeSchedule.practical_max})</th>}
                {activeSchedule.internal_max > 0 && <th className="px-6 py-4 whitespace-nowrap">Internal ({activeSchedule.internal_max})</th>}
                <th className="px-6 py-4 whitespace-nowrap text-center">Absent</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filteredStudents.map((student) => {
                const marksGrid = editedMarks[student.id]?.[activeScheduleId] || {
                  theory_marks: "",
                  practical_marks: "",
                  internal_marks: "",
                  is_absent: false
                };

                const isEditable = editableStudentIds.includes(student.id);

                // Inline validation errors
                const theoryError = getFieldError(student.id, activeScheduleId, "theory_marks");
                const practicalError = getFieldError(student.id, activeScheduleId, "practical_marks");
                const internalError = getFieldError(student.id, activeScheduleId, "internal_marks");

                return (
                  <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={student.full_name} 
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs">
                            {student.full_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-zinc-800 block">{student.full_name}</span>
                          <span className="text-[10px] text-zinc-400">Entry: {student.subjects_entered || 0} / {student.subjects_total || 0}</span>
                        </div>
                      </div>
                    </td>

                    {/* ID / Roll */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-500">
                      <div>
                        <span className="block text-zinc-700 font-semibold">{student.student_id}</span>
                        <span className="text-[10px] text-zinc-400">Roll: {student.roll_no || "—"}</span>
                      </div>
                    </td>

                    {/* Theory Marks */}
                    {activeSchedule.theory_max > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="space-y-1">
                          <input
                            type="number"
                            disabled={!isEditable || marksGrid.is_absent}
                            min="0"
                            max={activeSchedule.theory_max}
                            value={marksGrid.is_absent ? "" : marksGrid.theory_marks}
                            onChange={(e) => handleCellChange(student.id, activeScheduleId, "theory_marks", e.target.value)}
                            placeholder={`Max ${activeSchedule.theory_max}`}
                            className={`w-24 px-3 py-1.5 border rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 text-black disabled:bg-zinc-150 disabled:opacity-50 ${
                              theoryError ? "border-rose-500 focus:border-rose-500" : "border-zinc-200 focus:border-violet-500"
                            }`}
                          />
                          {theoryError && (
                            <p className="text-rose-600 text-[9px] font-bold mt-0.5 leading-none whitespace-normal max-w-[120px]">
                              {theoryError}
                            </p>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Practical Marks */}
                    {activeSchedule.practical_max > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="space-y-1">
                          <input
                            type="number"
                            disabled={!isEditable || marksGrid.is_absent}
                            min="0"
                            max={activeSchedule.practical_max}
                            value={marksGrid.is_absent ? "" : marksGrid.practical_marks}
                            onChange={(e) => handleCellChange(student.id, activeScheduleId, "practical_marks", e.target.value)}
                            placeholder={`Max ${activeSchedule.practical_max}`}
                            className={`w-24 px-3 py-1.5 border rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 text-black disabled:bg-zinc-150 disabled:opacity-50 ${
                              practicalError ? "border-rose-500 focus:border-rose-500" : "border-zinc-200 focus:border-violet-500"
                            }`}
                          />
                          {practicalError && (
                            <p className="text-rose-600 text-[9px] font-bold mt-0.5 leading-none whitespace-normal max-w-[120px]">
                              {practicalError}
                            </p>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Internal Marks */}
                    {activeSchedule.internal_max > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="space-y-1">
                          <input
                            type="number"
                            disabled={!isEditable || marksGrid.is_absent}
                            min="0"
                            max={activeSchedule.internal_max}
                            value={marksGrid.is_absent ? "" : marksGrid.internal_marks}
                            onChange={(e) => handleCellChange(student.id, activeScheduleId, "internal_marks", e.target.value)}
                            placeholder={`Max ${activeSchedule.internal_max}`}
                            className={`w-24 px-3 py-1.5 border rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 text-black disabled:bg-zinc-150 disabled:opacity-50 ${
                              internalError ? "border-rose-500 focus:border-rose-500" : "border-zinc-200 focus:border-violet-500"
                            }`}
                          />
                          {internalError && (
                            <p className="text-rose-600 text-[9px] font-bold mt-0.5 leading-none whitespace-normal max-w-[120px]">
                              {internalError}
                            </p>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Absent */}
                    <td className="px-6 py-4 whitespace-nowrap text-center align-top pt-5">
                      <input 
                        type="checkbox"
                        disabled={!isEditable}
                        checked={marksGrid.is_absent}
                        onChange={(e) => {
                          const val = e.target.checked;
                          handleCellChange(student.id, activeScheduleId, "is_absent", val);
                          if (val) {
                            handleCellChange(student.id, activeScheduleId, "theory_marks", "");
                            handleCellChange(student.id, activeScheduleId, "practical_marks", "");
                            handleCellChange(student.id, activeScheduleId, "internal_marks", "");
                          }
                        }}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300 disabled:opacity-50"
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center align-top pt-4">
                      {isEditable ? (
                        <button
                          onClick={() => handleSaveStudentRow(student)}
                          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-all text-[10px] cursor-pointer"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditableStudentIds(prev => [...prev, student.id])}
                          className="px-3.5 py-1.5 bg-zinc-100 border border-zinc-200 hover:bg-violet-50 hover:text-violet-600 text-zinc-600 rounded-lg font-bold transition-all text-[10px] cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    No Students Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Marks Details Modal */}
      {studentModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaUserCircle className="text-violet-500" />
                Student Marks Entry
              </h3>
              <button 
                onClick={() => setStudentModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
              {/* Profile card summary */}
              <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
                {activeStudent.photo_url ? (
                  <img 
                    src={activeStudent.photo_url} 
                    alt={activeStudent.full_name} 
                    className="w-12 h-12 rounded-full object-cover border border-zinc-200" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-base">
                    {activeStudent.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-800">{activeStudent.full_name}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-semibold mt-1">
                    <span>ID: {activeStudent.student_id}</span>
                    <span>•</span>
                    <span>Roll No: {activeStudent.roll_no || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Loader */}
              {loadingStudentDetail || !studentMarksDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Subject Assessment Scores</span>
                  
                  <div className="space-y-4">
                    {schedules.map(sched => {
                      const marksGrid = studentMarksDetail.marks?.[sched.id] || {
                        theory_marks: null,
                        practical_marks: null,
                        internal_marks: null,
                        is_absent: false
                      };

                      return (
                        <div 
                          key={sched.id} 
                          className={`p-4 border rounded-xl space-y-3 transition-all ${
                            marksGrid.is_absent 
                              ? "bg-zinc-50/50 border-zinc-200 opacity-60" 
                              : "bg-white border-zinc-200 hover:border-violet-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-zinc-800 text-xs uppercase tracking-wider">{sched.subject}</span>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={!!marksGrid.is_absent}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  handleStudentCellChange(sched.id, "is_absent", val);
                                  if (val) {
                                    handleStudentCellChange(sched.id, "theory_marks", null);
                                    handleStudentCellChange(sched.id, "practical_marks", null);
                                    handleStudentCellChange(sched.id, "internal_marks", null);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-violet-600 border-zinc-300"
                              />
                              Absent
                            </label>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            {/* Theory input */}
                            {sched.theory_max > 0 && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Theory ({sched.theory_max})</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={sched.theory_max}
                                  disabled={!!marksGrid.is_absent}
                                  value={marksGrid.is_absent ? "" : (marksGrid.theory_marks !== null ? marksGrid.theory_marks : "")}
                                  onChange={(e) => handleStudentCellChange(sched.id, "theory_marks", e.target.value !== "" ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-black disabled:opacity-50"
                                />
                              </div>
                            )}

                            {/* Practical input */}
                            {sched.practical_max > 0 && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Practical ({sched.practical_max})</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={sched.practical_max}
                                  disabled={!!marksGrid.is_absent}
                                  value={marksGrid.is_absent ? "" : (marksGrid.practical_marks !== null ? marksGrid.practical_marks : "")}
                                  onChange={(e) => handleStudentCellChange(sched.id, "practical_marks", e.target.value !== "" ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-black disabled:opacity-50"
                                />
                              </div>
                            )}

                            {/* Internal input */}
                            {sched.internal_max > 0 && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Internal ({sched.internal_max})</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={sched.internal_max}
                                  disabled={!!marksGrid.is_absent}
                                  value={marksGrid.is_absent ? "" : (marksGrid.internal_marks !== null ? marksGrid.internal_marks : "")}
                                  onChange={(e) => handleStudentCellChange(sched.id, "internal_marks", e.target.value !== "" ? parseFloat(e.target.value) : null)}
                                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-black disabled:opacity-50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Remarks Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Remarks / Notes</label>
                    <textarea
                      placeholder="Enter remarks..."
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button
                onClick={() => setStudentModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudentMarks}
                disabled={savingStudent || loadingStudentDetail}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                {savingStudent ? "Saving..." : "Save Marks"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

export default function TeacherClassMarksEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    }>
      <ClassMarksEntryContent />
    </Suspense>
  );
}
