"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/features/auth/redux/moduleThunk";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Breadcrumb from "./Breadcrumb";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isOpen, isMobileOpen, closeSidebar } = useSidebar();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Instantly check for the presence of token in localStorage to avoid full layout flash
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 2. Load user session details dynamically
    dispatch(getCurrentUser()).then((res) => {
      if (res.meta.requestStatus === "rejected") {
        router.push("/login");
      }
    });
  }, [dispatch, router]);

  // Show a full-screen modern loader when verification is in progress or before mounting completes
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!mounted || !token || (loading && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isOpen ? "lg:pl-[280px]" : "lg:pl-[80px]"
        }`}
      >
        {/* Navbar */}
        <Navbar />

        {/* Content Frame */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Breadcrumb />
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-zinc-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
