"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import { FaLock, FaKey } from "react-icons/fa";
import { changeStudentPassword } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";

export default function StudentChangePasswordPage() {
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!currentPassword || !password || !confirmPassword) {
      setFormError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("New Password and Confirm Password must match.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        current_password: currentPassword,
        password: password,
        password_confirmation: confirmPassword
      };

      await dispatch(changeStudentPassword(payload)).unwrap();
      
      toast.success("Password updated successfully!");
      
      // Clear form
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errMsg = err?.message || err || "Failed to update password.";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs max-w-md mx-auto">
      <PageHeader 
        title="Change Password" 
        subtitle="Secure your account by updating your profile password credentials."
      />

      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-zinc-700 font-extrabold text-xs uppercase tracking-wider pb-3 border-b border-zinc-100">
          <FaKey className="text-violet-500 w-4 h-4" /> Reset Security Credentials
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Current Password</label>
            <input 
              type="password"
              required
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Enter current active password"
              className="w-full p-2.5 border border-zinc-200 rounded-lg outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold text-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">New Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Enter complex new password"
              className="w-full p-2.5 border border-zinc-200 rounded-lg outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold text-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Confirm New Password</label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormError("");
              }}
              placeholder="Re-type new password to verify"
              className="w-full p-2.5 border border-zinc-200 rounded-lg outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold text-black"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs shadow-sm shadow-violet-600/10"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FaLock className="w-3 h-3" />
                  <span>Update Password</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
