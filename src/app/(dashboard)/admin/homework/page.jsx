"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaBook, FaCalendarAlt, FaPlus, FaTimes, FaFileAlt, FaCheckCircle, 
  FaHourglassHalf, FaUpload, FaTasks, FaUser, FaClipboardList, FaTrash, FaEye, FaSearch
} from "react-icons/fa";
import { 
  getHomeworkMeta, 
  getHomeworkList, 
  createHomework,
  deleteHomework,
  getAdminClassStreams
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function AdminHomeworkPage() {
  const dialog = useAppDialog();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  
  // Classes, sections, subjects and teachers selection state from meta
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);
  
  // Filters State
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create homework modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [dynamicStreams, setDynamicStreams] = useState([]);
  const [stream, setStream] = useState("");
  const [streamId, setStreamId] = useState("");

  const selectedClassObj = classes.find(c => String(c.id) === String(selectedClassId));
  const cleanClassName = selectedClassObj ? selectedClassObj.name.replace(/class\s*-?/i, '').trim() : "";
  const showStreamField = cleanClassName.includes("11") || cleanClassName.includes("12");

  useEffect(() => {
    if (showStreamField && selectedClassId) {
      getAdminClassStreams(selectedClassId)
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
  }, [showStreamField, selectedClassId]);

  // Fetch meta options
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await getHomeworkMeta();
        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        setTeachers(data.teachers || []);
      } catch (err) {
        toast.error("Failed to load homework options: " + (err.message || err));
      } finally {
        setMetaLoading(false);
      }
    };
    fetchMeta();
  }, []);

  // Fetch homework list based on active filters
  const fetchHomework = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (selectedClassFilter !== "all") params.class_id = selectedClassFilter;
      if (selectedSectionFilter !== "all") params.section_id = selectedSectionFilter;
      if (selectedSubjectFilter !== "all") params.subject_id = selectedSubjectFilter;
      if (selectedTeacherFilter !== "all") params.teacher_id = selectedTeacherFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      const data = await getHomeworkList(params);
      setHomework(data.homework || data.data || data || []);
    } catch (err) {
      toast.error("Failed to load homework roster: " + (err.message || err));
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!loading) {
      const handler = setTimeout(() => {
        fetchHomework();
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [selectedClassFilter, selectedSectionFilter, selectedSubjectFilter, selectedTeacherFilter, searchQuery]);

  // Handle class selection changes in Creation Form to filter sections
  const formClassObj = classes.find(c => c.id === selectedClassId);
  const formSections = formClassObj?.sections || [];

  // Filter sections inside filters bar
  const filterClassObj = classes.find(c => c.id === selectedClassFilter);
  const filterSections = filterClassObj?.sections || [];

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id === classId);
    const targetSecs = targetClass?.sections || [];
    setSelectedSectionId(targetSecs.length > 0 ? targetSecs[0].id : "");
  };

  // Submit Homework Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !selectedClassId || !selectedSectionId || !selectedSubjectId || !selectedTeacherId || !dueDate) {
      setFormError("All required fields must be completed.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("school_class_id", selectedClassId);
      formData.append("section_id", selectedSectionId);
      formData.append("subject_id", selectedSubjectId);
      formData.append("teacher_id", selectedTeacherId);
      formData.append("due_date", dueDate);
      
      if (description.trim()) formData.append("description", description.trim());
      if (maxMarks) formData.append("max_marks", maxMarks);
      if (videoUrl.trim()) formData.append("video_link", videoUrl.trim());
      if (attachment) formData.append("attachment", attachment);

      if (showStreamField && stream) {
        const selectedStreamObj = dynamicStreams.find(s => String(s.id) === String(stream));
        if (selectedStreamObj) {
          formData.append("stream", selectedStreamObj.name);
          formData.append("stream_id", selectedStreamObj.id);
        } else {
          formData.append("stream", stream);
          formData.append("stream_id", "");
        }
      }

      await createHomework(formData);
      toast.success("Homework assignment created successfully!");
      setIsModalOpen(false);
      
      // Clean form fields
      setTitle("");
      setDescription("");
      setSelectedClassId("");
      setSelectedSectionId("");
      setSelectedSubjectId("");
      setSelectedTeacherId("");
      setDueDate("");
      setMaxMarks("");
      setAttachment(null);
      setVideoUrl("");
      setStream("");
      setStreamId("");
      setDynamicStreams([]);

      fetchHomework(); // refresh list
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create homework assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Homework
  const handleDelete = async (homeworkId, homeworkTitle) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Homework",
      message: `Are you sure you want to permanently delete homework: "${homeworkTitle}"? This will delete all student submissions as well.`,
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      await deleteHomework(homeworkId);
      toast.success("Homework deleted successfully!");
      fetchHomework(); // refresh list
    } catch (err) {
      toast.error("Failed to delete homework: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  const baseStreamOptions = dynamicStreams.length > 0
    ? dynamicStreams.map(stm => ({ value: stm.id, label: stm.name }))
    : [
        { value: "Science", label: "Science" },
        { value: "Commerce", label: "Commerce" },
        { value: "Arts", label: "Arts" }
      ];

  const streamOptions = [
    { value: "", label: "Select Stream" },
    ...baseStreamOptions
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader 
            title="Homework Directory"
            subtitle="Manage homework tasks, assignments, deadlines, and grade student submissions."
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-705 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Create Homework
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search homework by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-55 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class filter */}
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setSelectedSectionFilter("all");
              }}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 bg-white outline-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>

            {/* Section filter */}
            <select
              disabled={selectedClassFilter === "all"}
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 bg-white outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="all">All Sections</option>
              {filterSections.map(sec => (
                <option key={sec.id} value={sec.id}>Section {sec.name}</option>
              ))}
            </select>

            {/* Subject filter */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 bg-white outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>

            {/* Teacher filter */}
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 bg-white outline-none cursor-pointer"
            >
              <option value="all">All Teachers</option>
              {teachers.map(tch => (
                <option key={tch.id} value={tch.id}>{tch.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Homework List Renders */}
        {listLoading ? (
          <div className="py-12"><PageLoader /></div>
        ) : homework.length === 0 ? (
          <EmptyState 
            title="No Homework Assignments Found" 
            desc="There are no homework tasks assigned matching your active search filters." 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homework.map((h) => (
              <div 
                key={h.id} 
                className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                        <FaBook className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-zinc-800 text-sm capitalize">{h.title}</h3>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{h.subject}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link 
                        href={`/admin/homework/${h.id}`}
                        className="p-1.5 text-zinc-400 hover:text-violet-600 rounded hover:bg-zinc-55"
                        title="View & Grade Submissions"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(h.id, h.title)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-55"
                        title="Delete Homework"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-zinc-55 p-3.5 rounded-xl border border-zinc-100/50">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Target Class:</span>
                      <span className="font-black text-zinc-800">{h.class} (Sec {h.section}){h.stream ? ` (${h.stream})` : ""}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Assigned Teacher:</span>
                      <span className="font-black text-zinc-800">{h.teacher}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Max Marks:</span>
                      <span className="font-black text-zinc-800">{h.max_marks || "N/A"}</span>
                    </div>

                    <div className="border-t border-zinc-100 my-2"></div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Due Date:</span>
                      <span className={`px-2 py-0.5 rounded font-black ${h.is_overdue ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {h.due_date_label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Creation Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaTasks className="text-violet-500" /> Create Homework Task
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
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
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calculus Homework 2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class *</label>
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700 font-bold"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section *</label>
                    <select
                      required
                      disabled={!selectedClassId}
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700 font-bold disabled:opacity-50"
                    >
                      <option value="">Select Section</option>
                      {formSections.map(s => (
                        <option key={s.id} value={s.id}>Section {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showStreamField && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Stream *</label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700 font-bold"
                    >
                      {streamOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject *</label>
                    <select
                      required
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700 font-bold"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Teacher *</label>
                    <select
                      required
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:border-violet-500 text-zinc-700 font-bold"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Max Marks (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Enter homework instructions, guidelines, questions details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold resize-none"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">YouTube/Video link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Attachment (PDF, JPG, PNG, DOCX up to 10MB)</label>
                  <input
                    type="file"
                    onChange={(e) => setAttachment(e.target.files[0])}
                    className="w-full text-zinc-600 cursor-pointer text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Homework"}
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
