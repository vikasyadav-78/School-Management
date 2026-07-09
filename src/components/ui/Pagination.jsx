"use client";
 
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
 
export default function Pagination({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;
 
  // Generate pages with ellipsis
  const getPages = () => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
 
    if (currentPage <= 2) {
      return [1, 2, 3, "...", totalPages];
    }
 
    if (currentPage >= totalPages - 1) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
 
    if (currentPage === 3) {
      return [1, 2, 3, "...", totalPages];
    }
 
    if (currentPage === totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
 
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };
 
  const pages = getPages();
 
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 mt-4">
      {/* Mobile view */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
 
      {/* Tablet / Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-zinc-400 font-medium">
            Showing <span className="font-semibold text-zinc-600">{(currentPage - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-zinc-600">{Math.min(currentPage * pageSize, totalCount)}</span> of{" "}
            <span className="font-semibold text-zinc-600">{totalCount}</span> results
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200/60 shadow-sm">
          {/* Previous button */}
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
 
          {/* Page Numbers */}
          <div className="flex items-center gap-1.5">
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-xs font-semibold text-zinc-400">
                    ...
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-500 text-white font-bold shadow-sm shadow-blue-500/10"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
 
          {/* Next button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="w-9 h-9 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
