"use client";

import { FaExclamationTriangle } from "react-icons/fa";

export default function ErrorState({
  title = "Something went wrong",
  desc = "We encountered an error loading this content. Please try again.",
  onRetry
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-red-50/10 border border-red-100 rounded-2xl text-center shadow-sm">
      <div className="p-4 rounded-full bg-red-50 text-red-500 mb-4">
        <FaExclamationTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-xs mt-1">{desc}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-md shadow-red-600/10"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
