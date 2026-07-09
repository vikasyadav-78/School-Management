"use client";

import { FaPrint, FaCheckCircle, FaGraduationCap } from "react-icons/fa";
import { APP_CONFIG } from "@/constants/appConfig";
import Button from "@/components/ui/Button";

export default function FeeReceipt({ receipt, onClear }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg overflow-hidden max-w-md mx-auto animate-fade-in print:shadow-none print:border-none print:max-w-full print:p-0">
      {/* Receipt Voucher Body */}
      <div className="p-8 space-y-6 print:p-0" id="printable-receipt">
        {/* Invoice Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <FaGraduationCap className="text-violet-600 w-8 h-8 shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 text-sm block">{APP_CONFIG.name}</span>
              <span className="text-[9px] text-zinc-400 font-semibold block uppercase">Payment Receipt</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">Receipt No</span>
            <span className="text-xs font-bold text-zinc-800">{receipt.receiptNo}</span>
          </div>
        </div>

        {/* Success Alert Banner */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800 print:hidden">
          <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-left">
            <h4 className="text-xs font-bold">Payment Complete</h4>
            <p className="text-[10px] font-medium mt-0.5">Fee payment collected and recorded successfully.</p>
          </div>
        </div>

        {/* Voucher Fields */}
        <div className="space-y-4 text-xs font-medium border-b border-zinc-100 pb-6">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Student Name</span>
            <span className="text-zinc-800 font-bold">{receipt.studentName}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Student ID</span>
            <span className="text-zinc-800 font-semibold">{receipt.studentId}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Class</span>
            <span className="text-zinc-800 font-semibold">Class {receipt.className}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Payment Date</span>
            <span className="text-zinc-800 font-semibold">{receipt.paymentDate}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400">Payment Method</span>
            <span className="text-zinc-800 font-semibold">{receipt.paymentMethod}</span>
          </div>
          {receipt.remarks && (
            <div className="flex justify-between items-start py-0.5">
              <span className="text-zinc-400">Remarks</span>
              <span className="text-zinc-600 font-medium text-right max-w-[200px] leading-relaxed">{receipt.remarks}</span>
            </div>
          )}
        </div>

        {/* Total Paid Section */}
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Amount Paid</span>
          <span className="text-lg font-extrabold text-zinc-800">₹{(receipt.amount || 0).toLocaleString()}</span>
        </div>

        <div className="text-center text-[10px] text-zinc-400 font-semibold leading-relaxed uppercase border-t border-dashed border-zinc-100 pt-6">
          Thank you for your payment
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-4 print:hidden">
        <button
          onClick={onClear}
          className="flex-1 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold transition-all"
        >
          Close Receipt
        </button>
        <Button
          onClick={handlePrint}
          className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/10 transition-all flex items-center justify-center gap-2"
        >
          <FaPrint className="w-3.5 h-3.5" />
          <span>Print Receipt</span>
        </Button>
      </div>
    </div>
  );
}
