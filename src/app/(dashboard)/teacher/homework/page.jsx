"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  FaBook, FaCalendarAlt, FaPlus, FaTimes, FaFileAlt, FaCheckCircle,
  FaHourglassHalf, FaUpload, FaTasks, FaUser, FaClipboardList, FaFileDownload
} from "react-icons/fa";
import {
  getHomeworkClasses,
  getHomeworkList,
  createHomework,
  getTeacherClassStreams
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherHomeworkPage() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "pending", "completed", "graded"

  // Classes, sections and subjects selection state
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // Create homework modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
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
      getTeacherClassStreams(selectedClassId)
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

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const data = await getHomeworkClasses();
        setClasses(data.classes || []);
        setSections(data.sections || []);
        setSubjects(data.subjects || []);
      } catch (err) {
        toast.error("Failed to load classes roster: " + (err.message || err));
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch homework list
  const fetchHomework = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab !== "all") {
        params.tab = activeTab;
      }
      const data = await getHomeworkList(params);
      setHomework(data.homework || data.data || data || []);
    } catch (err) {
      toast.error("Failed to load homework: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [activeTab]);

  // Handle class selection change inside Form
  const formClassObj = classes.find(c => c.id.toString() === selectedClassId);
  const formSections = formClassObj?.sections || sections || [];
  const formSubjects = formClassObj?.subjects || subjects || [];

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id.toString() === classId);
    const targetSecs = targetClass?.sections || sections || [];
    const targetSubjs = targetClass?.subjects || subjects || [];
    setSelectedSectionId(targetSecs.length > 0 ? (targetSecs[0].id?.toString() || targetSecs[0].name || targetSecs[0]) : "");
    setSelectedSubjectId(targetSubjs.length > 0 ? targetSubjs[0].id?.toString() : "");
  };

  // Submit Homework Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !description.trim() || !selectedClassId || !selectedSectionId || !selectedSubjectId || !dueDate || !maxMarks) {
      setFormError("All required fields must be filled.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("school_class_id", selectedClassId);
      formData.append("section_id", selectedSectionId);
      formData.append("subject_id", selectedSubjectId);
      formData.append("due_date", dueDate);
      formData.append("maximum_marks", maxMarks);
      if (attachment) {
        formData.append("attachment", attachment);
      }
      if (videoUrl.trim()) {
        formData.append("video_url", videoUrl.trim());
      }

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

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedClassId("");
      setSelectedSectionId("");
      setSelectedSubjectId("");
      setDueDate("");
      setMaxMarks("");
      setAttachment(null);
      setVideoUrl("");
      setStream("");
      setStreamId("");
      setDynamicStreams([]);

      fetchHomework(); // Reload list
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create homework.");
      toast.error(err.response?.data?.message || err.message || "Failed to create homework.");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Homework Assignments"
          subtitle="Publish homework assignments, review student submissions, and grade tasks."
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 px-4 font-bold flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm cursor-pointer text-xs"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Create Homework
        </Button>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-zinc-100 p-1 rounded-xl w-full max-w-lg border border-zinc-200/80">
        {["all", "today", "pending", "completed", "overdue"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${activeTab === tab
                ? "bg-white text-violet-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Roster Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200">
          <PageLoader />
        </div>
      ) : homework.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs bg-white rounded-2xl border border-zinc-200 shadow-sm">
          No Homework Found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {homework.map((hw) => {
            const submissionsCount = hw.stats?.submitted !== undefined ? hw.stats.submitted : (hw.submissions_count || hw.total_submissions || 0);
            const pendingCount = hw.stats?.pending !== undefined ? hw.stats.pending : (hw.pending_submissions_count || hw.pending_submissions || 0);
            const gradedCount = hw.stats?.graded !== undefined ? hw.stats.graded : (hw.graded_submissions_count || hw.graded_submissions || 0);

            return (
              <Link
                href={`/teacher/homework/${hw.id}`}
                key={hw.id}
                className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-violet-200 text-left group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <span className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-extrabold rounded uppercase tracking-wider">
                      {hw.subject?.name || hw.subject || "Subject"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-mono">
                      Due: {hw.due_date_label || hw.due_date || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 line-clamp-1 group-hover:text-violet-600 transition-colors">{hw.title}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      {hw.class?.name || hw.class} - {hw.section?.name || hw.section || "A"}{hw.stream ? ` (${hw.stream})` : ""}
                    </p>
                  </div>

                  {/* Submission Statistics - Centered Colored Format */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-center">
                    <div className="bg-white border border-zinc-200/60 rounded-lg p-1.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total</span>
                      <span className="text-xs font-black text-zinc-800">{submissionsCount}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-1.5">
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Pending</span>
                      <span className="text-xs font-black text-amber-700">{pendingCount}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-1.5">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Graded</span>
                      <span className="text-xs font-black text-emerald-700">{gradedCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold pt-3.5 mt-4 border-t border-zinc-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    marks : <strong className="text-zinc-800 font-bold">{hw.max_marks || "N/A"}</strong>
                  </span>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider border ${hw.status?.toLowerCase() === "active" || hw.status?.toLowerCase() === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-zinc-50 text-zinc-400 border-zinc-100"
                    }`}>
                    {hw.status || "Active"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Homework Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaBook className="text-violet-500" />
                Create New Homework Assignment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs">
              {formError && (
                <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Homework Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly English Essay"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-800 bg-zinc-50 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description / Instructions *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter assignment details or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-800 bg-zinc-50 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Class *</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-bold text-zinc-700 bg-zinc-50 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Choose Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Section *</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-bold text-zinc-700 bg-zinc-50 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Choose Section</option>
                    {formSections.map((sec, idx) => {
                      const val = sec.id?.toString() || sec.name || sec;
                      const label = sec.name || sec;
                      return <option key={sec.id || idx} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>

              {showStreamField && (
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Subject *</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    disabled={formSubjects.length === 0}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-bold text-zinc-700 bg-zinc-50 focus:bg-white transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {formSubjects.length === 0 ? (
                      <option value="">No Subjects Available</option>
                    ) : (
                      <>
                        <option value="">Choose Subject</option>
                        {formSubjects.map((sub, idx) => (
                          <option key={sub.id || idx} value={sub.id}>{sub.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Maximum Marks *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-800 bg-zinc-50 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-800 bg-zinc-50 focus:bg-white transition-all cursor-pointer font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Video Tutorial URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://youtube.com/watch..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-800 bg-zinc-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Upload Attachment File (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-violet-300 transition-all select-none">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaUpload className="w-5 h-5 text-zinc-400 mb-2" />
                      <p className="text-[10px] text-zinc-500 font-semibold">
                        {attachment ? attachment.name : "Click to upload pdf, doc, or image files"}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 px-6 font-bold flex items-center gap-1.5 shadow-sm cursor-pointer text-xs"
                >
                  {submitting ? "Publishing..." : "Publish Homework"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}