"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaFileAlt, FaPlus, FaTimes, FaUpload, FaSearch, FaFolderOpen, 
  FaCalendarAlt, FaUser, FaPlayCircle, FaTrash, FaEye, FaFilter
} from "react-icons/fa";
import { 
  getClassNotesClasses, 
  getClassNotesList, 
  createClassNotes,
  deleteClassNotes
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherClassNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dropdown options
  const [dropdowns, setDropdowns] = useState({
    classes: [],
    sections: [],
    subjects: [],
    file_types: ["pdf", "image", "doc", "video", "slides"]
  });
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Filters State
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Create Notes Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [fileType, setFileType] = useState("pdf"); // Default
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete Confirm Modal State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        const data = await getClassNotesClasses();
        console.log("=== Class Notes API Response ===");
        console.log(data);
        console.log("Subjects list found in response:", data?.subjects);
        
        // The API returns options, let's map them
        setDropdowns(prev => ({
          ...prev,
          classes: data.classes || [],
          sections: data.sections || [],
          subjects: data.subjects || [],
          file_types: data.file_types || prev.file_types
        }));
      } catch (err) {
        toast.error("Failed to load notes classes config: " + (err.message || err));
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Class Notes list
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterClass) params.school_class_id = filterClass;
      if (filterSection) params.section_id = filterSection;
      if (filterSubject) params.subject_id = filterSubject;

      const data = await getClassNotesList(params);
      setNotes(data.notes || data.data || data || []);
    } catch (err) {
      toast.error("Failed to load class notes: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [filterClass, filterSection, filterSubject]);

  // Nested selections mapping for Filters
  const activeFilterClassObj = dropdowns.classes.find(c => c.id.toString() === filterClass);
  const filterSections = activeFilterClassObj?.sections || dropdowns.sections || [];
  const filterSubjects = activeFilterClassObj?.subjects || dropdowns.subjects || [];

  const handleFilterClassChange = (classId) => {
    setFilterClass(classId);
    setFilterSection("");
    setFilterSubject("");
  };

  // Nested selections mapping for Form
  const activeFormClassObj = dropdowns.classes.find(c => c.id.toString() === selectedClassId);
  const formSections = activeFormClassObj?.sections || dropdowns.sections || [];
  const formSubjects = activeFormClassObj?.subjects || dropdowns.subjects || [];

  const handleFormClassChange = (classId) => {
    setSelectedClassId(classId);
    const targetClass = dropdowns.classes.find(c => c.id.toString() === classId);
    const targetSecs = targetClass?.sections || dropdowns.sections || [];
    const targetSubjs = targetClass?.subjects || dropdowns.subjects || [];
    setSelectedSectionId(targetSecs.length > 0 ? (targetSecs[0].id?.toString() || targetSecs[0].name || targetSecs[0]) : "");
    setSelectedSubjectId(targetSubjs.length > 0 ? targetSubjs[0].id?.toString() : "");
  };

  // Submit form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !chapter.trim() || !selectedClassId || !selectedSectionId || !selectedSubjectId || !fileType) {
      setFormError("All required fields must be filled.");
      return;
    }

    if (fileType !== "video" && !file) {
      setFormError("Please select a file to upload.");
      return;
    }

    if (fileType === "video" && !videoUrl.trim()) {
      setFormError("Please enter a valid video URL.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("chapter", chapter.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("school_class_id", selectedClassId);
      formData.append("section_id", selectedSectionId);
      formData.append("subject_id", selectedSubjectId);
      formData.append("file_type", fileType);

      if (fileType !== "video" && file) {
        formData.append("file", file);
      }
      if (fileType === "video" && videoUrl.trim()) {
        formData.append("video_url", videoUrl.trim());
      }

      await createClassNotes(formData);
      toast.success("Class note uploaded successfully!");
      setIsModalOpen(false);

      // Reset Form fields
      setTitle("");
      setChapter("");
      setDescription("");
      setSelectedClassId("");
      setSelectedSectionId("");
      setSelectedSubjectId("");
      setFileType("pdf");
      setFile(null);
      setVideoUrl("");

      fetchNotes(); // Reload notes
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to upload notes.");
      toast.error(err.response?.data?.message || err.message || "Failed to upload notes.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteClassNotes(deleteId);
      toast.success("Class note deleted successfully!");
      setDeleteId(null);
      fetchNotes(); // Reload notes
    } catch (err) {
      toast.error("Failed to delete note: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  console.log("=== Class Notes Render ===");
  console.log("Form Subjects List:", formSubjects);

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Class Notes & Study Material"
          subtitle="Publish lecture documents, reference materials, syllabus slides, and study notes."
        />
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 px-4 font-bold flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Upload Study Material
        </Button>
      </div>

      {/* Filter Options Panel */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
          <FaFilter className="text-violet-500 w-3.5 h-3.5" /> Filters:
        </div>

        <select
          value={filterClass}
          onChange={(e) => handleFilterClassChange(e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black"
        >
          <option value="">All Classes</option>
          {dropdowns.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name || c.class_name}</option>
          ))}
        </select>

        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          disabled={!filterClass}
          className="px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 disabled:opacity-50 text-black"
        >
          <option value="">All Sections</option>
          {filterSections.map((sec, idx) => {
            const val = sec.id?.toString() || sec.name || sec;
            const label = sec.name || sec;
            return <option key={sec.id || idx} value={val}>{label}</option>;
          })}
        </select>

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          disabled={!filterClass}
          className="px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 disabled:opacity-50 text-black"
        >
          <option value="">All Subjects</option>
          {filterSubjects.map((sub, idx) => (
            <option key={sub.id || idx} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      </div>

      {/* Roster Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200">
          <PageLoader />
        </div>
      ) : notes.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs bg-white rounded-2xl border border-zinc-200 shadow-sm">
          No Class Notes Found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => {
            const isVideo = note.file_type?.toLowerCase() === "video";
            const classNameVal = note.class?.name || note.class;
            const sectionNameVal = note.section?.name || note.section;
            const teacherNameVal = note.teacher?.full_name || note.teacher;
            const createdDateVal = note.created_at_label || note.created_at;

            return (
              <div 
                key={note.id} 
                className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all flex flex-col justify-between h-[320px]"
              >
                <div className="space-y-4">
                  {/* Header badges row */}
                  <div className="flex items-center justify-between gap-2 h-7">
                    <span className="inline-flex items-center px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg tracking-wide uppercase whitespace-nowrap">
                      {note.subject?.name || note.subject || "Subject"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px] font-bold rounded-lg uppercase tracking-wider whitespace-nowrap">
                      {isVideo ? <FaPlayCircle className="text-violet-500 shrink-0" /> : <FaFolderOpen className="shrink-0" />}
                      {note.file_type || "pdf"}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-800 line-clamp-2 leading-snug min-h-[40px] uppercase tracking-wide" title={note.title}>
                      {note.title}
                    </h3>
                    
                    {/* Information rows */}
                    <div className="space-y-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {note.chapter && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0 select-none">📖</span>
                          <span className="truncate">Chapter {note.chapter}</span>
                        </div>
                      )}
                      {(classNameVal || sectionNameVal) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0 select-none">🏫</span>
                          <span className="truncate">
                            {classNameVal ? `${classNameVal}` : ""}
                            {classNameVal && sectionNameVal ? " • " : ""}
                            {sectionNameVal ? `Section ${sectionNameVal}` : ""}
                          </span>
                        </div>
                      )}
                      {teacherNameVal && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0 select-none">👨</span>
                          <span className="truncate">{teacherNameVal}</span>
                        </div>
                      )}
                      {createdDateVal && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0 select-none">📅</span>
                          <span className="truncate">{createdDateVal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtle Divider & Actions */}
                <div>
                  <div className="border-t border-zinc-150/60 my-4" />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDeleteId(note.id)}
                      className="p-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-rose-600 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Delete Study Material"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/teacher/class-notes/${note.id}`}
                      className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-650/15 transition-all text-[11px] uppercase tracking-wider"
                    >
                      <FaEye className="w-3.5 h-3.5" />
                      View Note
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Notes Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileAlt className="text-violet-500" />
                Upload Study Material / Lecture Note
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Notes Title *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Chapter 1 Basics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Chapter Number / Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Chapter 01"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Material Description (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Enter topic outline or chapter index..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Class *</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleFormClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  >
                    <option value="">Choose Class</option>
                    {dropdowns.classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Section *</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Subject *</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    disabled={formSubjects.length === 0}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black disabled:opacity-60"
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

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">File Type *</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  >
                    {dropdowns.file_types.map((type, idx) => {
                      const val = typeof type === "string" ? type : (type.value || type.key || type.name || type.label || "");
                      const label = typeof type === "string" ? type : (type.label || type.name || type.key || val || "");
                      return (
                        <option key={val || idx} value={val}>{String(label).toUpperCase()}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {fileType !== "video" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Upload Study Document *</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-violet-300 transition-all select-none">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-5 h-5 text-zinc-400 mb-2" />
                        <p className="text-[10px] text-zinc-500 font-semibold">
                          {file ? file.name : `Select document file (${fileType.toUpperCase()})`}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        required
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Video Stream URL *</label>
                  <input 
                    type="url"
                    required
                    placeholder="e.g. https://youtube.com/watch..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2 px-6 font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/10 cursor-pointer"
                >
                  {submitting ? "Uploading..." : "Upload Material"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto shadow-inner text-xl">
                <FaTrash />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-zinc-800 text-sm">Delete Study Note?</h4>
                <p className="text-zinc-500 font-medium">Are you sure you want to permanently delete this class note assignment? This action is irreversible.</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-50/50 border-t border-zinc-100">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-2 px-6 font-bold flex items-center gap-1 shadow-lg shadow-rose-600/10 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
