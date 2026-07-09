"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function FeeCollectionForm({ remainingAmount, onSubmit, loading }) {
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const payAmount = Number(amount);
    if (!amount || payAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (payAmount > remainingAmount) {
      setErrorMsg(`Payment amount cannot exceed the remaining due amount of ₹${remainingAmount}.`);
      return;
    }

    onSubmit({
      paymentDate,
      paymentMethod,
      amount: payAmount,
      remarks
    });

    // Reset some fields
    setAmount("");
    setRemarks("");
  };

  const setFullPayment = () => {
    setAmount(String(remainingAmount));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
      <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Collect Payment</h3>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* Amount and Shortcut */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-500 uppercase">Amount to Collect</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              required
              min="1"
              max={remainingAmount}
            />
          </div>
          <button
            type="button"
            onClick={setFullPayment}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            Collect Full Due
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Date */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-500 uppercase">Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            required
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-500 uppercase">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            required
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-500 uppercase">Remarks / Reference</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Txn #1234567890, Cheque #000123"
          className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all h-20 resize-none"
        />
      </div>

      {/* Collect Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading || remainingAmount <= 0}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/10 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Processing..." : "Collect Fee"}
        </Button>
      </div>
    </form>
  );
}
