"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";


import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaBullhorn, FaTrash
} from "react-icons/fa";
import { 
  getTeacherManageNoticesMeta,
  getTeacherManageNotices,
  addTeacherManageNotice,
  deleteTeacherManageNotice
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherManageNoticesPage() {
  const dialog = useAppDialog();
  const [notices, setNotices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Filters State
  const [audienceFilter, setAudienceFilter] = useState("student"); // "student" | "teacher"

  // Creation Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("student"); // "student" | "teacher"
  const [targetType, setTargetType] = useState("school"); // "school" | "class" | "section"
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // 1. Initial Load
  const loadNotices = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherManageNoticesMeta();
      setMeta(metaData.meta || metaData.data || metaData);
      
      const listData = await getTeacherManageNotices({ audience: audienceFilter });
      setNotices(listData.notices || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load notice publisher: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // 2. Fetch list based on filters
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const listData = await getTeacherManageNotices({ audience: audienceFilter });
      setNotices(listData.notices || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error("Filter list failed:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      fetchFilteredList();
    }
  }, [audienceFilter]);

  // Clean form
  const resetForm = () => {
    setTitle("");
    setBody("");
    setAudience("student");
    setTargetType("school");
    setClassId("");
    setSectionId("");
    setSendSms(false);
    setSendWhatsapp(false);
    setSendEmail(true);
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !body.trim()) {
      setFormError("Notice Title and Message body are required.");
      return;
    }

    if (audience === "student" && targetType === "class" && !classId) {
      setFormError("Class selection is required when targeting class.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        body: body.trim(),
        audience,
        target_type: audience === "teacher" ? "school" : targetType,
        school_class_id: audience === "student" && targetType !== "school" ? classId : null,
        section_id: audience === "student" && targetType === "section" ? sectionId : null,
        send_sms: sendSms,
        send_whatsapp: sendWhatsapp,
        send_email: sendEmail
      };

      await addTeacherManageNotice(payload);
      toast.success("Notice published successfully!");
      setIsFormModalOpen(false);
      fetchFilteredList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to publish notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Notice",
      message: "Are you sure you want to delete this notice?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherManageNotice(noticeId);
      toast.success("Notice deleted successfully!");
      fetchFilteredList();
    } catch (err) {
      toast.error("Failed to delete notice: " + (err.message || err));
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
          Notices feature is not enabled for your account. Contact school admin.
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

  // Section meta options logic
  const selectedClassObj = meta?.classes?.find(c => c.id.toString() === classId);
  const sections = selectedClassObj?.sections || [];

  return (
      <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Publish Notices Center"
          subtitle="Announce announcements to students, parents, and teacher staffs with SMS alerts."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Publish Notice
        </button>
      </div>

      {/* Roster tab filters */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setAudienceFilter("student")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all ${
            audienceFilter === "student" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Student Notices
        </button>
        <button
          onClick={() => setAudienceFilter("teacher")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all ${
            audienceFilter === "teacher" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Teacher Notices
        </button>
      </div>

      {/* Roster Listing Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState 
          title="No Published Notices"
          desc={`Currently there are no published notices targeting the ${audienceFilter} audience.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                    notice.audience === "teacher" ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-blue-50 border-blue-100 text-blue-600"
                  }`}>
                    {notice.audience}
                  </span>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Delete Notice"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-extrabold text-zinc-800 text-sm mb-1.5">{notice.title}</h4>
                <p className="text-zinc-500 font-semibold leading-relaxed mb-4 whitespace-pre-wrap">{notice.body}</p>
              </div>

              <div className="border-t border-zinc-100 pt-3 flex flex-wrap items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                <span>Target: {notice.target_label || notice.target_type || "School"}</span>
                <span>Date: {notice.created_at_label || notice.published_at_label || notice.date || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaBullhorn className="text-violet-500" />
                Publish Announcement Notice
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Notice Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Parent-Teacher Meeting"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Announcement Message</label>
                <textarea 
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the announcement description here..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Audience Target</label>
                  <select
                    value={audience}
                    onChange={(e) => {
                      setAudience(e.target.value);
                      if (e.target.value === "teacher") setTargetType("school");
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="student">Student / Parent</option>
                    <option value="teacher">Teacher Staff</option>
                  </select>
                </div>

                {audience === "student" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Scope Target</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                    >
                      <option value="school">All School</option>
                      <option value="class">Specific Class</option>
                      <option value="section">Specific Section</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Class section dropdowns */}
              {audience === "student" && targetType !== "school" && (
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class</label>
                    <select
                      value={classId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        setSectionId("");
                      }}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
                    >
                      <option value="">Choose Class</option>
                      {meta?.classes?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {targetType === "section" && (
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section</label>
                      <select
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        disabled={!classId}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Choose Section</option>
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Dispatch methods checkboxes */}
              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Dispatch Channels</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                    <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded text-violet-600 cursor-pointer" />
                    <span className="font-extrabold text-[9px] uppercase tracking-wide text-zinc-500">Email</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                    <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} className="rounded text-violet-600 cursor-pointer" />
                    <span className="font-extrabold text-[9px] uppercase tracking-wide text-zinc-500">SMS</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                    <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} className="rounded text-violet-600 cursor-pointer" />
                    <span className="font-extrabold text-[9px] uppercase tracking-wide text-zinc-500">WhatsApp</span>
                  </label>
                </div>
              </div>

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
                  {submitting ? "Publishing..." : "Publish Notice"}
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
