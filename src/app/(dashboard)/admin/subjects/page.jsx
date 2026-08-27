"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaPlus, FaTimes, FaBook, FaEdit, FaToggleOn, FaToggleOff, FaTrash, FaCheck
} from "react-icons/fa";
import { 
  getTeacherSubjects,
  addTeacherSubject,
  updateTeacherSubject,
  toggleTeacherSubjectStatus,
  deleteTeacherSubject,
  getTeacherClasses
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function AdminSubjectsPage() {
  const dialog = useAppDialog();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // "all" | "theory" | "practical"
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "active" | "inactive"
  const [selectedClassId, setSelectedClassId] = useState("all");

  // Creation/Edit Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("theory"); // "theory" | "practical"
  const [isActive, setIsActive] = useState(true);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // 1. Initial Load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData] = await Promise.all([
        getTeacherSubjects(),
        getTeacherClasses()
      ]);
      setSubjects(subjectsData.subjects || subjectsData.data || (Array.isArray(subjectsData) ? subjectsData : []));
      setClasses(classesData.classes || classesData.data || (Array.isArray(classesData) ? classesData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load subjects panel: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch list based on filters
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedType !== "all") params.type = selectedType;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedClassId !== "all") params.class_id = selectedClassId;
      
      const listData = await getTeacherSubjects(params);
      setSubjects(listData.subjects || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error("Filter list failed:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      const handler = setTimeout(() => {
        fetchFilteredList();
      }, 400); // 400ms debounce
      return () => clearTimeout(handler);
    }
  }, [searchQuery, selectedType, selectedStatus, selectedClassId]);

  // Clean form
  const resetForm = () => {
    setName("");
    setCode("");
    setType("theory");
    setIsActive(true);
    setSelectedClassIds([]);
    setFormError("");
    setEditingSubjectId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    resetForm();
    setEditingSubjectId(subject.id);
    setName(subject.name || "");
    setCode(subject.code || "");
    setType(subject.type || "theory");
    setIsActive(!!subject.is_active);
    setSelectedClassIds(subject.school_class_ids || subject.classes?.map(c => c.id) || []);
    setIsFormModalOpen(true);
  };

  const handleToggleClass = (classId) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !code.trim()) {
      setFormError("Subject Name and Subject Code are required.");
      return;
    }

    if (!editingSubjectId && selectedClassIds.length === 0) {
      setFormError("At least one class assignment is required for new subjects.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        code: code.trim(),
        type,
        is_active: isActive,
        school_class_ids: selectedClassIds
      };

      if (editingSubjectId) {
        await updateTeacherSubject(editingSubjectId, payload);
        toast.success("Subject updated successfully!");
      } else {
        await addTeacherSubject(payload);
        toast.success("Subject added successfully!");
      }

      setIsFormModalOpen(false);
      fetchFilteredList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save subject details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subject) => {
    try {
      await toggleTeacherSubjectStatus(subject.id);
      toast.success(`Toggled active status for ${subject.name}`);
      fetchFilteredList();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Subject",
      message: "Are you sure you want to permanently delete this subject?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherSubject(subjectId);
      toast.success("Subject deleted successfully!");
      fetchFilteredList();
    } catch (err) {
      toast.error("Failed to delete subject: " + (err.message || err));
    }
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
            <FaTimes className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-500 font-bold leading-relaxed mt-2">
            Subjects feature is not enabled for your account. Contact school admin.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Subjects Management"
          subtitle="Define courses, practical labs, theoretical lectures, and classroom subjects catalogs."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-770 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Course Subject
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search subjects by name, subject code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-55 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Class</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-55 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-55 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-55 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {listLoading ? (
        <div className="py-12"><PageLoader /></div>
      ) : subjects.length === 0 ? (
        <EmptyState 
          title="No Course Subjects Found" 
          desc="Try modifying your filters or create a new subject record to populate the registry." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div 
              key={sub.id} 
              className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                      <FaBook className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-zinc-800 text-sm capitalize">{sub.name}</h3>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Code: {sub.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(sub)}
                      className="p-1 text-zinc-400 hover:text-zinc-650 rounded transition-colors"
                      title={sub.is_active ? "Mark Inactive" : "Mark Active"}
                    >
                      {sub.is_active ? (
                        <FaToggleOn className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <FaToggleOff className="w-5 h-5 text-zinc-300" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-zinc-400 hover:text-violet-600 rounded hover:bg-zinc-55"
                      title="Edit Subject"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-55"
                      title="Delete Subject"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-zinc-55 p-3.5 rounded-xl border border-zinc-100/50">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Course Type:</span>
                    <span className={`px-2 py-0.5 rounded font-black ${sub.type === "practical" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                      {sub.type}
                    </span>
                  </div>

                  <div className="border-t border-zinc-100 my-2"></div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest block">Assigned Classes</span>
                    {(!sub.classes || sub.classes.length === 0) ? (
                      <span className="text-[10px] text-zinc-400 italic font-medium">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.classes.map((cls, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-extrabold text-[9px] rounded border border-zinc-200">
                            {cls.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation/Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                <FaBook className="text-violet-500" />
                {editingSubjectId ? "Edit Course Subject" : "Create Course Subject"}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-655 cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar text-xs font-semibold">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700"
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              {/* Class Assign Checkboxes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Assign to Classroom Classes {editingSubjectId ? "(Optional)" : "(Required)"}
                  </label>
                  {classes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = selectedClassIds.length === classes.length;
                        setSelectedClassIds(allSelected ? [] : classes.map(cls => cls.id));
                      }}
                      className="text-[10px] font-black uppercase text-violet-600 hover:text-violet-700 transition-colors cursor-pointer select-none"
                    >
                      {selectedClassIds.length === classes.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>
                {classes.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic">No classes configured. Please create classes first.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 border border-zinc-200 p-3 rounded-xl max-h-[140px] overflow-y-auto text-black">
                    {classes.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <div 
                          key={cls.id} 
                          onClick={() => handleToggleClass(cls.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${isChecked ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-650"}`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${isChecked ? "bg-violet-600 border-violet-600 text-white" : "border-zinc-300 bg-white"}`}>
                            {isChecked && <FaCheck className="w-2 h-2" />}
                          </div>
                          <span className="font-extrabold text-[10px]">{cls.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveForm"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="isActiveForm" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">
                  Mark as Active status
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-155 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
