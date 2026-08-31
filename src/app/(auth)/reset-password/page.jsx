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
        <div className="inline-flex p-3 bg-violet-600/10 text-violet-400 rounded-2xl mb-2 border border-violet-500/20 shadow-lg shadow-violet-500/5 animate-pulse">
          <FaGraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="text-xs text-zinc-400 font-medium">Choose your new secure password below.</p>
      </div>

      {successMessage && (
        <div className="space-y-4 animate-scale-up">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
            {successMessage}
          </div>
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-extrabold text-xs inline-block transition-all border border-violet-500/30 shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer"
            >
              Go to Login
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold text-center backdrop-blur-md">
          {errorMessage}
        </div>
      )}

      {!successMessage && (
        <FormWrapper methods={formMethods} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">Target Email</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-zinc-800 rounded-lg text-xs outline-none bg-zinc-950/60 text-zinc-455 font-bold cursor-not-allowed"
            />
          </div>

          <FormInput
            name="password"
            label="New Password"
            placeholder="••••••••"
            type="password"
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
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
            labelClassName="text-zinc-300 font-medium"
            className="bg-zinc-950/40 border-zinc-800/80 text-white placeholder-zinc-500 focus:bg-zinc-900/50 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
            validation={{
              required: "Confirmation password is required",
              validate: (val) => {
                if (val !== formMethods.watch("password")) {
                  return "Passwords do not match";
                }
              },
            }}
          />

          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl border border-violet-500/30 transition-all font-bold shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 cursor-pointer"
            disabled={loading || !token || !email}
          >
            {loading ? "Resetting Password..." : "Update Password"}
          </Button>
        </FormWrapper>
      )}

      {!successMessage && (
        <div className="text-center text-xs text-zinc-400 pt-2">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-bold hover:underline">
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
