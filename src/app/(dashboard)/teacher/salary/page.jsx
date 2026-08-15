"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaMoneyBillWave, FaDownload, FaPrint, FaEye, FaTimes, FaFileInvoiceDollar, FaSpinner, FaCalendarAlt, FaCheckCircle, FaClock, FaRupeeSign } from "react-icons/fa";
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
    if (downloadingId) return;
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

      {/* Stats Cards - Improved with icons & better spacing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Records</p>
              <h3 className="text-2xl font-extrabold text-zinc-800 mt-1">{stats.total_records || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <FaFileInvoiceDollar className="w-5 h-5 text-violet-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Paid Records</p>
              <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.paid_records || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Records</p>
              <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{stats.pending_records || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <FaClock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-violet-700 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Total Paid Amount</p>
              <h3 className="text-2xl font-extrabold mt-1 flex items-center gap-0.5">
                <FaRupeeSign className="w-4 h-4" />
                {(stats.total_paid_amount || 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FaMoneyBillWave className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Salary Records List - Improved table styling */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <FaFileInvoiceDollar className="text-violet-600 w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Salary History</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Your monthly salary records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
              <input
                type="month"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-zinc-700 bg-white font-medium w-44"
              />
            </div>
            {filterPeriod && (
              <button
                onClick={() => setFilterPeriod("")}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Net Salary</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Paid Date</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">Receipt</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-violet-50/30 transition-colors duration-150 group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-zinc-800 text-sm">{r.month_label || "—"}</span>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-violet-600 text-right text-sm">
                    ₹{r.net_salary !== null ? r.net_salary.toLocaleString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide border ${r.status === "paid" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                      r.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-200" :
                        "text-zinc-600 bg-zinc-50 border-zinc-200"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === "paid" ? "bg-emerald-500" :
                        r.status === "pending" ? "bg-amber-500" :
                          "bg-zinc-400"
                        }`}></span>
                      {r.status_label || r.status || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-zinc-700 font-medium text-sm">{r.paid_at_label || "—"}</span>
                      {r.payment_method_label && (
                        <span className="block text-[10px] text-zinc-400 font-medium uppercase mt-0.5">{r.payment_method_label}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {r.receipt_available ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleReceiptAction(r.id, r.receipt_print_url, 'print')}
                          disabled={downloadingId !== null}
                          className="p-2 bg-zinc-100 text-zinc-600 hover:bg-violet-100 hover:text-violet-600 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105"
                          title="Print Receipt"
                        >
                          {downloadingId === `${r.id}-print` ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaPrint className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleReceiptAction(r.id, r.receipt_pdf_url, 'pdf', `Salary_Receipt_${r.month_label.replace(' ', '_')}.pdf`)}
                          disabled={downloadingId !== null}
                          className="p-2 bg-zinc-100 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-600 rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105"
                          title="Download PDF"
                        >
                          {downloadingId === `${r.id}-pdf` ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaDownload className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-100 px-3 py-1.5 rounded-full">Unavailable</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(r.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-sm group-hover:border-violet-300"
                    >
                      <FaEye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FaFileInvoiceDollar className="w-12 h-12 text-zinc-300" />
                      <span className="text-zinc-400 font-bold text-sm uppercase tracking-wider">No Salary Records Found</span>
                      <p className="text-xs text-zinc-300">Try changing the filter period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal - Improved design */}
      {selectedPayrollId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-gradient-to-r from-violet-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <FaFileInvoiceDollar className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-800">Salary Details</h3>
                  <p className="text-xs text-zinc-400 font-medium">{detailData?.month_label || "Loading..."}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-xl transition-all duration-200 hover:scale-105"
              >
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
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Period</p>
                      <p className="text-base font-extrabold text-zinc-800 mt-0.5">{detailData.month_label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wide border ${detailData.status === "paid" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                        detailData.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-200" :
                          "text-zinc-600 bg-zinc-50 border-zinc-200"
                        }`}>
                        {detailData.status_label}
                      </span>
                    </div>
                  </div>

                  {/* Attendance & Days */}
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                      Attendance Summary
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                      <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 hover:border-zinc-200 transition-colors">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Working</p>
                        <p className="text-lg font-extrabold text-zinc-700 mt-0.5">{detailData.working_days}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 hover:border-emerald-200 transition-colors">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Present</p>
                        <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{detailData.present_days}</p>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 hover:border-rose-200 transition-colors">
                        <p className="text-[10px] font-bold text-rose-500 uppercase">Absent</p>
                        <p className="text-lg font-extrabold text-rose-700 mt-0.5">{detailData.absent_days}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 hover:border-amber-200 transition-colors">
                        <p className="text-[10px] font-bold text-amber-500 uppercase">Late</p>
                        <p className="text-lg font-extrabold text-amber-700 mt-0.5">{detailData.late_days}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 hover:border-blue-200 transition-colors">
                        <p className="text-[10px] font-bold text-blue-500 uppercase">Leave</p>
                        <p className="text-lg font-extrabold text-blue-700 mt-0.5">{detailData.leave_days}</p>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 hover:border-violet-200 transition-colors">
                        <p className="text-[10px] font-bold text-violet-500 uppercase">Payable</p>
                        <p className="text-lg font-extrabold text-violet-700 mt-0.5">{detailData.payable_days}</p>
                      </div>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                      Earnings & Deductions
                    </h4>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden text-sm">
                      <div className="flex justify-between p-3.5 border-b border-zinc-100 hover:bg-white transition-colors">
                        <span className="font-medium text-zinc-600 text-sm">Base Monthly Salary</span>
                        <span className="font-bold text-zinc-800 text-sm">₹{detailData.monthly_salary?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between p-3.5 border-b border-zinc-100 hover:bg-white transition-colors">
                        <span className="font-medium text-zinc-600 text-sm">Calculated Gross Salary</span>
                        <span className="font-bold text-emerald-600 text-sm">₹{detailData.gross_salary?.toLocaleString() || 0}</span>
                      </div>

                      {/* Deductions List */}
                      {detailData.deductions && detailData.deductions.length > 0 ? (
                        <div className="p-3.5 border-b border-zinc-100 bg-rose-50/30 hover:bg-rose-50/50 transition-colors">
                          <p className="font-bold text-rose-600 text-[10px] uppercase tracking-wider mb-2">Deductions</p>
                          <div className="space-y-1.5">
                            {detailData.deductions.map((ded, i) => (
                              <div key={i} className="flex justify-between text-xs text-rose-600/90">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 bg-rose-400 rounded-full"></span>
                                  {ded.name} {ded.remark ? <span className="text-zinc-400 italic">({ded.remark})</span> : ""}
                                </span>
                                <span className="font-medium">₹{ded.amount?.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 border-b border-zinc-100">
                          <span className="font-medium text-zinc-400 text-xs">No deductions applied</span>
                        </div>
                      )}

                      <div className="flex justify-between p-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white">
                        <span className="font-bold uppercase tracking-wider text-xs">Net Salary</span>
                        <span className="font-extrabold text-lg">₹{detailData.net_salary?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {detailData.status === "paid" && (
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-violet-500 rounded-full"></span>
                        Payment Details
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Paid Date</p>
                          <p className="font-semibold text-zinc-700 mt-0.5">{detailData.paid_at_label || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Method</p>
                          <p className="font-semibold text-zinc-700 mt-0.5">{detailData.payment_method_label || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Receipt No</p>
                          <p className="font-semibold text-zinc-700 mt-0.5">{detailData.receipt_no || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-zinc-50/80 border-t border-zinc-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 hover:border-zinc-400 transition-all duration-200"
              >
                Close
              </button>
              {detailData?.receipt_available && (
                <button
                  onClick={() => handleReceiptAction(detailData.id, detailData.receipt_pdf_url, 'pdf', `Salary_Receipt_${detailData.month_label.replace(' ', '_')}.pdf`)}
                  disabled={downloadingId !== null}
                  className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-75"
                >
                  {downloadingId === `${detailData.id}-pdf` ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaDownload className="w-4 h-4" />}
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