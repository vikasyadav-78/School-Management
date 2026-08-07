"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaBook, FaSearch, FaFilter, FaDownload, FaEye, FaFolderOpen, 
  FaCalendarAlt, FaUser, FaFilePdf, FaChevronRight 
} from "react-icons/fa";
import { 
  getPlatformContentMeta, 
  getPlatformContentList 
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function SharedNotesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ content_types: [], classes: [] });
  const [metaLoading, setMetaLoading] = useState(false);

  // Filters State
  const [filterType, setFilterType] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load metadata dropdowns
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await getPlatformContentMeta();
        setMeta({
          content_types: data.content_types || [],
          classes: data.classes || []
        });
      } catch (err) {
        toast.error("Failed to load shared content metadata: " + (err.message || err));
      } finally {
        setMetaLoading(false);
      }
    };
    fetchMeta();
  }, []);

  // Fetch distributed content
  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filterType) params.content_type = filterType;
      if (filterClass) params.school_class_id = filterClass;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getPlatformContentList(params);
      setItems(data.items || data.data || data || []);
    } catch (err) {
      toast.error("Failed to load shared notes: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [filterType, filterClass, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Shared Notes & Question Papers"
            subtitle="View and download materials, reference sheets, syllabus handouts, and exams distributed by the Super Admin."
          />
        </div>

        {/* Toolbar filters */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <FaFilter className="text-violet-500 w-3.5 h-3.5" /> Filters:
          </div>

          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text"
              placeholder="Search by Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black text-xs"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black"
          >
            <option value="">All Content Types</option>
            {meta.content_types.map((type, idx) => (
              <option key={type.value || idx} value={type.value}>{type.label || String(type.value).toUpperCase()}</option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold bg-zinc-50 text-black"
          >
            <option value="">All Classes</option>
            {meta.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Content Listing Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200">
            <PageLoader />
          </div>
        ) : items.length === 0 ? (
          <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-wider text-xs bg-white rounded-2xl border border-zinc-200 shadow-sm">
            No Shared Notes & Papers Found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const isExam = item.content_type?.toLowerCase() === "exam_questions";
              
              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 hover:border-violet-300 transition-all duration-300 flex flex-col justify-between h-[300px]"
                >
                  <div className="space-y-4">
                    {/* Header badges */}
                    <div className="flex items-center justify-between gap-2 h-7">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-lg tracking-wide uppercase border whitespace-nowrap ${
                        isExam 
                          ? "bg-amber-50 text-amber-700 border-amber-100" 
                          : "bg-violet-50 text-violet-600 border-violet-100"
                      }`}>
                        {item.content_type_label || item.content_type || "Content"}
                      </span>
                      {item.class && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px] font-bold rounded-lg uppercase tracking-wider whitespace-nowrap">
                          {item.class}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2 text-left">
                      <h3 className="text-sm font-extrabold text-zinc-800 line-clamp-2 leading-snug min-h-[40px] uppercase tracking-wide" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-zinc-600 text-[11px] font-semibold line-clamp-2 leading-normal" title={item.description}>
                        {item.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Metadata and Actions footer */}
                  <div className="space-y-3">
                    <div className="border-t border-zinc-100/60 my-2" />
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <FaUser className="text-violet-500 shrink-0" />
                        <span className="truncate">{item.uploaded_by || "Super Admin"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FaCalendarAlt className="text-violet-500 shrink-0" />
                        <span>{item.created_at_label || item.created_at?.split("T")[0] || "N/A"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/shared-notes/${item.id}`}
                        className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[11px] uppercase tracking-wider cursor-pointer"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      {item.download_url && (
                        <a
                          href={item.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-600/15 transition-all text-[11px] uppercase tracking-wider cursor-pointer"
                        >
                          <FaDownload className="w-3.5 h-3.5" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
