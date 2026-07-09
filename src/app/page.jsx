"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/features/auth/redux/moduleThunk";

export default function HomeRedirector() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!user) {
      dispatch(getCurrentUser()).then((res) => {
        if (res.meta.requestStatus === "rejected") {
          router.replace("/login");
        }
      });
    }
  }, [user, dispatch, router]);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user.role === "teacher") {
        router.replace("/teacher/dashboard");
      } else if (user.role === "student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/login");
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
