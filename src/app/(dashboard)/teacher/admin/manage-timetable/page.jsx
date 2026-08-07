"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaCalendarAlt, FaTrash, FaMagic, FaUser, FaChalkboard, FaClock, FaDoorOpen
} from "react-icons/fa";
import { 
  getTeacherManageTimetableMeta,
  getTeacherManageTimetable,
  getTeacherManageTimetableTeacherSchedule,
  saveTeacherManageTimetableSlot,
  updateTeacherManageTimetableSlot,
  deleteTeacherManageTimetableSlot,
  autoGenerateTeacherManageTimetable
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" }
];

export default function TeacherManageTimetablePage() {
  const dialog = useAppDialog();
  const [viewMode, setViewMode] = useState("class"); // "class" | "teacher"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [meta, setMeta] = useState(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Timetable Data Grid
  const [timetableGrid, setTimetableGrid] = useState({});

  // Add / Edit Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotType, setSlotType] = useState("period"); // "period" | "lunch" | "sport"
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [room, setRoom] = useState("Room 12");
  const [modalClassId, setModalClassId] = useState("");
  const [modalSectionId, setModalSectionId] = useState("");
  const [modalSections, setModalSections] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Initial Meta Load
  const loadMeta = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherManageTimetableMeta();
      const metaObj = metaData.meta || metaData.data || metaData;
      setMeta(metaObj);

      if (metaObj?.classes && metaObj.classes.length > 0) {
        setSelectedClassId(metaObj.classes[0].id.toString());
        if (metaObj.classes[0].sections && metaObj.classes[0].sections.length > 0) {
          setSelectedSectionId(metaObj.classes[0].sections[0].id.toString());
        }
      }

      if (metaObj?.teachers && metaObj.teachers.length > 0) {
        setSelectedTeacherId(metaObj.teachers[0].id.toString());
      }
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load timetable manager: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  // Fetch Timetable Grid / Schedule
  const fetchTimetableData = async () => {
    if (viewMode === "class") {
      if (!selectedClassId) return;

      const clsObj = meta?.classes?.find(c => c.id.toString() === selectedClassId);
      if (clsObj && Array.isArray(clsObj.sections) && clsObj.sections.length === 0) {
        setTimetableGrid({});
        return;
      }

      if (!selectedSectionId) return;

      try {
        setListLoading(true);
        const params = { school_class_id: selectedClassId, section_id: selectedSectionId };
        const data = await getTeacherManageTimetable(params);
        
        const rawSlots = data?.slots || data?.timetable || data?.grid || data?.data || (Array.isArray(data) ? data : []);
        const gridObj = {};
        if (Array.isArray(rawSlots)) {
          rawSlots.forEach(slot => {
            const dayKey = (slot?.day || slot?.day_of_week || "").toLowerCase();
            if (dayKey) {
              if (!gridObj[dayKey]) gridObj[dayKey] = [];
              gridObj[dayKey].push(slot);
            }
          });
        }
        setTimetableGrid(gridObj);
      } catch (err) {
        console.warn(err);
        toast.error("Failed to load timetable grid: " + (err.response?.data?.message || err.message || err));
      } finally {
        setListLoading(false);
      }
    } else {
      if (!selectedTeacherId) return;
      try {
        setListLoading(true);
        const params = { teacher_id: selectedTeacherId };
        const data = await getTeacherManageTimetableTeacherSchedule(params);
        
        const rawSlots = data?.slots || data?.schedule || data?.timetable || data?.data || (Array.isArray(data) ? data : []);
        const gridObj = {};
        if (Array.isArray(rawSlots)) {
          rawSlots.forEach(slot => {
            const dayKey = (slot?.day || slot?.day_of_week || "").toLowerCase();
            if (dayKey) {
              if (!gridObj[dayKey]) gridObj[dayKey] = [];
              gridObj[dayKey].push(slot);
            }
          });
        }
        setTimetableGrid(gridObj);
      } catch (err) {
        console.warn(err);
        toast.error("Failed to load teacher schedule: " + (err.response?.data?.message || err.message || err));
      } finally {
        setListLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      fetchTimetableData();
    }
  }, [viewMode, selectedClassId, selectedSectionId, selectedTeacherId]);

  // Open Modal
  const resetSlotForm = () => {
    setEditingSlotId(null);
    setSlotType("period");
    setSubjectId("");
    setTeacherId("");
    setDayOfWeek("monday");
    setStartTime("09:00");
    setEndTime("09:45");
    setRoom("Room 12");
    setFormError("");
    setModalClassId("");
    setModalSectionId("");
    setModalSections([]);
  };

  const handleOpenAddSlot = (day = "monday") => {
    resetSlotForm();
    setDayOfWeek(day);
    if (viewMode === "teacher") {
      if (selectedTeacherId) {
        setTeacherId(selectedTeacherId);
      }
      if (selectedClassId) {
        setModalClassId(selectedClassId);
        const clsObj = meta?.classes?.find(c => c.id.toString() === selectedClassId);
        setModalSections(clsObj?.sections || []);
        if (selectedSectionId) {
          setModalSectionId(selectedSectionId);
        }
      }
    }
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot) => {
    resetSlotForm();
    setEditingSlotId(slot.id);
    setSlotType(slot.slot_type || "period");
    setSubjectId(slot.subject_id || "");
    setTeacherId(slot.teacher_id || "");
    setDayOfWeek(slot.day || slot.day_of_week || "monday");
    setStartTime(slot.start_time || "09:00");
    setEndTime(slot.end_time || "09:45");
    setRoom(slot.room || "");
    if (slot.school_class_id) {
      setModalClassId(slot.school_class_id.toString());
      const clsObj = meta?.classes?.find(c => c.id.toString() === slot.school_class_id.toString());
      setModalSections(clsObj?.sections || []);
    }
    if (slot.section_id) {
      setModalSectionId(slot.section_id.toString());
    }
    setIsSlotModalOpen(true);
  };

  const handleModalClassChange = (classIdVal) => {
    setModalClassId(classIdVal);
    const clsObj = meta?.classes?.find(c => c.id.toString() === classIdVal);
    setModalSections(clsObj?.sections || []);
    setModalSectionId("");
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setFormError("");

    const finalClassId = viewMode === "teacher" ? modalClassId : selectedClassId;
    const finalSectionId = viewMode === "teacher" ? modalSectionId : selectedSectionId;

    if (!finalClassId || !finalSectionId) {
      setFormError("Both Target Class and Section are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        school_class_id: finalClassId,
        section_id: finalSectionId,
        slot_type: slotType,
        subject_id: slotType === "period" ? (subjectId || null) : null,
        teacher_id: slotType === "period" ? (teacherId || null) : null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room: room.trim() || "Room 12"
      };

      if (editingSlotId) {
        await updateTeacherManageTimetableSlot(editingSlotId, payload);
        toast.success("Timetable slot updated!");
      } else {
        await saveTeacherManageTimetableSlot(payload);
        toast.success("Timetable slot saved!");
      }

      setIsSlotModalOpen(false);
      fetchTimetableData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save slot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Slot",
      message: "Are you sure you want to delete this timetable slot?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherManageTimetableSlot(slotId);
      toast.success("Slot deleted!");
      fetchTimetableData();
    } catch (err) {
      toast.error("Failed to delete slot: " + (err.message || err));
    }
  };

  const handleAutoGenerate = async () => {
    const isConfirmed = await dialog.confirm({
      title: "Auto-Generate Timetable",
      message: "Are you sure you want to AI Auto-Generate the timetable schedule?",
      type: "warning",
      confirmText: "Generate",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      setListLoading(true);
      await autoGenerateTeacherManageTimetable({
        school_class_id: selectedClassId,
        section_id: selectedSectionId || null
      });
      toast.success("Timetable auto-generated successfully!");
      fetchTimetableData();
    } catch (err) {
      toast.error("Failed to auto-generate: " + (err.message || err));
      setListLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Manage Timetable feature is not enabled for your account. Contact school admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const selectedClassObj = meta?.classes?.find(c => c.id.toString() === selectedClassId);
  const sections = selectedClassObj?.sections || meta?.sections || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Master Timetable Manager"
          subtitle="Design weekly class period grids, inspect teacher schedules, and auto-generate timetable slots."
        />
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleAutoGenerate}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
          >
            <FaMagic className="w-3.5 h-3.5" /> AI Auto-Generate
          </button>
          <button
            onClick={() => handleOpenAddSlot()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
          >
            <FaPlus className="w-3.5 h-3.5" /> Add Period Slot
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-150 sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setViewMode("class")}
            className={`px-4 py-1.5 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all ${
              viewMode === "class" ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Class-Wise Grid
          </button>
          <button
            onClick={() => setViewMode("teacher")}
            className={`px-4 py-1.5 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all ${
              viewMode === "teacher" ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Teacher-Wise Schedule
          </button>
        </div>

        {viewMode === "class" ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => { 
                const classIdVal = e.target.value;
                setSelectedClassId(classIdVal); 
                const classObj = meta?.classes?.find(c => c.id.toString() === classIdVal);
                const classSections = classObj?.sections || [];
                if (classSections.length > 0) {
                  setSelectedSectionId(classSections[0].id.toString());
                } else {
                  setSelectedSectionId("");
                }
              }}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
            >
              <option value="">Choose Class</option>
              {meta?.classes?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
            >
              {sections.length === 0 && <option value="">No Sections</option>}
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
            >
              <option value="">Choose Teacher</option>
              {meta?.teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      {viewMode === "class" && selectedClassObj && selectedClassObj.sections?.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-8 text-center font-bold shadow-sm max-w-xl mx-auto my-10 space-y-2">
          <div className="text-sm font-extrabold text-amber-900">No Sections Found for {selectedClassObj.name}</div>
          <p className="text-xs text-amber-700 leading-relaxed font-normal">
            This class currently has no sections configured in the system. Timetable periods require a section to be assigned. Please add a section under <strong className="font-extrabold text-amber-900">Admin Access → Classes & Sections</strong> first.
          </p>
        </div>
      ) : listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = (Array.isArray(timetableGrid) 
              ? timetableGrid.filter(s => (s.day_of_week || "").toLowerCase() === day.id)
              : (timetableGrid[day.id] || []))
              .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

            return (
              <div key={day.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-2.5 mb-3">
                    <h4 className="font-extrabold text-zinc-800 text-xs capitalize flex items-center gap-1.5">
                      <FaCalendarAlt className="text-violet-500" /> {day.label}
                    </h4>
                    <button
                      onClick={() => handleOpenAddSlot(day.id)}
                      className="p-1 bg-violet-50 text-violet-600 rounded hover:bg-violet-100 transition-colors"
                      title="Add Period to Day"
                    >
                      <FaPlus className="w-3 h-3" />
                    </button>
                  </div>

                  {daySlots.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 italic py-6 text-center">No periods scheduled.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {daySlots.map(s => (
                        <div key={s.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl relative group">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              s.slot_type === "lunch" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              s.slot_type === "sport" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              "bg-violet-50 text-violet-700 border border-violet-100"
                            }`}>
                              {s.slot_type_label || s.slot_type || "Period"}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleOpenEditSlot(s)} className="p-1 text-zinc-400 hover:text-violet-600">
                                <FaClock className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteSlot(s.id)} className="p-1 text-zinc-400 hover:text-rose-600">
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h5 className="font-bold text-zinc-800 text-xs capitalize">
                            {s.title || s.subject || s.name || s.subjects?.name || (s.slot_type === "lunch" ? "Lunch Break" : s.slot_type === "sport" ? "Sports" : "Regular Period")}
                          </h5>
                          {(() => {
                            const foundTeacher = meta?.teachers?.find(t => t.id?.toString() === s.teacher_id?.toString());
                            const resolvedTeacher = s.teacher || foundTeacher?.full_name || foundTeacher?.name || s.full_name || s.teachers?.full_name;
                            
                            return (
                              <div className="text-[9px] text-zinc-400 font-semibold space-y-0.5 mt-1">
                                {(resolvedTeacher || s.slot_type !== "lunch") && (
                                  <div>Teacher: <span className="font-bold text-zinc-600 capitalize">{resolvedTeacher || "Unassigned"}</span></div>
                                )}
                                <div>Time: <span className="font-bold text-zinc-600">{s.time_label || `${s.start_time} - ${s.end_time}`}</span>{s.room ? ` • Room: ${s.room}` : ''}</div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaClock className="text-violet-500" />
                {editingSlotId ? "Edit Timetable Slot" : "Add Timetable Period Slot"}
              </h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}

              {viewMode === "teacher" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class</label>
                    <select
                      value={modalClassId}
                      onChange={(e) => handleModalClassChange(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                      required
                    >
                      <option value="">Choose Class</option>
                      {meta?.classes?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section</label>
                    <select
                      value={modalSectionId}
                      onChange={(e) => setModalSectionId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                      required
                    >
                      <option value="">Choose Section</option>
                      {modalSections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 capitalize"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Slot Type</label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                  >
                    <option value="period">Academic Period</option>
                    <option value="lunch">Lunch Break</option>
                    <option value="sport">Sports / Extra Activity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                  >
                    <option value="">Choose Subject</option>
                    {meta?.subjects?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Teacher</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                  >
                    <option value="">Choose Teacher</option>
                    {meta?.teachers?.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">End Time</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Room</label>
                  <input 
                    type="text" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)} 
                    placeholder="e.g. Room 12"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsSlotModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs">{submitting ? "Saving..." : "Save Slot"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
