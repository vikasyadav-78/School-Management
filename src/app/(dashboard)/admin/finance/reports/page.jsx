"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { fetchFinanceReportSummary } from "@/features/finance/redux/financeThunk";
import Pagination from "@/components/ui/Pagination";
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaArrowCircleDown, 
  FaArrowCircleUp, 
  FaCalendarAlt, 
  FaExclamationCircle,
  FaCheckCircle
} from "react-icons/fa";

export default function FinanceReportsPage() {
  const dispatch = useDispatch();

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  };

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Filter States
  const [startDate, setStartDate] = useState(getThirtyDaysAgo());
  const [endDate, setEndDate] = useState(getToday());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Redux states
  const { reportSummary, loading } = useSelector((state) => state.finance);

  useEffect(() => {
    dispatch(fetchFinanceReportSummary({ startDate, endDate }));
    setCurrentPage(1);
  }, [startDate, endDate, dispatch]);

  const {
    summary = { totalCollection: 0, totalAssigned: 0, totalDue: 0, netBalance: 0 },
    expenseBreakdown = {},
    transactions = []
  } = reportSummary || {};

  // Paginated Ledger Transactions
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Status Badges
  const statusTags = {
    paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    partial: "bg-blue-50 text-blue-600 border-blue-100"
  };

  const statusIcons = {
    paid: <FaCheckCircle className="text-emerald-500 w-3 h-3 shrink-0" />,
    pending: <FaExclamationCircle className="text-amber-500 w-3 h-3 shrink-0" />
  };

  // Safe percentage helper for fee distribution bars
  const totalOutgoing = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0);
  const getCategoryPercent = (amount) => {
    if (totalOutgoing === 0) return 0;
    return Math.round((amount / totalOutgoing) * 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Finance Reports & Fee Ledger"
        subtitle="Inspect overall student fees collections, structure-wise revenue distributions, and unpaid balances."
      />

      <div className="space-y-6">
        {/* 1. Date filter picker panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-bold text-zinc-700 uppercase">Statement Period</h4>
            <p className="text-[10px] text-zinc-400 font-semibold">Select date ranges to filter fee collections and receipts.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-44">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>
            <div className="flex items-center text-zinc-400 font-bold text-xs shrink-0">to</div>
            <div className="relative w-full md:w-44">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Primary metrics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Collected</span>
            <span className="text-xl font-extrabold text-emerald-600">₹{(summary.totalCollection || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start">Paid Income</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Assigned Dues</span>
            <span className="text-xl font-extrabold text-zinc-800">₹{(summary.totalAssigned || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 self-start">Total Dues</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Outstanding Balance</span>
            <span className="text-xl font-extrabold text-rose-600">₹{(summary.totalDue || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 self-start">Pending Dues</span>
          </div>

          <div className="bg-violet-50/50 border-violet-100 p-5 rounded-2xl border shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Net Account Balance</span>
            <span className="text-xl font-extrabold text-violet-700">
              ₹{(summary.netBalance || 0).toLocaleString()}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded border self-start bg-violet-100/60 border-violet-200 text-violet-700">
              Active Receipts
            </span>
          </div>
        </div>

        {/* 3. Breakdown and Transactions grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Fee Category Distribution */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Fee Collection Distribution</h3>
              <p className="text-[10px] text-zinc-400 font-semibold block mt-0.5">Categorized breakdown by fee structures.</p>
            </div>

            <div className="space-y-4">
              {Object.entries(expenseBreakdown).map(([category, amount]) => {
                const percent = getCategoryPercent(amount);
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-500 capitalize">{category}</span>
                      <span className="text-zinc-800 font-bold">₹{(amount || 0).toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {totalOutgoing === 0 && (
                <div className="text-center py-10 text-zinc-400 font-medium text-xs">
                  No fee collection breakdown recorded in this period.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Fee Payments Ledger Transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 text-left">
                <h3 className="text-xs font-bold text-zinc-700">Fee Payment Receipts Ledger</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Student & Receipt</th>
                      <th className="px-6 py-4">Fee Structure</th>
                      <th className="px-6 py-4 text-center">Status / Method</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-bold text-zinc-800 block leading-tight capitalize">
                            {tx.studentName || "Guest / Unnamed"}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold block mt-1">
                            Receipt: {tx.receiptNo || "N/A"} &bull; {tx.date}
                            {tx.className ? ` &bull; Class: ${tx.className}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-semibold text-zinc-600 capitalize">{tx.category}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase border items-center gap-1 ${statusTags[tx.status] || "bg-zinc-100 text-zinc-600"}`}>
                              {statusIcons[tx.status]}
                              <span>{tx.status}</span>
                            </span>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">{tx.method}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-extrabold text-sm whitespace-nowrap text-emerald-600">
                          ₹{(tx.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-zinc-400 font-medium">
                          No fee receipts found in this date period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination controls */}
            {transactions.length > itemsPerPage && (
              <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
                <Pagination
                  currentPage={currentPage}
                  totalCount={transactions.length}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}