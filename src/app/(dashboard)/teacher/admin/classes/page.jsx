"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaChalkboard, FaEdit, FaTrash, FaToggleOn, FaToggleOff, 
  FaFolder, FaBook, FaUsers, FaUserGraduate, FaLayerGroup, FaCog
} from "react-icons/fa";
import { 
  getTeacherClassesMeta,
  getTeacherClasses,
  addTeacherClass,
  getTeacherClassDetail,
  updateTeacherClass,
  toggleTeacherClassStatus,
  deleteTeacherClass,
  addTeacherClassSection,
  assignTeacherClassSubject,
  updateTeacherSection,
  deleteTeacherSection,
  generateTeacherSectionRollNumbers,
  updateTeacherClassSubject,
  deleteTeacherClassSubject
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherClassesPage() {
  const dialog = useAppDialog();
  const [classesList, setClassesList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Selected Class Inspector & Modals State
  const [activeClass, setActiveClass] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create / Edit Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classActive, setClassActive] = useState(true);

  // Section Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionName, setSectionName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("40");

  // Subject Assignment Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingClassSubjectId, setEditingClassSubjectId] = useState(null);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // 1. Initial Load
  const loadRoster = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherClassesMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getTeacherClasses();
      setClassesList(listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load classes panel: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const refreshClasses = async () => {
    try {
      const listData = await getTeacherClasses();
      setClassesList(listData.classes || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error(err);
    }
  };

  // Open Class Detail Drawer
  const handleOpenDetail = async (cls) => {
    try {
      const detailed = await getTeacherClassDetail(cls.id);
      setActiveClass(detailed.class || detailed.data || detailed || cls);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load class details: " + (err.message || err));
    }
  };

  // Reset Form
  const resetClassForm = () => {
    setClassName("");
    setClassCode("");
    setAcademicYearId("");
    setClassActive(true);
    setFormError("");
    setEditingClassId(null);
  };

  const handleOpenAddClass = () => {
    resetClassForm();
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls) => {
    resetClassForm();
    setEditingClassId(cls.id);
    setClassName(cls.name || "");
    setClassCode(cls.code || "");
    setAcademicYearId(cls.academic_year_id || "");
    setClassActive(!!cls.is_active);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!className.trim()) {
      setFormError("Class Name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: className.trim(),
        code: classCode.trim(),
        academic_year_id: academicYearId || null,
        is_active: classActive
      };

      if (editingClassId) {
        await updateTeacherClass(editingClassId, payload);
        toast.success("Class updated successfully!");
      } else {
        await addTeacherClass(payload);
        toast.success("Class created successfully!");
      }

      setIsClassModalOpen(false);
      refreshClasses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save class.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cls) => {
    try {
      await toggleTeacherClassStatus(cls.id);
      toast.success(`Toggled status for ${cls.name}`);
      refreshClasses();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleDeleteClass = async (classId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Class",
      message: "Are you sure you want to delete this class?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherClass(classId);
      toast.success("Class deleted successfully!");
      if (activeClass?.id === classId) setIsDetailModalOpen(false);
      refreshClasses();
    } catch (err) {
      toast.error("Failed to delete class: " + (err.message || err));
    }
  };

  // Section Management
  const handleOpenAddSection = () => {
    setEditingSectionId(null);
    setSectionName("");
    setRoomNumber("");
    setCapacity("40");
    setFormError("");
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!sectionName.trim()) {
      setFormError("Section Name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: sectionName.trim(),
        room_number: roomNumber.trim(),
        capacity: parseInt(capacity) || 40
      };

      if (editingSectionId) {
        await updateTeacherSection(editingSectionId, payload);
        toast.success("Section updated successfully!");
      } else {
        await addTeacherClassSection(activeClass.id, payload);
        toast.success("Section added successfully!");
      }

      setIsSectionModalOpen(false);
      handleOpenDetail(activeClass);
      refreshClasses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save section.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Section",
      message: "Are you sure you want to delete this section?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherSection(sectionId);
      toast.success("Section deleted!");
      handleOpenDetail(activeClass);
      refreshClasses();
    } catch (err) {
      toast.error("Failed to delete section: " + (err.message || err));
    }
  };

  const handleGenerateRollNumbers = async (sectionId) => {
    try {
      await generateTeacherSectionRollNumbers(sectionId);
      toast.success("Roll numbers generated successfully for section!");
      handleOpenDetail(activeClass);
    } catch (err) {
      toast.error("Failed to generate roll numbers: " + (err.message || err));
    }
  };

  // Subject Assignment Management
  const handleOpenAddSubject = () => {
    setEditingClassSubjectId(null);
    setSubjectId("");
    setTeacherId("");
    setFormError("");
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!subjectId) {
      setFormError("Subject is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        subject_id: subjectId,
        teacher_id: teacherId || null
      };

      if (editingClassSubjectId) {
        await updateTeacherClassSubject(editingClassSubjectId, payload);
        toast.success("Subject teacher updated!");
      } else {
        await assignTeacherClassSubject(activeClass.id, payload);
        toast.success("Subject assigned to class!");
      }

      setIsSubjectModalOpen(false);
      handleOpenDetail(activeClass);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save subject assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClassSubject = async (classSubjectId) => {
    const isConfirmed = await dialog.confirm({
      title: "Remove Subject",
      message: "Are you sure you want to remove this subject assignment?",
      type: "delete",
      confirmText: "Remove",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherClassSubject(classSubjectId);
      toast.success("Subject assignment removed!");
      handleOpenDetail(activeClass);
    } catch (err) {
      toast.error("Failed to remove subject assignment: " + (err.message || err));
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
          Classes feature is not enabled for your account. Contact school admin.
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

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Classes & Sections Manager"
          subtitle="Configure classroom sections, assign subject teachers, and manage roll numbers."
        />
        <button
          onClick={handleOpenAddClass}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Create New Class
        </button>
      </div>

      {/* Roster Listing Grid */}
      {classesList.length === 0 ? (
        <EmptyState 
          title="No Classes Configured"
          desc="Get started by creating your first school class setup."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classesList.map((cls) => (
            <div key={cls.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                    cls.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  }`}>
                    {cls.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(cls)}
                      className={`p-1 rounded transition-colors ${cls.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"}`}
                      title={cls.is_active ? "Deactivate" : "Activate"}
                    >
                      {cls.is_active ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1 text-zinc-400 hover:text-violet-600 rounded transition-colors"
                      title="Edit Class"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Class"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-sm">
                    <FaChalkboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-800 text-sm">{cls.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Code: {cls.code || "—"}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <div className="flex justify-between">
                    <span>Sections:</span>
                    <span className="font-bold text-zinc-700">{cls.sections_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Students Enrolled:</span>
                    <span className="font-bold text-zinc-700">{cls.students_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class Teacher:</span>
                    <span className="font-bold text-zinc-700">{cls.class_teacher || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Academic Session:</span>
                    <span className="font-bold text-zinc-700">{cls.academic_year || cls.academic_year_name || "Current"}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenDetail(cls)}
                className="w-full py-2 bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <FaFolder className="w-3.5 h-3.5" />
                Manage Class Setup
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaChalkboard className="text-violet-500" />
                {editingClassId ? "Modify Class Configuration" : "Create New School Class"}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class Name</label>
                <input 
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 10"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class Code</label>
                <input 
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="e.g. CLS-10"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Session</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500"
                >
                  <option value="">Default Current Session</option>
                  {meta?.academic_years?.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="classActiveCheck"
                  checked={classActive}
                  onChange={(e) => setClassActive(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300"
                />
                <label htmlFor="classActiveCheck" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">Class Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold text-xs"
                >
                  {submitting ? "Saving..." : (editingClassId ? "Save Updates" : "Create Class")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Detail Inspector Modal (Sections & Subjects setup) */}
      {isDetailModalOpen && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaChalkboard className="text-violet-500" />
                Class Setup Inspector: <span className="text-violet-600">{activeClass.name}</span>
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Sections list block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="font-extrabold text-zinc-800 text-xs flex items-center gap-1.5">
                    <FaLayerGroup className="text-violet-500" />
                    Sections ({activeClass.sections?.length || 0})
                  </h4>
                  <button
                    onClick={handleOpenAddSection}
                    className="px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <FaPlus className="w-3 h-3" /> Add Section
                  </button>
                </div>

                {(!activeClass.sections || activeClass.sections.length === 0) ? (
                  <p className="text-[10px] text-zinc-400 italic">No sections created for this class yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeClass.sections.map(sec => (
                      <div key={sec.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-zinc-800 text-xs block">Section {sec.name}</span>
                          <span className="text-[9px] text-zinc-400 font-bold block">Room: {sec.room_number || "N/A"} • Cap: {sec.capacity || 40}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleGenerateRollNumbers(sec.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded-md border border-emerald-100"
                            title="Auto Generate Roll Numbers"
                          >
                            Roll Nos
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                            title="Delete Section"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Subject Teacher Assignments block */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="font-extrabold text-zinc-800 text-xs flex items-center gap-1.5">
                    <FaBook className="text-violet-500" />
                    Assigned Subjects & Teachers ({activeClass.class_subjects?.length || 0})
                  </h4>
                  <button
                    onClick={handleOpenAddSubject}
                    className="px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <FaPlus className="w-3 h-3" /> Assign Subject
                  </button>
                </div>

                {(() => {
                  const assignedSubjects = activeClass.class_subjects || activeClass.subjects || activeClass.classSubjects || [];
                  if (assignedSubjects.length === 0) {
                    return <p className="text-[10px] text-zinc-400 italic">No subject teachers assigned yet.</p>;
                  }
                  return (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold text-zinc-400 uppercase">
                          <tr>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Assigned Teacher</th>
                            <th className="px-4 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                          {assignedSubjects.map((cs, idx) => {
                            const metaSubject = meta?.subjects?.find(s => s.id === cs.subject_id || s.id === cs.id);
                            const metaTeacher = meta?.teachers?.find(t => t.id === cs.teacher_id || t.id === cs.teacher?.id);

                            const subjectName = cs.subject_name || cs.name || cs.subject?.name || cs.subject?.subject_name || cs.title || metaSubject?.name || cs.code || cs.subject?.code || metaSubject?.code || (cs.subject_id ? `Subject (${cs.subject_id.slice(0, 8)})` : `Subject #${idx + 1}`);
                            const teacherName = cs.teacher_name || cs.teacher?.full_name || cs.teacher?.name || (cs.teacher?.first_name ? `${cs.teacher.first_name} ${cs.teacher.last_name || ""}`.trim() : null) || metaTeacher?.full_name || metaTeacher?.name || "Unassigned";

                            return (
                              <tr key={cs.id || cs.subject_id || idx}>
                                <td className="px-4 py-2.5 font-bold text-zinc-800">{subjectName}</td>
                                <td className="px-4 py-2.5 text-zinc-600">{teacherName}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    onClick={() => handleDeleteClassSubject(cs.id || cs.subject_id)}
                                    className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                                    title="Remove Subject Assignment"
                                  >
                                    <FaTrash className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm">Add Classroom Section</h3>
              <button onClick={() => setIsSectionModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSection} className="p-6 space-y-4">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section Name (e.g. A, B, Red)</label>
                <input 
                  type="text" 
                  value={sectionName} 
                  onChange={(e) => setSectionName(e.target.value)} 
                  placeholder="Section letter"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Room Number</label>
                <input 
                  type="text" 
                  value={roomNumber} 
                  onChange={(e) => setRoomNumber(e.target.value)} 
                  placeholder="e.g. Room 102"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Capacity</label>
                <input 
                  type="number" 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)} 
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs">{submitting ? "Saving..." : "Add Section"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Assignment Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm">Assign Subject to Class</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-700 font-semibold"
                >
                  <option value="">Choose Subject</option>
                  {meta?.subjects?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Assigned Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-700 font-semibold"
                >
                  <option value="">Choose Teacher</option>
                  {meta?.teachers?.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs">{submitting ? "Assigning..." : "Assign Subject"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
