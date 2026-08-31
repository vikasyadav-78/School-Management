"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa";
import { forgotPassword } from "@/features/auth/services/module.service";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const formMethods = useForm();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await forgotPassword(data.email.trim());
      if (res.success || res.message) {
        setSuccessMessage(res.message || "Password recovery email sent successfully!");
        toast.success(res.message || "Recovery email sent!");
      } else {
        setErrorMessage("Failed to send password recovery link.");
        toast.error("Failed to send recovery link.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "An error occurred while requesting password recovery.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-violet-600/10 text-violet-400 rounded-2xl mb-2 border border-violet-500/20 shadow-lg shadow-violet-500/5 animate-pulse">
          <FaGraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
          Recover Password
        </h2>
        <p className="text-xs text-zinc-400 font-medium">Enter your email and we&apos;ll send recovery links.</p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
          {errorMessage}
        </div>
      )}

      {!successMessage && (
        <FormWrapper methods={formMethods} onSubmit={onSubmit} className="space-y-4">
          <FormInput
            name="email"
            label="Registered Email Address"
            placeholder="admin@school.com"
            type="email"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{ required: "Email is required" }}
          />

          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl border border-violet-500/30 transition-all font-bold shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Sending Link..." : "Send Recovery Link"}
          </Button>
        </FormWrapper>
      )}

      <div className="text-center text-xs text-zinc-400 pt-2">
        <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
