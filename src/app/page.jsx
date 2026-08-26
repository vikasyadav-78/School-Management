"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/features/auth/redux/moduleThunk";

export default function HomeRedirector() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    
    if (!token) {
      if (role === "admin" || role === "super_admin") {
        router.replace("/admin-login");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (!user && !loading) {
      dispatch(getCurrentUser()).then((res) => {
        if (res.meta.requestStatus === "rejected") {
          if (role === "admin" || role === "super_admin") {
            router.replace("/admin-login");
          } else {
            router.replace("/login");
          }
        }
      });
    }
  }, [user, loading, dispatch, router]);

  useEffect(() => {
    if (user) {
      if (user.role === "super_admin") {
        router.replace("/super-admin/dashboard");
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "teacher") {
        router.replace("/teacher/dashboard");
      } else if (user.role === "student") {
        router.replace("/student/dashboard");
      } else {
        const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
        if (role === "admin" || role === "super_admin") {
          router.replace("/admin-login");
        } else {
          router.replace("/login");
        }
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Redirecting...</p>
    </div>
  );
}
