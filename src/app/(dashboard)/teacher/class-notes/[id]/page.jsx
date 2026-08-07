"use client";

import { use, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaChevronLeft, FaFileAlt, FaDownload, FaPlayCircle, FaUser, 
  FaCalendarAlt, FaBookOpen, FaFolderOpen, FaGraduationCap
} from "react-icons/fa";
import { getClassNotesDetail } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Link from "next/link";

export default function TeacherClassNotesDetailPage({ params }) {
  const resolvedParams = use(params);
  const noteId = resolvedParams.id;
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getClassNotesDetail(noteId);
        setDetail(data.note || data.data || data || null);
      } catch (err) {
        toast.error("Failed to load study note details: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    if (noteId) {
      fetchDetail();
    }
  }, [noteId]);

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
        Class note details not found.
      </div>
    );
  }

  const isVideo = detail.file_type?.toLowerCase() === "video";
  const fileUrl = detail.file_path || detail.file_url || detail.file;
  
  // Try to parse video ID if YouTube URL
  let embedUrl = detail.video_url || "";
  if (isVideo && embedUrl) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = embedUrl.match(regExp);
    if (match && match[2].length === 11) {
      embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex items-center gap-3">
        <Link 
          href="/teacher/class-notes" 
          className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
        >
          <FaChevronLeft className="w-3.5 h-3.5" />
        </Link>
        <PageHeader
          title="Study Material Inspector"
          subtitle="Preview syllabus chapters, download handouts, and watch instruction videos."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Panel: Notes Info */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="pb-4 border-b border-zinc-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-lg uppercase tracking-wide inline-block">
                {detail.subject?.name || detail.subject || "Subject"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[9px] font-bold rounded-md uppercase tracking-wider">
                {isVideo ? <FaPlayCircle className="text-violet-500" /> : <FaFolderOpen />}
                {detail.file_type || "pdf"}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-zinc-800">{detail.title}</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              Chapter: {detail.chapter}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Description</span>
              <p className="text-zinc-600 font-medium leading-relaxed whitespace-pre-line mt-1">
                {detail.description || "No topic outline provided for this study note."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Class & Section</span>
                <span className="font-extrabold text-zinc-700 capitalize">
                  {detail.class?.name || detail.class} - {detail.section?.name || detail.section || "A"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Publisher</span>
                <span className="font-extrabold text-zinc-700 capitalize">
                  {detail.teacher?.full_name || detail.teacher || "N/A"}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Created Date</span>
              <span className="font-extrabold text-zinc-700">
                {detail.created_at_label || detail.created_at || "N/A"}
              </span>
            </div>

            {!isVideo && fileUrl && (
              <div className="border-t border-zinc-100 pt-4">
                <a 
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full justify-center inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 transition-all"
                >
                  <FaDownload className="w-3.5 h-3.5" />
                  <span>Download Study Material</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: File Preview or Video Player */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
          {isVideo ? (
            embedUrl ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-inner border border-zinc-200">
                <iframe 
                  className="w-full h-full"
                  src={embedUrl}
                  title={detail.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center space-y-3">
                <FaPlayCircle className="w-16 h-16 text-zinc-300 mx-auto" />
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Video link invalid or unavailable</p>
                <a href={detail.video_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 font-bold underline">
                  Try opening link directly
                </a>
              </div>
            )
          ) : fileUrl ? (
            fileUrl.toLowerCase().endsWith(".pdf") ? (
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
                <FaFileAlt className="w-16 h-16 text-zinc-300 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-zinc-800 text-sm">Preview Unavailable</h4>
                  <p className="text-zinc-500 font-medium">This file type ({detail.file_type}) cannot be previewed in the browser.</p>
                </div>
                <a 
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-md shadow-violet-600/10 transition-all"
                >
                  <FaDownload className="w-3.5 h-3.5" />
                  <span>Download file to view</span>
                </a>
              </div>
            )
          ) : (
            <div className="text-center space-y-3">
              <FaFileAlt className="w-16 h-16 text-zinc-200 mx-auto animate-pulse" />
              <p className="text-zinc-400 font-bold uppercase tracking-wider">No file attachment uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
