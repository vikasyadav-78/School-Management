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
        <div className="inline-flex p-3 bg-violet-50 text-violet-600 rounded-2xl mb-2">
          <FaGraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-800">Recover Password</h2>
        <p className="text-xs text-zinc-400">Enter your email and we&apos;ll send recovery links.</p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-bold text-center">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
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
            validation={{ required: "Email is required" }}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending Link..." : "Send Recovery Link"}
          </Button>
        </FormWrapper>
      )}

      <div className="text-center text-xs text-zinc-400 pt-2">
        <Link href="/login" className="text-violet-600 font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
