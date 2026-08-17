"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FaFileInvoiceDollar, FaRegCreditCard, FaHistory 
} from "react-icons/fa";
import { 
  getTeacherFeeStructuresReport,
  getTeacherFeeOnlinePaymentsReport
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherAdminFinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("structures"); // structures, online
  
  const [feeStructures, setFeeStructures] = useState([]);
  const [feePayments, setFeePayments] = useState(null);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const res = await getTeacherFeeStructuresReport();
      setFeeStructures(res.report || []);
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
    if (activeTab === "structures") {
      loadStructures();
    } else {
      loadOnlinePayments();
    }
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader 
          title="Finance & Fees Reports"
          subtitle="View fee collections log summaries, cash-online splits, and outstanding structures."
        />

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200">
          <button 
            onClick={() => setActiveTab("structures")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "structures" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaFileInvoiceDollar className="inline mr-1" /> Fee Structures
          </button>
          <button 
            onClick={() => setActiveTab("online")}
            className={`px-4 py-2 border-b-2 font-black uppercase text-[10px] tracking-wider transition-colors ${activeTab === "online" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}
          >
            <FaRegCreditCard className="inline mr-1" /> Online Collections log
          </button>
        </div>

        {loading ? <PageLoader /> : (
          <>
            {activeTab === "structures" ? (
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[9px]">
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
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                    {feeStructures.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-zinc-400">No structures found.</td>
                      </tr>
                    ) : (
                      feeStructures.map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-bold text-zinc-800">{row.name}</td>
                          <td className="p-3 font-bold text-zinc-800">₹{(row.amount || 0).toLocaleString()}</td>
                          <td className="p-3 capitalize">{row.frequency}</td>
                          <td className="p-3">{row.class_name || "School-wide"}</td>
                          <td className="p-3">{row.assigned_count} students</td>
                          <td className="p-3 font-bold text-emerald-600">₹{(row.total_collected || 0).toLocaleString()}</td>
                          <td className="p-3 font-bold text-rose-500 text-right">₹{(row.total_due || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {feePayments?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Collection</span>
                      <span className="text-base font-black text-zinc-800 mt-1 block">₹{(feePayments.summary.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Cash Collection</span>
                      <span className="text-base font-black text-emerald-700 mt-1 block">₹{(feePayments.summary.cash_total || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Online Collection</span>
                      <span className="text-base font-black text-indigo-700 mt-1 block">₹{(feePayments.summary.online_total || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Clear Count</span>
                      <span className="text-base font-black text-zinc-800 mt-1 block">{feePayments.summary.count} clear</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily list */}
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-zinc-805 text-[10px] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-1.5">
                      <FaHistory className="text-indigo-605" /> Daily Logs
                    </h3>
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white divide-y divide-zinc-100 shadow-sm">
                      {feePayments?.daily?.map((day, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center text-[10px]">
                          <div>
                            <div className="font-bold text-zinc-800">{day.date_label}</div>
                            <div className="text-zinc-450 mt-0.5">{day.transaction_count} transaction logs</div>
                          </div>
                          <div className="text-right font-black text-indigo-600">
                            ₹{(day.total || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transactions list */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-extrabold text-zinc-805 text-[10px] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 pb-1.5">
                      <FaRegCreditCard className="text-emerald-605" /> Audit Database Log
                    </h3>
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase text-[8px]">
                          <tr>
                            <th className="p-2.5">Receipt No</th>
                            <th className="p-2.5">Fee Module Name</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5">Gateway</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650">
                          {feePayments?.transactions?.map((row) => (
                            <tr key={row.id} className="hover:bg-zinc-50/50">
                              <td className="p-2.5">
                                <div className="font-bold text-zinc-800">{row.receipt_no}</div>
                                <div className="text-[8px] text-zinc-400">{row.paid_at_label}</div>
                              </td>
                              <td className="p-2.5 capitalize">{row.fee_name}</td>
                              <td className="p-2.5 font-bold text-indigo-600">₹{(row.amount || 0).toLocaleString()}</td>
                              <td className="p-2.5 uppercase text-[9px] font-bold text-zinc-500">{row.gateway}</td>
                              <td className="p-2.5 text-right">
                                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[9px] font-extrabold uppercase">
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
