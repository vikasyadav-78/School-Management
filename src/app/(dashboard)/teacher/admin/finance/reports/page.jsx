"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import {
  FaFileInvoiceDollar, FaRegCreditCard, FaHistory
} from "react-icons/fa";
import {
  getTeacherFeeStructuresReport,
  getTeacherFeeOnlinePaymentsReport
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import Pagination from "@/components/ui/Pagination";

export default function TeacherAdminFinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("structures"); // structures, online

  const [feeStructures, setFeeStructures] = useState([]);
  const [feePayments, setFeePayments] = useState(null);

  // Pagination states
  const [structuresPage, setStructuresPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const pageSize = 10;

  const loadStructures = async () => {
    try {
      setLoading(true);
      const res = await getTeacherFeeStructuresReport();
      setFeeStructures(res?.report || []);
    } catch (err) {
      toast.error("Failed to load fee structures report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadOnlinePayments = async () => {
    try {
      setLoading(true);
      const res = await getTeacherFeeOnlinePaymentsReport({ payment_mode: "online" });
      setFeePayments(res);
    } catch (err) {
      toast.error("Failed to load online payments report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStructuresPage(1);
    setTransactionsPage(1);
    if (activeTab === "structures") {
      loadStructures();
    } else {
      loadOnlinePayments();
    }
  }, [activeTab]);

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Finance & Fees Reports"
        subtitle="View fee collections log summaries, cash-online splits, and outstanding structures."
      />

      {/* Tab switcher */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("structures")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "structures"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaFileInvoiceDollar /> Fee Structures
        </button>
        <button
          onClick={() => setActiveTab("online")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "online"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          <FaRegCreditCard /> Online Collections Log
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {activeTab === "structures" ? (
            <div className="space-y-4">
              <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Structure Name</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Assigned Class</th>
                      <th className="p-3">Assigned Students</th>
                      <th className="p-3">Collected</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {feeStructures.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-zinc-400">No structures found.</td>
                      </tr>
                    ) : (
                      feeStructures.slice((structuresPage - 1) * pageSize, structuresPage * pageSize).map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-3 font-bold text-zinc-900">{row.name}</td>
                          <td className="p-3 font-bold text-zinc-900">₹{(row.amount || 0).toLocaleString()}</td>
                          <td className="p-3 capitalize">{row.frequency}</td>
                          <td className="p-3">{row.class_name || "School-wide"}</td>
                          <td className="p-3">{row.assigned_count} students</td>
                          <td className="p-3 font-semibold text-emerald-600">₹{(row.total_collected || 0).toLocaleString()}</td>
                          <td className="p-3 font-semibold text-rose-600 text-right">₹{(row.total_due || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {feeStructures.length > pageSize && (
                <div className="w-full pt-2">
                  <Pagination
                    totalCount={feeStructures.length}
                    pageSize={pageSize}
                    currentPage={structuresPage}
                    onPageChange={setStructuresPage}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {feePayments?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-sm text-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Collection</span>
                    <span className="text-base font-black text-zinc-900 mt-0.5 block">₹{(feePayments.summary.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-sm text-center">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Cash Collection</span>
                    <span className="text-base font-black text-emerald-700 mt-0.5 block">₹{(feePayments.summary.cash_total || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-sm text-center">
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Online Collection</span>
                    <span className="text-base font-black text-indigo-700 mt-0.5 block">₹{(feePayments.summary.online_total || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-sm text-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Clear Count</span>
                    <span className="text-base font-black text-zinc-900 mt-0.5 block">{feePayments.summary.count || 0} clear</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Daily list */}
                <div className="space-y-2.5">
                  <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-1.5">
                    <FaHistory className="text-indigo-600" /> Daily Logs
                  </h3>
                  <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white divide-y divide-zinc-100 shadow-sm">
                    {feePayments?.daily?.length === 0 ? (
                      <div className="p-4 text-center text-zinc-400 text-xs">No daily logs found.</div>
                    ) : (
                      feePayments?.daily?.map((day, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-semibold text-zinc-900">{day.date_label}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{day.transaction_count} transaction logs</div>
                          </div>
                          <div className="text-right font-bold text-indigo-600">
                            ₹{(day.total || 0).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Transactions list */}
                <div className="lg:col-span-2 space-y-2.5">
                  <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-1.5">
                    <FaRegCreditCard className="text-emerald-600" /> Audit Database Log
                  </h3>
                  <div className="space-y-4">
                    <div className="border border-zinc-200 rounded-xl overflow-x-auto bg-white shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-2.5">Receipt No</th>
                            <th className="p-2.5">Fee Module Name</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5">Gateway</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                          {(!feePayments?.transactions || feePayments.transactions.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-zinc-400">No transactions recorded.</td>
                            </tr>
                          ) : (
                            feePayments.transactions.slice((transactionsPage - 1) * pageSize, transactionsPage * pageSize).map((row) => (
                              <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="p-2.5">
                                  <div className="font-bold text-zinc-900">{row.receipt_no}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{row.paid_at_label}</div>
                                </td>
                                <td className="p-2.5 capitalize">{row.fee_name}</td>
                                <td className="p-2.5 font-bold text-indigo-600">₹{(row.amount || 0).toLocaleString()}</td>
                                <td className="p-2.5 uppercase text-[10px] font-bold text-zinc-500">{row.gateway}</td>
                                <td className="p-2.5 text-right">
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {feePayments?.transactions?.length > pageSize && (
                      <div className="w-full pt-2">
                        <Pagination
                          totalCount={feePayments.transactions.length}
                          pageSize={pageSize}
                          currentPage={transactionsPage}
                          onPageChange={setTransactionsPage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}