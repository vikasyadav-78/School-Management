"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  getOnlinePaymentsMeta,
  getOnlinePayments,
  getTransactionDetails,
  downloadTransactionReceipt
} from "@/features/super-admin/services/super-admin.service";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  FaSearch,
  FaFilter,
  FaBuilding,
  FaCoins,
  FaReceipt,
  FaEye,
  FaDownload,
  FaPrint,
  FaRegTimesCircle,
  FaCheckCircle,
  FaTimes
} from "react-icons/fa";

export default function SuperAdminPaymentsPage() {
  const [meta, setMeta] = useState({ schools: [], payment_modes: [] });
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ count: 0, total: 0, schools: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Filters State
  const [selectedSchool, setSelectedSchool] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMode, setPaymentMode] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load Meta Options
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await getOnlinePaymentsMeta();
        if (response.success) {
          setMeta(response);
        }
      } catch (err) {
        console.error("Failed to load payments meta:", err);
      }
    };
    loadMeta();
  }, []);

  // Fetch Transactions List
  const fetchTxns = async () => {
    setListLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: pageSize,
        school_id: selectedSchool || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        payment_mode: paymentMode !== "all" ? paymentMode : undefined,
        search: searchTerm || undefined
      };

      const response = await getOnlinePayments(params);
      if (response.success) {
        setTransactions(response.transactions || []);
        setSummary(response.summary || { count: 0, total: 0, schools: 0 });
        setTotalCount(response.count || 0);
      } else {
        toast.error(response.message || "Failed to load transactions.");
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("An error occurred while loading payment transactions.");
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxns();
  }, [currentPage, selectedSchool, dateFrom, dateTo, paymentMode]);

  // Handle Search Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTxns();
  };

  // Open Details Modal
  const handleViewDetails = async (txnId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const response = await getTransactionDetails(txnId);
      if (response.success) {
        setSelectedTxn(response.transaction || null);
      } else {
        toast.error(response.message || "Failed to load transaction details.");
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error("Failed to fetch transaction details:", err);
      toast.error("Error retrieving detailed transaction log.");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Receipt Download / Printing
  const handleReceiptAction = async (txn, actionType) => {
    try {
      if (actionType === "print") {
        toast.loading("Loading print receipt...");
        const response = await api.get(`/super-admin/online-payments/${txn.id}/receipt?format=print`);
        toast.dismiss();

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(response.data);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 350);
        } else {
          toast.error("Popup blocked! Please allow popups for this site.");
        }
      } else {
        toast.loading("Generating PDF Receipt...");
        const response = await downloadTransactionReceipt(txn.id, "pdf");

        const blob = new Blob([response.data], { type: "application/pdf" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `Receipt-${txn.receipt_no || txn.transaction_id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.dismiss();
        toast.success("Receipt downloaded successfully.");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Failed to retrieve receipt:", err);
      toast.error("Failed to download or print receipt.");
    }
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="Online Payments Directory"
          description="Track global fee collections, online gateways, and payment transactions platform-wide."
        />

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <PageLoader />
          </div>
        ) : (
          <>
            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Total Collections Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Collections
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                    <FaCoins />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    ₹{(summary.total || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Successfully collected payments</p>
                </div>
              </div>

              {/* Transactions Count Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Completed Transactions
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm ring-1 ring-indigo-500/10">
                    <FaReceipt />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {summary.count || 0}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Successful fee transaction logs</p>
                </div>
              </div>

              {/* Schools Coverage Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Participating Schools
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm ring-1 ring-sky-500/10">
                    <FaBuilding />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {summary.schools || 0}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Transacting institutions active</p>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Row 1: Search & School */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Search Input */}
                  <div className="md:col-span-8 relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by Txn ID, Razorpay IDs, student name, admission no..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-14 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* School Filter */}
                  <div className="md:col-span-4">
                    <select
                      value={selectedSchool}
                      onChange={(e) => {
                        setSelectedSchool(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                    >
                      <option value="">All Schools</option>
                      {meta.schools?.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Date Filters, Payment Mode, Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                  {/* Date From */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => {
                        setPaymentMode(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-slate-200 px-3.5 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                    >
                      <option value="all">All Modes</option>
                      <option value="Online">Online Only</option>
                      <option value="Cash">Cash Only</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 lg:col-span-2 flex items-center gap-2 pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSchool("");
                        setDateFrom("");
                        setDateTo("");
                        setPaymentMode("all");
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="w-1/2 py-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="w-1/2 py-2 text-xs font-semibold shadow-sm"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Transactions List Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {listLoading ? (
                <div className="py-24 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1150px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Receipt & TXN ID</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Student Name</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Institution</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Fee Type</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Amount</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Payment Mode</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Date / Time</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">Receipt No</th>
                        <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-400 italic text-sm">
                            No transaction records found matching active filters.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((txn) => (
                          <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Receipt & TXN ID */}
                            <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 text-sm">
                                  {txn.receipt_no || "—"}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono font-normal mt-0.5">
                                  TXN: {txn.transaction_id || "—"}
                                </span>
                              </div>
                            </td>

                            {/* Student Name */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 text-sm">
                                  {txn.student_name || "—"}
                                </span>
                                {txn.class_name && (
                                  <span className="text-xs text-slate-500 font-normal mt-0.5">
                                    {txn.class_name} {txn.section_name ? `(${txn.section_name})` : ""}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Institution */}
                            <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                              {txn.school?.name || "—"}
                            </td>

                            {/* Fee Type */}
                            <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                              {txn.fee_name || "—"}
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4 whitespace-nowrap text-emerald-600 font-bold text-sm">
                              ₹{Number(txn.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            {/* Payment Mode */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="capitalize text-sm text-slate-800 font-medium">
                                  {txn.payment_mode || "—"}
                                </span>
                                {txn.gateway && (
                                  <span className="text-[11px] text-slate-400 uppercase font-normal mt-0.5">
                                    via {txn.gateway}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Date / Time */}
                            <td className="py-4 px-4 whitespace-nowrap text-xs font-mono text-slate-500">
                              {txn.paid_at_label || txn.paid_at || "—"}
                            </td>

                            {/* Fee Receipt No */}
                            <td className="py-4 px-4 whitespace-nowrap text-center">
                              {txn.fee_receipt_no ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-indigo-100 bg-indigo-50/60 text-indigo-700 text-xs font-mono font-semibold">
                                  {txn.fee_receipt_no}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            {/* Actions (View, Print, PDF) */}
                            <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewDetails(txn.id)}
                                  title="View details"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 transition-colors"
                                >
                                  <FaEye className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600" />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReceiptAction(txn, "print")}
                                  title="Print receipt HTML"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 transition-colors"
                                >
                                  <FaPrint className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Print</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReceiptAction(txn, "pdf")}
                                  title="Download receipt PDF"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors"
                                >
                                  <FaDownload className="w-3 h-3 text-blue-600" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {totalCount > pageSize && (
                <div className="px-6 py-4 border-t border-slate-100 bg-white">
                  <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Details Modal Drawer */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm border border-emerald-100">
                  <FaReceipt />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Transaction Details</h3>
                  <p className="text-[11px] text-slate-500">Official receipt log details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTxn(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {detailLoading ? (
                <div className="py-16 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : selectedTxn ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                      selectedTxn.status === "success"
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                        : "bg-rose-50/60 border-rose-200 text-rose-800"
                    }`}
                  >
                    {selectedTxn.status === "success" ? (
                      <FaCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <FaRegTimesCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-xs capitalize">
                        Payment {selectedTxn.status || "Unknown"}
                      </p>
                      <p className="text-[11px] opacity-75 mt-0.5">
                        Paid at: {selectedTxn.paid_at_label || selectedTxn.paid_at || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Core Transaction Fields */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Receipt Number
                      </span>
                      <span className="text-slate-900 font-bold text-xs block mt-0.5">
                        {selectedTxn.receipt_no || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Transaction ID
                      </span>
                      <span className="text-slate-900 font-mono font-medium text-xs block mt-0.5 truncate">
                        {selectedTxn.transaction_id || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Payment Mode
                      </span>
                      <span className="text-slate-800 font-semibold text-xs block mt-0.5 capitalize">
                        {selectedTxn.payment_mode || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Payment Gateway
                      </span>
                      <span className="text-slate-800 font-semibold text-xs block mt-0.5 uppercase">
                        {selectedTxn.gateway || "—"}
                      </span>
                    </div>
                    {selectedTxn.razorpay_order_id && (
                      <div className="col-span-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Razorpay Order ID
                        </span>
                        <span className="text-slate-800 font-mono text-xs block mt-0.5">
                          {selectedTxn.razorpay_order_id}
                        </span>
                      </div>
                    )}
                    {selectedTxn.razorpay_payment_id && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Razorpay Payment ID
                        </span>
                        <span className="text-slate-800 font-mono text-xs block mt-0.5">
                          {selectedTxn.razorpay_payment_id}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Student & School Details */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Student Name
                      </span>
                      <span className="text-slate-900 font-bold text-xs block mt-0.5">
                        {selectedTxn.student_name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Class & Section
                      </span>
                      <span className="text-slate-800 text-xs block mt-0.5">
                        {selectedTxn.class_name || "—"}{" "}
                        {selectedTxn.section_name ? `(${selectedTxn.section_name})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Fee Header
                      </span>
                      <span className="text-slate-800 text-xs block mt-0.5">
                        {selectedTxn.fee_name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Receipt Hash
                      </span>
                      <span className="text-slate-900 font-mono text-xs block mt-0.5 truncate">
                        {selectedTxn.fee_receipt_no || "—"}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Institution
                      </span>
                      <span className="text-slate-900 font-semibold text-xs block mt-0.5">
                        {selectedTxn.school?.name || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Summary Amount Card */}
                  <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                        Charged Amount
                      </span>
                      <span className="text-xs text-emerald-600">Inclusive of base fee & taxes</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700">
                      ₹{Number(selectedTxn.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 italic">
                  Failed to load detailed log record.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedTxn && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReceiptAction(selectedTxn, "print")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FaPrint /> Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReceiptAction(selectedTxn, "pdf")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                >
                  <FaDownload /> Download PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}