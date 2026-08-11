"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaNewspaper, FaTrash, FaCalendarAlt, FaUser, FaFileDownload, FaEye, FaImage, FaFileAlt
} from "react-icons/fa";
import { 
  getSchoolPostsMeta, 
  getSchoolPostsList, 
  addSchoolPost,
  deleteSchoolPost
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function SchoolPostsPage() {
  const dialog = useAppDialog();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Filters State
  const [audienceFilter, setAudienceFilter] = useState("view_all");

  // Creation Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [file, setFile] = useState(null);

  // 1. Initial Load
  const loadPosts = async () => {
    try {
      setLoading(true);
      const metaData = await getSchoolPostsMeta();
      setMeta(metaData.meta || metaData.data || metaData);
      
      const listData = await getSchoolPostsList({ audience: audienceFilter === "view_all" ? undefined : audienceFilter });
      setPosts(listData.posts || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      toast.error("Failed to load school posts: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // 2. Fetch list based on filters
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const listData = await getSchoolPostsList({ audience: audienceFilter === "view_all" ? undefined : audienceFilter });
      setPosts(listData.posts || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error("Filter list failed:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchFilteredList();
    }
  }, [audienceFilter]);

  // Clean form
  const resetForm = () => {
    setTitle("");
    setBody("");
    setAudience("all");
    setFile(null);
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !audience) {
      setFormError("Title and Audience fields are required.");
      return;
    }

    if (!body.trim() && !file) {
      setFormError("Please provide either a message body description or upload an attachment file.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("audience", audience);
      if (body.trim()) formData.append("body", body.trim());
      if (file) formData.append("file", file);

      await addSchoolPost(formData);
      toast.success("Post published successfully!");
      setIsFormModalOpen(false);
      fetchFilteredList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to publish school post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Post",
      message: "Are you sure you want to permanently delete this school post and its attachments?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteSchoolPost(postId);
      toast.success("Post deleted successfully!");
      fetchFilteredList();
    } catch (err) {
      toast.error("Failed to delete post: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader 
            title="School Posts & Social Updates"
            subtitle="Broadcast general news updates, visual flyers, announcements, or handouts to the community feed."
          />
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm text-xs"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Create Post
          </button>
        </div>

        {/* Audience filter tab row */}
        <div className="flex border-b border-zinc-200 gap-2">
          <button
            onClick={() => setAudienceFilter("view_all")}
            className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
              audienceFilter === "view_all" ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            All Audiences
          </button>
          {meta?.audiences?.map(aud => (
            <button
              key={aud.value}
              onClick={() => setAudienceFilter(aud.value)}
              className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
                audienceFilter === aud.value ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {aud.label}
            </button>
          ))}
        </div>

        {/* Grid Display */}
        {listLoading ? (
          <div className="flex items-center justify-center py-20"><PageLoader /></div>
        ) : posts.length === 0 ? (
          <EmptyState 
            title="No Published Posts"
            desc={`Currently there are no broadcast updates matching the "${audienceFilter}" scope.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[350px]"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                      post.audience === "teacher" 
                        ? "bg-amber-50 border-amber-100 text-amber-600" 
                        : post.audience === "student" 
                        ? "bg-blue-50 border-blue-100 text-blue-600" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}>
                      {post.audience_label || post.audience}
                    </span>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete Post"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-zinc-800 text-sm mb-2 line-clamp-1 uppercase tracking-wide">{post.title}</h3>
                  <p className="text-zinc-500 font-semibold leading-relaxed mb-4 line-clamp-3 whitespace-pre-wrap">{post.body}</p>

                  {/* Attachment Preview thumbnail if present */}
                  {post.has_file && post.file_url && (
                    <div className="mb-4">
                      {post.is_image ? (
                        <div className="w-full h-32 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                          <img src={post.file_url} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-2 text-zinc-600">
                          <FaFileAlt className="w-6 h-6 text-zinc-400 shrink-0" />
                          <div className="truncate text-left">
                            <span className="font-bold text-[10px] uppercase tracking-wide block truncate">Attached Document</span>
                            <span className="text-[9px] text-zinc-400 truncate">{post.file_type || "pdf"} attachment</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 max-w-[120px] truncate">
                      <FaUser className="text-violet-500 shrink-0" />
                      <span className="truncate">{post.created_by?.name || "Admin"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-violet-500 shrink-0" />
                      <span>{post.published_at_label || "Just Now"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      <FaEye className="w-3 h-3" /> Inspect
                    </Link>
                    {post.download_url && (
                      <a
                        href={post.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10 transition-all text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <FaFileDownload className="w-3 h-3" /> Get File
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Post Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaNewspaper className="text-violet-500" />
                  Publish School Feed Post
                </h3>
                <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
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
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Post Title *</label>
                  <input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Cultural Fest Schedule"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Audience *</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white"
                  >
                    <option value="all">Teachers & Students (All)</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="student">Students Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Post Body description</label>
                  <textarea 
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your news post details here..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Attach File (PDF/Image, max 20MB)</label>
                  <input 
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs"
                  />
                  {file && (
                    <p className="text-[9px] text-violet-600 font-bold">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-750 disabled:bg-violet-400 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {submitting ? "Publishing..." : "Publish Post"}
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
