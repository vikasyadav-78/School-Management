"use client";

import { FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

export default function FeeSummaryCard({ details }) {
  if (!details) return null;

  const {
    admissionFee,
    monthlyFee,
    transportFee,
    examFee,
    otherCharges,
    totalFee,
    paidAmount,
    remainingAmount,
    status,
    dueDate,
    lastPaymentDate
  } = details;

  const statusColors = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Partial: "bg-amber-50 text-amber-600 border-amber-100",
    Pending: "bg-rose-50 text-rose-600 border-rose-100"
  };

  const statusIcons = {
    Paid: <FaCheckCircle className="w-4 h-4 text-emerald-500" />,
    Partial: <FaExclamationTriangle className="w-4 h-4 text-amber-500" />,
    Pending: <FaTimesCircle className="w-4 h-4 text-rose-500" />
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "0";
    return Number(val).toLocaleString();
  };

  const activeStatus = status || "Pending";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Fee Summary</h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusColors[activeStatus]}`}>
          {statusIcons[activeStatus]}
          <span>{activeStatus}</span>
        </span>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        <div className="bg-blue-50/50 p-3 px-4 rounded-xl border border-blue-100 flex flex-col justify-center text-center">
          <span className="text-[10px] font-bold text-blue-600/80 uppercase tracking-wider">Total Fee</span>
          <span className="text-base font-extrabold text-blue-600 mt-1">₹{formatCurrency(totalFee)}</span>
        </div>
        <div className="bg-emerald-50/50 p-3 px-4 rounded-xl border border-emerald-100 flex flex-col justify-center text-center">
          <span className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider">Paid Amount</span>
          <span className="text-base font-extrabold text-emerald-600 mt-1">₹{formatCurrency(paidAmount)}</span>
        </div>
        <div className="bg-rose-50/50 p-3 px-4 rounded-xl border border-rose-100 flex flex-col justify-center text-center">
          <span className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider">Due Fee</span>
          <span className="text-base font-extrabold text-rose-600 mt-1">₹{formatCurrency(remainingAmount)}</span>
        </div>
      </div>

      {/* Itemized Structure */}
      <div className="border-t border-zinc-100 pt-6">
        <h4 className="text-xs font-bold text-zinc-600 mb-3 uppercase tracking-wider">Itemized Structure</h4>
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center text-zinc-500 font-medium">
            <span>Admission Fee</span>
            <span className="text-zinc-800 font-bold">₹{formatCurrency(admissionFee)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 font-medium">
            <span>Monthly Fee (Academic Year)</span>
            <span className="text-zinc-800 font-bold">₹{formatCurrency(monthlyFee)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 font-medium">
            <span>Transport Fee</span>
            <span className="text-zinc-800 font-bold">₹{formatCurrency(transportFee)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 font-medium">
            <span>Exam Fee</span>
            <span className="text-zinc-800 font-bold">₹{formatCurrency(examFee)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 font-medium">
            <span>Other Charges</span>
            <span className="text-zinc-800 font-bold">₹{formatCurrency(otherCharges)}</span>
          </div>
        </div>
      </div>

      {/* Dates metadata info */}
      <div className="border-t border-zinc-100 pt-6 grid grid-cols-2 gap-4 text-xs font-medium">
        <div>
          <span className="text-zinc-400 block font-semibold">Due Date</span>
          <span className="text-zinc-700 font-bold mt-0.5 block">{dueDate || "N/A"}</span>
        </div>
        <div>
          <span className="text-zinc-400 block font-semibold">Last Payment Date</span>
          <span className="text-zinc-700 font-bold mt-0.5 block">{lastPaymentDate || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
