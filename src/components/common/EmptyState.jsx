"use client";

import { FaInbox } from "react-icons/fa";

export default function EmptyState({ title = "No data available", desc = "There are no records to display at this time." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-zinc-200 rounded-2xl text-center shadow-sm">
      <div className="p-4 rounded-full bg-zinc-50 text-zinc-400 mb-4">
        <FaInbox className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-xs mt-1">{desc}</p>
    </div>
  );
}
