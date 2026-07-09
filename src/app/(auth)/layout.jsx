"use client";

import { usePathname } from "next/navigation";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Ambient background glowing orbs */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "10s" }} />
      
      {/* Premium Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/50 space-y-6 text-white">
        {children}
      </div>
    </div>
  );
}
