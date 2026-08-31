"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaPlus, FaTimes, FaBook, FaEdit, FaToggleOn, FaToggleOff, FaCheck
} from "react-icons/fa";
import { 
  getTeacherSubjects,
  addTeacherSubject,
  updateTeacherSubject,
  toggleTeacherSubjectStatus,
  getTeacherClasses,
  getTeacherClassStreams
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // "all" | "theory" | "practical"
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "active" | "inactive"

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
  const [dynamicStreams, setDynamicStreams] = useState([]);
  const [stream, setStream] = useState("");
  const [streamId, setStreamId] = useState("");

  const hasStreamClassSelected = selectedClassIds.some(id => {
    const clsObj = classes.find(c => String(c.id) === String(id));
    if (!clsObj) return false;
    const cleanName = clsObj.name.replace(/class\s*-?/i, '').trim();
    return cleanName.includes("11") || cleanName.includes("12");
  });

  useEffect(() => {
    const firstStreamClassId = selectedClassIds.find(id => {
      const clsObj = classes.find(c => String(c.id) === String(id));
      if (!clsObj) return false;
      const cleanName = clsObj.name.replace(/class\s*-?/i, '').trim();
      return cleanName.includes("11") || cleanName.includes("12");
    });

    if (firstStreamClassId) {
      getTeacherClassStreams(firstStreamClassId)
        .then(res => {
          const streamsList = res.streams || res.data || (Array.isArray(res) ? res : []);
          setDynamicStreams(streamsList);
        })
        .catch(err => {
          console.error("Failed to load class streams:", err);
          setDynamicStreams([]);
        });
    } else {
      setDynamicStreams([]);
      setStream("");
      setStreamId("");
    }
  }, [selectedClassIds, classes]);

  // 1. Initial Load
  const loadSubjects = async () => {
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
    loadSubjects();
  }, []);

  // 2. Fetch list based on filters
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedType !== "all") params.type = selectedType;
      if (selectedStatus !== "all") params.status = selectedStatus;
      
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
  }, [searchQuery, selectedType, selectedStatus]);

  // Clean form
  const resetForm = () => {
    setName("");
    setCode("");
    setType("theory");
    setIsActive(true);
    setFormError("");
    setEditingSubjectId(null);
    setSelectedClassIds([]);
    setStream("");
    setStreamId("");
    setDynamicStreams([]);
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
    setStream(subject.stream_id || subject.stream || "");
    setStreamId(subject.stream_id || "");
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
      setFormError("Please select at least one class.");
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

      if (hasStreamClassSelected) {
        const selectedStreamObj = dynamicStreams.find(s => String(s.id) === String(stream));
        if (selectedStreamObj) {
          payload.stream = selectedStreamObj.name;
          payload.stream_id = selectedStreamObj.id;
        } else {
          payload.stream = stream;
          payload.stream_id = "";
        }
      } else {
        payload.stream = "";
        payload.stream_id = "";
      }

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

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Subjects feature is not enabled for your account. Contact school admin.
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

  const baseStreamOptions = dynamicStreams.length > 0
    ? dynamicStreams.map(stm => ({ value: stm.id, label: stm.name }))
    : [
        { value: "Science", label: "Science" },
        { value: "Commerce", label: "Commerce" },
        { value: "Arts", label: "Arts" }
      ];

  if (stream && !baseStreamOptions.some(opt => opt.value === stream)) {
    const editingSubject = subjects.find(s => s.id === editingSubjectId);
    const initialLabel = editingSubject?.stream || stream;
    baseStreamOptions.unshift({ value: stream, label: initialLabel });
  }

  const streamOptions = [
    { value: "", label: "Select Stream" },
    ...baseStreamOptions
  ];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Subjects Management"
          subtitle="Define courses, practical labs, theoretical lectures, and classroom subjects catalogs."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
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
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
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
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Listing Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState 
          title="No Subjects Configured"
          desc="Try adjusting your filters or typing a different search query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Subject Code</th>
                  <th className="px-6 py-4 whitespace-nowrap">Subject Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Course Type</th>
                  <th className="px-6 py-4 whitespace-nowrap">Stream</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-700">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-zinc-800">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                          <FaBook className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-zinc-800">{subject.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-zinc-500 font-bold">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                        subject.type === "practical" ? "bg-cyan-50 border-cyan-100 text-cyan-700" : "bg-zinc-50 border-zinc-250 text-zinc-650"
                      }`}>
                        {subject.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-650 font-bold uppercase text-[10px]">
                      {subject.stream || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2.5 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                        subject.is_active 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        {subject.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(subject)}
                          className="p-1.5 hover:bg-violet-50 rounded-lg text-zinc-500 hover:text-violet-600 transition-colors"
                          title="Edit Subject"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(subject)}
                          className={`p-1 rounded-lg transition-colors ${
                            subject.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                          }`}
                          title={subject.is_active ? "Deactivate" : "Activate"}
                        >
                          {subject.is_active ? <FaToggleOn className="w-5.5 h-5.5" /> : <FaToggleOff className="w-5.5 h-5.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaBook className="text-violet-500" />
                {editingSubjectId ? "Modify Course Subject" : "Announce New Course Subject"}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Code</label>
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MATH-101"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Course Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="theory">Theory</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active</span>
                  <input 
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Class Assign Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Assign to Classroom Classes {editingSubjectId ? "(Optional)" : "(Required)"}
                </label>
                {classes.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic">No classes configured. Please create classes first.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 bg-zinc-55 border border-zinc-155 p-3 rounded-xl max-h-[140px] overflow-y-auto text-black">
                    {classes.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <div 
                          key={cls.id} 
                          onClick={() => handleToggleClass(cls.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${isChecked ? "bg-violet-50 border-violet-200 text-violet-750" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-650"}`}
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

              {hasStreamClassSelected && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Stream *</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  >
                    {streamOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  {submitting ? "Saving..." : (editingSubjectId ? "Save Updates" : "Add Subject")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
