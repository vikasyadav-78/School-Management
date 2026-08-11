"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaChevronLeft, FaFileDownload, FaUser, FaCalendarAlt, FaNewspaper, FaEye, FaFilePdf, FaImage 
} from "react-icons/fa";
import { getSchoolPostDetail } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function SchoolPostDetailPage({ params }) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getSchoolPostDetail(postId);
        setDetail(data.post || data.data || data || null);
      } catch (err) {
        toast.error("Failed to load post details: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    if (postId) {
      fetchDetail();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Post details not found.
      </div>
    );
  }

  const fileUrl = detail.file_url;
  const isImage = detail.is_image || detail.file_type?.startsWith("image/");
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/posts" 
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="School Broadcast Inspector"
            subtitle="Read announcements body text and preview associated social media assets."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Metadata Card */}
          <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="pb-4 border-b border-zinc-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide border inline-block ${
                  detail.audience === "teacher" 
                    ? "bg-amber-50 border-amber-100 text-amber-700" 
                    : detail.audience === "student" 
                    ? "bg-blue-50 border-blue-100 text-blue-700" 
                    : "bg-emerald-50 border-emerald-100 text-emerald-700"
                }`}>
                  {detail.audience_label || detail.audience || "Broadcast"}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-800 uppercase tracking-wide">{detail.title}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Description Body</span>
                <p className="text-zinc-600 font-semibold leading-relaxed whitespace-pre-line mt-1">
                  {detail.body || "No text description provided for this post."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Announced By</span>
                  <span className="font-extrabold text-zinc-700 capitalize">
                    {detail.created_by?.name || "Admin"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Broadcast Type</span>
                  <span className="font-extrabold text-zinc-700 uppercase">
                    {detail.file_type || "Text Update"}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Announcement Date</span>
                <span className="font-extrabold text-zinc-700">
                  {detail.published_at_label || detail.published_at || "N/A"}
                </span>
              </div>

              {detail.download_url && (
                <div className="border-t border-zinc-100 pt-4">
                  <a 
                    href={detail.download_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full justify-center inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 transition-all cursor-pointer text-xs"
                  >
                    <FaFileDownload className="w-3.5 h-3.5" />
                    <span>Download Attachment File</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Asset Viewer Frame */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[450px] flex flex-col justify-center items-center">
            {fileUrl ? (
              isImage || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="max-w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 p-2">
                  <img 
                    src={fileUrl} 
                    alt={detail.title} 
                    className="max-h-[550px] object-contain mx-auto rounded-lg shadow-sm" 
                  />
                </div>
              ) : fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.includes("school-posts") ? (
                <div className="w-full h-[600px] rounded-xl overflow-hidden border border-zinc-200">
                  <iframe 
                    src={`${fileUrl}#toolbar=0`} 
                    className="w-full h-full"
                    frameBorder="0"
                  />
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <FaFilePdf className="w-16 h-16 text-zinc-300 mx-auto" />
                  <div>
                    <h4 className="font-extrabold text-zinc-800 text-sm">Preview Unavailable</h4>
                    <p className="text-zinc-500 font-medium">This asset type cannot be directly previewed inside the browser.</p>
                  </div>
                  {detail.download_url && (
                    <a 
                      href={detail.download_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 transition-all cursor-pointer text-xs"
                    >
                      <FaFileDownload className="w-3.5 h-3.5" />
                      <span>Download file to view</span>
                    </a>
                  )}
                </div>
              )
            ) : (
              <div className="text-center space-y-3">
                <FaNewspaper className="w-16 h-16 text-zinc-200 mx-auto animate-pulse" />
                <p className="text-zinc-400 font-bold uppercase tracking-wider">No attachment file attached to this post</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
