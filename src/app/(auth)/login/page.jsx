"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser } from "@/features/auth/redux/moduleThunk";
import { clearAuthError } from "@/features/auth/redux/moduleSlice";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaGraduationCap, FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { APP_CONFIG } from "@/constants/appConfig";

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("student"); // "student" or "teacher"

  const studentForm = useForm({
    defaultValues: {
      student_id: "",
      date_of_birth: ""
    }
  });

  const teacherForm = useForm({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const role = localStorage.getItem("role");
      if (role === "teacher") router.push("/teacher/dashboard");
      else if (role === "student") router.push("/student/dashboard");
      else if (role === "admin") router.push("/admin/dashboard");
    }
  }, [isAuthenticated, router]);

  // Clear previous auth errors on mount or tab change
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, activeTab]);

  const onSubmit = (data) => {
    dispatch(loginUser({ ...data, role: activeTab })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        if (activeTab === "teacher") {
          window.location.href = "/teacher/dashboard";
        } else {
          window.location.href = "/student/dashboard";
        }
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
          Sign In to {APP_CONFIG.shortName}
        </h2>
        <p className="text-xs text-zinc-400 font-medium">Please select your role and enter credentials.</p>
      </div>

      {/* Tabs Selection */}
      <div className="flex p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("student")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === "student"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
        >
          <FaUserGraduate className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("teacher")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 ${activeTab === "teacher"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
        >
          <FaChalkboardTeacher className="w-3.5 h-3.5" />
          <span>Teacher Portal</span>
        </button>
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

      {activeTab === "student" ? (
        <FormWrapper methods={studentForm} onSubmit={onSubmit} className="space-y-4">
          <FormInput
            name="student_id"
            label="Student ID"
            placeholder="e.g. STU-46465-xxxx"
            type="text"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{ required: "Student ID is required" }}
          />

          <FormInput
            name="date_of_birth"
            label="Password (Date of Birth)"
            placeholder="DDMMYYYY"
            type="password"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{ required: "Password is required" }}
          />

          {/* <div className="flex items-center justify-between text-[11px] font-medium pt-1">
            <span className="text-zinc-500">Hint: Use ADM-2026-001 & DOB (DDMMYYYY)</span>
            <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
              Forgot Password?
            </Link>
          </div> */}

          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl border border-violet-500/30 transition-all font-bold shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer animate-fade-in"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Student Sign In"}
          </Button>
        </FormWrapper>
      ) : (
        <FormWrapper methods={teacherForm} onSubmit={onSubmit} className="space-y-4">
          <FormInput
            name="username"
            label="Email Address"
            placeholder="e.g. sarah.j@school.com"
            type="email"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{ required: "Email address is required" }}
          />

          <FormInput
            name="password"
            label="Password"
            placeholder="DDMMYYYY (e.g. 10051985)"
            type="password"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{ required: "Password is required" }}
          />

          <div className="flex items-center justify-between text-[11px] font-medium pt-1">
            <span className="text-zinc-500">Hint: Use sarah.j@school.com & DOB (DDMMYYYY)</span>
            <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl border border-violet-500/30 transition-all font-bold shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer animate-fade-in"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Teacher Sign In"}
          </Button>
        </FormWrapper>
      )}
    </div>
  );
}
