"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa";
import { resetPassword } from "@/features/auth/services/module.service";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formMethods = useForm();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!token || !email) {
      setErrorMessage("Invalid or missing password reset link parameters (token/email).");
    }
  }, [token, email]);

  const onSubmit = async (data) => {
    if (!token || !email) {
      toast.error("Cannot submit: missing token or email in recovery link.");
      return;
    }

    if (data.password !== data.password_confirmation) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await resetPassword({
        email: email.trim(),
        token: token.trim(),
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (res.success || res.message) {
        setSuccessMessage(res.message || "Password has been reset successfully!");
        toast.success(res.message || "Password reset successful!");
      } else {
        setErrorMessage("Failed to reset password.");
        toast.error("Failed to reset password.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "An error occurred while resetting password.";
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
        <h2 className="text-xl font-extrabold text-zinc-800">Reset Password</h2>
        <p className="text-xs text-zinc-400">Choose your new secure password below.</p>
      </div>

      {successMessage && (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-bold text-center animate-fade-in">
            {successMessage}
          </div>
          <div className="text-center pt-2">
            <Link href="/login" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-extrabold text-xs inline-block transition-all shadow-sm cursor-pointer">
              Go to Login
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
          {errorMessage}
        </div>
      )}

      {!successMessage && (
        <FormWrapper methods={formMethods} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Email</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-500 cursor-not-allowed"
            />
          </div>

          <FormInput
            name="password"
            label="New Password"
            placeholder="••••••••"
            type="password"
            validation={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
              maxLength: {
                value: 72,
                message: "Password cannot exceed 72 characters",
              },
            }}
          />

          <FormInput
            name="password_confirmation"
            label="Confirm New Password"
            placeholder="••••••••"
            type="password"
            validation={{
              required: "Confirmation password is required",
              validate: (val) => {
                if (val !== formMethods.watch("password")) {
                  return "Passwords do not match";
                }
              },
            }}
          />

          <Button type="submit" className="w-full" disabled={loading || !token || !email}>
            {loading ? "Resetting Password..." : "Update Password"}
          </Button>
        </FormWrapper>
      )}

      {!successMessage && (
        <div className="text-center text-xs text-zinc-400 pt-2">
          <Link href="/login" className="text-violet-600 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[200px] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Loading form...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
