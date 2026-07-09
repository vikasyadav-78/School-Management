"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function SalaryPaymentForm({ record, onSubmit, onClose, loading }) {
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [deductions, setDeductions] = useState(record ? record.deductions : 0);
  const [errorMsg, setErrorMsg] = useState("");

  if (!record) return null;

  const {
    teacherName,
    teacherId,
    month,
    monthlySalary,
    presentDays,
    absentDays,
    halfDayDays,
    leaveDays,
    totalWorkingDays,
    perDaySalary
  } = record;

  const netPay = monthlySalary - Number(deductions || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const dedAmt = Number(deductions);
    if (isNaN(dedAmt) || dedAmt < 0 || dedAmt > monthlySalary) {
      setErrorMsg("Deductions must be a valid number between ₹0 and the base monthly salary.");
      return;
    }

    onSubmit({
      paymentDate,
      paymentMethod,
      deductions: dedAmt
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full my-auto mx-auto overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-zinc-800 text-sm">Process Salary Payment</h3>
            <p className="text-[10px] text-zinc-400 font-semibold block mt-0.5">Pay period: {month}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-sm font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Teacher Summary Info */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-xs space-y-2.5 font-medium text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Teacher Name</span>
              <span className="text-zinc-800 font-bold">{teacherName} ({teacherId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Working Days</span>
              <span className="text-zinc-800 font-bold">{totalWorkingDays || 22} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Attendance summary</span>
              <span className="text-zinc-800 font-bold">
                {presentDays} Present &bull; {absentDays} Absent &bull; {halfDayDays || 0} Half Day &bull; {leaveDays} Leave
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Per Day Salary</span>
              <span className="text-zinc-800 font-bold">₹{(perDaySalary || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200/60 pt-2.5">
              <span className="text-zinc-400">Monthly Base Salary</span>
              <span className="text-zinc-800 font-bold">₹{(monthlySalary || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Date */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Deductions Input (Dynamically integrated with attendance thresholds) */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Deductions</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₹</span>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="0.00"
                min="0"
                max={monthlySalary}
                step="0.01"
                className="w-full pl-7 pr-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-400 italic">
              {(absentDays > 0 || (record.unpaidLeaveDays || 0) > 0 || (halfDayDays || 0) > 0)
                ? `Calculated dynamically based on ${absentDays} absent day(s), ${record.unpaidLeaveDays || 0} unpaid leave day(s), and ${halfDayDays || 0} half day(s) (₹${(record.perDaySalary || 0).toLocaleString()} per day). Adjust manually if needed.`
                : "No absent, unpaid leave, or half days recorded. Deductions default to ₹0.00."}
            </p>
          </div>

          {/* Final Net Pay Card */}
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 flex justify-between items-center text-xs">
            <span className="font-bold text-violet-700 uppercase tracking-wider">Net Amount to Pay</span>
            <span className="text-lg font-extrabold text-violet-700">₹{(netPay || 0).toLocaleString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/10 transition-all"
            >
              {loading ? "Paying..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
