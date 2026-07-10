"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaTimesCircle, FaRedo, FaArrowLeft, FaHome } from "react-icons/fa";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error") || searchParams.get("message") || searchParams.get("error_message") || "Your transaction could not be authorized by the banking gateway.";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-xs text-zinc-700">
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl w-full max-w-md overflow-hidden text-center p-8 space-y-6 animate-scale-up">
        {/* Failure Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping scale-75 opacity-75" />
            <FaTimesCircle className="w-16 h-16 text-rose-500 relative z-10 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-black text-zinc-850 uppercase tracking-wide">
            Payment Failed
          </h2>
          <p className="text-zinc-450 font-semibold text-[10px]">
            Your payment could not be completed.
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-5 text-left space-y-2 text-rose-700">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-rose-500">Decline Reason</span>
          <p className="font-semibold leading-relaxed text-[10px]">{errorMessage}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/student/fees"
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 tracking-wide uppercase text-[10px]"
          >
            <FaRedo className="w-3.5 h-3.5" /> Retry Payment
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/student/fees"
              className="py-3 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5 uppercase text-[9px] tracking-wider"
            >
              <FaArrowLeft className="w-3 h-3" /> Back to Fees
            </Link>
            <Link
              href="/student/dashboard"
              className="py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-850 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5 uppercase text-[9px] tracking-wider"
            >
              <FaHome className="w-3 h-3" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}
