"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser } from "@/features/auth/redux/moduleThunk";
import { clearAuthError } from "@/features/auth/redux/moduleSlice";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa";
import { APP_CONFIG } from "@/constants/appConfig";

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const formMethods = useForm({
    defaultValues: {
      email: "admin@school.com",
      password: "admin123"
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Clear previous auth errors on mount
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser({ ...data, role: "admin" })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        window.location.href = "/";
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-violet-600/10 text-violet-400 rounded-2xl mb-2 border border-violet-500/20 shadow-lg shadow-violet-500/5 animate-pulse">
          <FaGraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
          Admin Sign In
        </h2>
        <p className="text-xs text-zinc-400 font-medium">Enter your administrative credentials to continue.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
          {error}
        </div>
      )}

      {isAuthenticated && (
        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
          Login successful! Redirecting...
        </div>
      )}

      <FormWrapper methods={formMethods} onSubmit={onSubmit} className="space-y-4">
        <FormInput
          name="email"
          label="Email Address"
          placeholder="admin@school.com"
          type="email"
          labelClassName="text-zinc-300 font-medium"
          className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
          validation={{ required: "Email address is required" }}
        />
        
        <FormInput
          name="password"
          label="Password"
          placeholder="••••••••"
          type="password"
          labelClassName="text-zinc-300 font-medium"
          className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
          validation={{ required: "Password is required" }}
        />

        <div className="flex items-center justify-between text-[11px] font-medium">
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white transition-colors">
            <input 
              type="checkbox" 
              className="rounded border-zinc-800 bg-zinc-950/40 text-violet-600 focus:ring-violet-500/20 focus:ring-offset-zinc-950" 
            />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl border border-violet-500/30 transition-all font-bold shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </FormWrapper>
    </div>
  );
}
