"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaMoneyBillWave, FaDownload, FaPrint, FaEye, FaTimes, FaFileInvoiceDollar, FaSpinner } from "react-icons/fa";
import { getTeacherSalaryReport, getTeacherSalaryDetail, downloadTeacherSalaryReceipt } from "@/features/teachers/services/teacher.service";

export default function TeacherSalaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("");
  
  // Modal State
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Download State
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchSalary = async (period = "") => {
    setLoading(true);
    try {
      const response = await getTeacherSalaryReport({ period });
      if (response.success) {
        setData(response);
      } else {
        setError(response.message || "Failed to load salary report");
      }
    } catch (err) {
      setError(err.message || "Failed to load salary report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalary(filterPeriod);
  }, [filterPeriod]);

  const handleViewDetails = async (id) => {
    setSelectedPayrollId(id);
    setDetailLoading(true);
    try {
      const response = await getTeacherSalaryDetail(id);
      if (response.success) {
        setDetailData(response.record);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReceiptAction = async (id, url, format = "pdf", filename = "Salary_Receipt.pdf") => {
    if (downloadingId) return; // prevent multiple clicks
    setDownloadingId(`${id}-${format}`);
    try {
      await downloadTeacherSalaryReceipt(url, format, filename);
    } catch (err) {
      console.error("Failed to download receipt:", err);
      alert("Failed to get receipt. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const closeModal = () => {
    setSelectedPayrollId(null);
    setDetailData(null);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load salary report: {error}
      </div>
    );
  }

  const stats = data?.stats || {};
  const records = data?.records || [];

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <PageHeader
        title="My Salary"
        subtitle="Review your monthly salary reports, deductions, and payment history."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Records</label>
          <h3 className="text-xl font-extrabold text-zinc-800 mt-1">{stats.total_records || 0}</h3>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
          <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Paid Records</label>
          <h3 className="text-xl font-extrabold text-emerald-700 mt-1">{stats.paid_records || 0}</h3>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
          <label className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Pending Records</label>
          <h3 className="text-xl font-extrabold text-amber-700 mt-1">{stats.pending_records || 0}</h3>
        </div>
        <div className="bg-violet-600 p-4 rounded-xl border border-violet-700 shadow-sm text-center text-white">
          <label className="text-[9px] font-bold text-violet-200 uppercase tracking-wider block">Total Paid Amount</label>
          <h3 className="text-xl font-extrabold mt-1">₹{(stats.total_paid_amount || 0).toLocaleString()}</h3>
        </div>
      </div>

      {/* Salary Records List */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
            <FaFileInvoiceDollar className="text-violet-500 w-4 h-4" /> Salary History
          </h3>
          <div className="flex items-center gap-2">
             <input
                type="month"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-black"
             />
             {filterPeriod && (
               <button onClick={() => setFilterPeriod("")} className="text-xs text-zinc-500 hover:text-zinc-700 font-medium bg-zinc-100 px-2 py-1.5 rounded-md">Clear</button>
             )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-right">Net Salary</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Paid Date</th>
                <th className="px-6 py-4 text-center">Receipt</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-sm">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-800 whitespace-nowrap">
                    {r.month_label || "—"}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-violet-600 text-right whitespace-nowrap">
                    ₹{r.net_salary !== null ? r.net_salary.toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide border ${
                      r.status === "paid" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                      r.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-100" :
                      "text-zinc-600 bg-zinc-50 border-zinc-100"
                    }`}>
                      {r.status_label || r.status || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium whitespace-nowrap">
                    {r.paid_at_label || "—"}
                    {r.payment_method_label && <span className="block text-[10px] text-zinc-400 uppercase mt-0.5">{r.payment_method_label}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {r.receipt_available ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleReceiptAction(r.id, r.receipt_print_url, 'print')} disabled={downloadingId !== null} className="p-2 bg-zinc-100 text-zinc-600 hover:bg-violet-50 hover:text-violet-600 rounded-lg transition-colors tooltip-trigger disabled:opacity-50" title="Print Receipt">
                          {downloadingId === `${r.id}-print` ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaPrint className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleReceiptAction(r.id, r.receipt_pdf_url, 'pdf', `Salary_Receipt_${r.month_label.replace(' ', '_')}.pdf`)} disabled={downloadingId !== null} className="p-2 bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors tooltip-trigger disabled:opacity-50" title="Download PDF">
                          {downloadingId === `${r.id}-pdf` ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaDownload className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 px-2 py-1 rounded-md">Unavailable</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(r.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg transition-colors"
                    >
                      <FaEye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-zinc-400 font-bold uppercase tracking-wider">
                    No Salary Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedPayrollId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-800">Salary Details</h3>
              <button onClick={closeModal} className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-full transition-colors">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {detailLoading || !detailData ? (
                <div className="flex items-center justify-center h-40"><PageLoader /></div>
              ) : (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div>
                       <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Period</h4>
                       <p className="text-lg font-extrabold text-zinc-800">{detailData.month_label}</p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</h4>
                       <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wide border ${
                        detailData.status === "paid" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                        detailData.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-100" :
                        "text-zinc-600 bg-zinc-50 border-zinc-100"
                      }`}>
                        {detailData.status_label}
                      </span>
                    </div>
                  </div>

                  {/* Attendance & Days */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3 border-b border-zinc-100 pb-2">Attendance Summary</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                      <div className="bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Working</span>
                        <span className="text-sm font-extrabold text-zinc-700">{detailData.working_days}</span>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                        <span className="text-sm font-extrabold text-emerald-700">{detailData.present_days}</span>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                        <span className="block text-[10px] font-bold text-rose-600 uppercase">Absent</span>
                        <span className="text-sm font-extrabold text-rose-700">{detailData.absent_days}</span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <span className="block text-[10px] font-bold text-amber-600 uppercase">Late</span>
                        <span className="text-sm font-extrabold text-amber-700">{detailData.late_days}</span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                        <span className="block text-[10px] font-bold text-blue-600 uppercase">Leave</span>
                        <span className="text-sm font-extrabold text-blue-700">{detailData.leave_days}</span>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-2 border border-violet-100">
                        <span className="block text-[10px] font-bold text-violet-600 uppercase">Payable</span>
                        <span className="text-sm font-extrabold text-violet-700">{detailData.payable_days}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3 border-b border-zinc-100 pb-2">Earnings & Deductions</h4>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden text-sm">
                      <div className="flex justify-between p-3 border-b border-zinc-100">
                        <span className="font-medium text-zinc-600">Base Monthly Salary</span>
                        <span className="font-bold text-zinc-800">₹{detailData.monthly_salary?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 border-b border-zinc-100">
                        <span className="font-medium text-zinc-600">Calculated Gross Salary</span>
                        <span className="font-bold text-emerald-600">₹{detailData.gross_salary?.toLocaleString() || 0}</span>
                      </div>
                      
                      {/* Deductions List */}
                      {detailData.deductions && detailData.deductions.length > 0 ? (
                        <div className="p-3 border-b border-zinc-100 bg-rose-50/30">
                          <span className="font-bold text-rose-600 text-[10px] uppercase tracking-wider block mb-2">Deductions</span>
                          <div className="space-y-1">
                            {detailData.deductions.map((ded, i) => (
                              <div key={i} className="flex justify-between text-xs text-rose-600/80">
                                <span>- {ded.name} {ded.remark ? `(${ded.remark})` : ""}</span>
                                <span className="font-medium">₹{ded.amount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 border-b border-zinc-100">
                          <span className="font-medium text-zinc-500 text-xs italic">No deductions</span>
                        </div>
                      )}

                      <div className="flex justify-between p-4 bg-zinc-800 text-white">
                        <span className="font-bold uppercase tracking-wider text-xs">Net Salary</span>
                        <span className="font-extrabold text-base">₹{detailData.net_salary?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  {detailData.status === "paid" && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3 border-b border-zinc-100 pb-2">Payment Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase">Paid Date</span>
                          <span className="font-semibold text-zinc-800">{detailData.paid_at_label || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase">Method</span>
                          <span className="font-semibold text-zinc-800">{detailData.payment_method_label || "—"}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase">Receipt No</span>
                          <span className="font-semibold text-zinc-800">{detailData.receipt_no || "—"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-3">
               <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
                 Close
               </button>
               {detailData?.receipt_available && (
                 <button onClick={() => handleReceiptAction(detailData.id, detailData.receipt_pdf_url, 'pdf', `Salary_Receipt_${detailData.month_label.replace(' ', '_')}.pdf`)} disabled={downloadingId !== null} className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-75">
                   {downloadingId === `${detailData.id}-pdf` ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaDownload className="w-3.5 h-3.5" />}
                   Download Receipt
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
