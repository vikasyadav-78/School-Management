"use client";

import Loader from "../ui/Loader";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <Loader size="lg" />
        <p className="text-xs text-zinc-400 font-semibold mt-3 animate-pulse">Loading dashboard context...</p>
      </div>
    </div>
  );
}
