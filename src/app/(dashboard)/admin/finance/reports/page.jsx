"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { fetchFinanceReportSummary } from "@/features/finance/redux/financeThunk";
import Pagination from "@/components/ui/Pagination";
import { FaMoneyBillWave, FaCreditCard, FaArrowCircleDown, FaArrowCircleUp, FaCalendarAlt, FaChevronRight } from "react-icons/fa";

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
    summary = { totalCollection: 0, totalSalaries: 0, totalExpenses: 0, netBalance: 0 },
    expenseBreakdown = {},
    transactions = []
  } = reportSummary || {};

  // Paginated Ledger Transactions
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Helper for transaction status tags
  const typeTags = {
    Income: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Outgoing: "bg-rose-50 text-rose-600 border-rose-100"
  };

  const typeIcons = {
    Income: <FaArrowCircleUp className="text-emerald-500 w-4 h-4 shrink-0" />,
    Outgoing: <FaArrowCircleDown className="text-rose-500 w-4 h-4 shrink-0" />
  };

  // Safe percentage helper for expense bars
  const totalOutgoing = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0);
  const getCategoryPercent = (amount) => {
    if (totalOutgoing === 0) return 0;
    return Math.round((amount / totalOutgoing) * 100);
  };

  const totalOtherExpenses = summary.totalExpenses - summary.totalSalaries;

  return (
    <DashboardLayout>
      <PageHeader
        title="Finance Reports & Analytics"
        subtitle="Analyze overall school income statements, outgoing salary distributions, and net balances"
      />

      <div className="space-y-6">
        {/* 1. Date filter picker panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="text-xs font-bold text-zinc-700 uppercase">Statement Period</h4>
            <p className="text-[10px] text-zinc-400 font-semibold">Select date ranges to filter student collections and school ledger payments.</p>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Student Fees</span>
            <span className="text-xl font-extrabold text-zinc-800">₹{(summary.totalCollection || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start">Income</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Teacher Salaries</span>
            <span className="text-xl font-extrabold text-zinc-800">₹{(summary.totalSalaries || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 self-start">Outgoing Payout</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">General School Bills</span>
            <span className="text-xl font-extrabold text-zinc-800">₹{(totalOtherExpenses || 0).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 self-start">Outgoing Expenses</span>
          </div>

          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-center text-left space-y-1.5 ${
            summary.netBalance >= 0 
              ? "bg-violet-50/50 border-violet-100 text-violet-800" 
              : "bg-rose-50/50 border-rose-100 text-rose-800"
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Net Statement Balance</span>
            <span className={`text-xl font-extrabold ${summary.netBalance >= 0 ? "text-violet-700" : "text-rose-600"}`}>
              ₹{(summary.netBalance || 0).toLocaleString()}
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border self-start ${
              summary.netBalance >= 0 
                ? "bg-violet-100/60 border-violet-200 text-violet-700" 
                : "bg-rose-100 border-rose-200 text-rose-600"
            }`}>
              {summary.netBalance >= 0 ? "Surplus Balance" : "Deficit Balance"}
            </span>
          </div>
        </div>

        {/* 3. Breakdown and Transactions grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Category Allocations */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Outgoing Allocations</h3>
              <p className="text-[10px] text-zinc-400 font-semibold block mt-0.5">Distribution of school expenditures.</p>
            </div>

            <div className="space-y-4">
              {Object.entries(expenseBreakdown).map(([category, amount]) => {
                const percent = getCategoryPercent(amount);
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-500">{category}</span>
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
                  No expenditure recorded in this period.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Ledger transactions grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="text-xs font-bold text-zinc-700">Financial Ledger Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Transaction / Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-center">Type</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-bold text-zinc-800 block leading-tight">{tx.description}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold block mt-1">
                            Ref: {tx.id} &bull; {tx.date} &bull; {tx.method}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-semibold text-zinc-500">{tx.category}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[10px] border items-center gap-1 ${typeTags[tx.type]}`}>
                            {typeIcons[tx.type]}
                            <span>{tx.type}</span>
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-extrabold text-sm whitespace-nowrap ${
                          tx.type === "Income" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {tx.type === "Income" ? "+" : "-"}₹{(tx.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-zinc-400 font-medium">
                          No financial ledger entries found in this period.
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
