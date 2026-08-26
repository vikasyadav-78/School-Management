"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/features/auth/redux/moduleThunk";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Breadcrumb from "./Breadcrumb";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { syncAuthCookies, clearAuthCookies } from "@/utils/cookieSync";

function DashboardLayoutContent({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, isMobileOpen, closeSidebar } = useSidebar();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkAndRestore = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const adminToken = localStorage.getItem("admin_token");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isTransitioning = currentPath.startsWith("/admin/students") || currentPath.startsWith("/admin/teachers");

      if (adminToken && currentPath.startsWith("/admin") && role !== "admin" && !isTransitioning) {
        localStorage.setItem("token", adminToken);
        localStorage.setItem("role", "admin");
        localStorage.removeItem("admin_token");
        await syncAuthCookies(adminToken, "admin", null);
        window.location.href = currentPath;
        return;
      }

      if (!token) {
        await clearAuthCookies();
        if (role === "admin" || role === "super_admin") {
          router.push("/admin-login");
        } else {
          router.push("/login");
        }
        return;
      }

      if (token && role) {
        await syncAuthCookies(token, role, adminToken);

        if (currentPath.startsWith("/super-admin") && role !== "super_admin") {
          router.push(role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
          return;
        }
        if (currentPath.startsWith("/admin") && role !== "admin" && !isTransitioning) {
          if (role === "super_admin") {
            router.push("/super-admin/dashboard");
          } else if (role === "teacher") {
            router.push("/teacher/dashboard");
          } else if (role === "student") {
            router.push("/student/dashboard");
          }
          return;
        }
      }

      if (!user) {
        dispatch(getCurrentUser()).then(async (res) => {
          if (res.meta.requestStatus === "rejected") {
            await clearAuthCookies();
            if (role === "admin") {
              router.push("/admin-login");
            } else {
              router.push("/login");
            }
          }
        });
      }
    };

    checkAndRestore();
  }, [dispatch, router, user]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

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
      <Sidebar />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isOpen ? "lg:pl-[280px]" : "lg:pl-[80px]"
          }`}
      >
        <Navbar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {adminToken && (
            <button
              onClick={() => {
                const token = localStorage.getItem("admin_token");
                if (token) {
                  localStorage.setItem("token", token);
                  localStorage.setItem("role", "admin");
                  localStorage.removeItem("admin_token");
                  window.location.href = "/admin/dashboard";
                }
              }}
              className="mb-4 px-4 py-2.5 bg-violet-600 hover:bg-violet-750 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-xs flex items-center gap-2"
            >
              &larr; Back to Admin Dashboard
            </button>
          )}
          {!["/super-admin/dashboard", "/admin/dashboard", "/teacher/dashboard", "/student/dashboard"].includes(pathname) && <Breadcrumb />}
          {children}
        </main>
      </div>

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