"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaChevronLeft, FaDownload, FaEye, FaCalendarAlt, FaUser, FaFilePdf, FaBook 
} from "react-icons/fa";
import { getPlatformContentDetail } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function SharedNotesDetailPage({ params }) {
  const resolvedParams = use(params);
  const distributionId = resolvedParams.id;
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getPlatformContentDetail(distributionId);
        setDetail(data.item || data.data || data || null);
      } catch (err) {
        toast.error("Failed to load study note details: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    if (distributionId) {
      fetchDetail();
    }
  }, [distributionId]);

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
        Shared note details not found.
      </div>
    );
  }

  const isExam = detail.content_type?.toLowerCase() === "exam_questions";
  const fileUrl = detail.file_url || detail.file;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/shared-notes" 
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="Shared Material Inspector"
            subtitle="Preview syllabus handouts, distribute questions sheet, and inspect platform contents."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Panel: Content Metadata */}
          <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="pb-4 border-b border-zinc-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide border inline-block ${
                  isExam 
                    ? "bg-amber-50 text-amber-700 border-amber-100" 
                    : "bg-violet-50 text-violet-600 border-violet-100"
                }`}>
                  {detail.content_type_label || detail.content_type || "Content"}
                </span>
                {detail.class && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[9px] font-bold rounded-md uppercase tracking-wider">
                    {detail.class}
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-zinc-800 uppercase tracking-wide">{detail.title}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Description</span>
                <p className="text-zinc-650 font-semibold leading-relaxed whitespace-pre-line mt-1">
                  {detail.description || "No topic outline provided for this distributed note."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Target Class</span>
                  <span className="font-extrabold text-zinc-700 capitalize">
                    {detail.class || detail.target || "Whole School"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Publisher</span>
                  <span className="font-extrabold text-zinc-700 capitalize">
                    {detail.uploaded_by || "Super Admin"}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Published Date</span>
                <span className="font-extrabold text-zinc-700">
                  {detail.created_at_label || detail.created_at || "N/A"}
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
                    <FaDownload className="w-3.5 h-3.5" />
                    <span>Download PDF Paper</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: File Preview */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[450px] flex flex-col justify-center items-center">
            {fileUrl ? (
              fileUrl.toLowerCase().endsWith(".pdf") || fileUrl.includes("/storage/platform-content/") ? (
                <div className="w-full h-[600px] rounded-xl overflow-hidden border border-zinc-200">
                  <iframe 
                    src={`${fileUrl}#toolbar=0`} 
                    className="w-full h-full"
                    frameBorder="0"
                  />
                </div>
              ) : fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                <div className="max-w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <img 
                    src={fileUrl} 
                    alt={detail.title} 
                    className="max-h-[500px] object-contain mx-auto" 
                  />
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <FaFilePdf className="w-16 h-16 text-zinc-300 mx-auto" />
                  <div>
                    <h4 className="font-extrabold text-zinc-800 text-sm">Preview Unavailable</h4>
                    <p className="text-zinc-500 font-medium">Distributed content can only be previewed if PDF or Image format.</p>
                  </div>
                  {detail.download_url && (
                    <a 
                      href={detail.download_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 transition-all cursor-pointer text-xs"
                    >
                      <FaDownload className="w-3.5 h-3.5" />
                      <span>Download file to view</span>
                    </a>
                  )}
                </div>
              )
            ) : (
              <div className="text-center space-y-3">
                <FaBook className="w-16 h-16 text-zinc-200 mx-auto animate-pulse" />
                <p className="text-zinc-400 font-bold uppercase tracking-wider">No attachment distributed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
