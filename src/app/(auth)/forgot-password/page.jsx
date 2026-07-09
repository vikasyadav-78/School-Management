"use client";

import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const formMethods = useForm();

  const onSubmit = (data) => {
    console.log("Forgot password request: ", data);
    alert("Recovery password simulation email sent!");
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

      <FormWrapper methods={formMethods} onSubmit={onSubmit} className="space-y-4">
        <FormInput
          name="email"
          label="Registered Email Address"
          placeholder="admin@school.com"
          type="email"
          validation={{ required: "Email is required" }}
        />

        <Button type="submit" className="w-full">
          Send Recovery Link
        </Button>
      </FormWrapper>

      <div className="text-center text-xs text-zinc-400 pt-2">
        <Link href="/login" className="text-violet-600 font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
