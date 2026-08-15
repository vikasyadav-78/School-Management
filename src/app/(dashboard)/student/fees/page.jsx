"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaMoneyBillWave, FaReceipt, FaDownload, FaPrint } from "react-icons/fa";
import { fetchStudentFees } from "@/features/students/redux/studentThunk";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function StudentFeesPage() {
  const dispatch = useDispatch();
  const { fees, loading, error } = useSelector((state) => state.students);
  const [downloadingId, setDownloadingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  const downloadReceipt = async (url, receiptNo) => {
    try {
      setDownloadingId(receiptNo);
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${receiptNo || "receipt"}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error(err?.message || "Failed to download receipt.");
    } finally {
      setDownloadingId(null);
    }
  };

  const printReceipt = async (url, receiptNo) => {
    try {
      setPrintingId(receiptNo);
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, "_blank");
      if (newTab) {
        newTab.focus();
      } else {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error(err?.message || "Failed to print receipt.");
    } finally {
      setPrintingId(null);
    }
  };

  const [payingId, setPayingId] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (paymentId, feeName) => {
    try {
      setPayingId(paymentId);
      const paymentGateway = fees.payment_gateway || {};

      if (!paymentGateway.enabled) {
        toast.error("Online payment is currently unavailable.");
        setPayingId(null);
        return;
      }

      const gateway = paymentGateway.gateway?.toLowerCase();
      const pay_initiate_url = `/student/fees/${paymentId}/pay`;

      const initiateResponse = await api.post(pay_initiate_url);
      const checkout = initiateResponse.data.checkout || initiateResponse.data;
      const verify_url = checkout?.verify_url || initiateResponse.data?.verify_url || `/student/fees/${paymentId}/verify`;

      if (!checkout) {
        toast.error("Failed to initialize transaction order.");
        setPayingId(null);
        return;
      }

      switch (gateway) {
        case "razorpay": {
          const isLoaded = await loadRazorpayScript();
          if (!isLoaded) {
            toast.error("Failed to load payment gateway script. Please check your internet connection.");
            setPayingId(null);
            return;
          }

          const rzpKey = paymentGateway.key || paymentGateway.key_id || checkout.client?.key;
          const rzpOrderId = checkout.client?.order_id || checkout.order_id;
          const rzpAmount = checkout.amount;
          const rzpCurrency = checkout.currency || paymentGateway.currency || "INR";

          if (!rzpKey) {
            toast.error("Payment Failed: Authentication key was missing during initialization.");
            setPayingId(null);
            return;
          }

          const options = {
            key: rzpKey,
            amount: rzpAmount,
            currency: rzpCurrency,
            name: checkout.client?.name || "School Management System",
            description: `${feeName} Fee Payment`,
            order_id: rzpOrderId,
            handler: async (response) => {
              try {
                setPayingId(paymentId);
                const verifyPayload = {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                };

                await api.post(verify_url, verifyPayload);
                toast.success("Payment completed and verified successfully!");
                dispatch(fetchStudentFees());
              } catch (err) {
                console.error("Verification error:", err);
                toast.error(err?.message || "Payment verification failed.");
              } finally {
                setPayingId(null);
              }
            },
            prefill: {
              name: checkout.client?.student_name || "",
              email: checkout.client?.email || "",
              contact: checkout.client?.contact || ""
            },
            theme: {
              color: "#7c3aed"
            },
            modal: {
              ondismiss: () => {
                setPayingId(null);
                toast.warning("Payment cancelled by user.");
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", (response) => {
            toast.error(response.error.description || "Payment process failed.");
            setPayingId(null);
          });
          rzp.open();
          break;
        }

        case "stripe":
          toast.error("Stripe payments are not supported yet.");
          setPayingId(null);
          break;

        case "cashfree":
          toast.error("Cashfree integration is not implemented yet.");
          setPayingId(null);
          break;

        case "payu":
          toast.error("PayU integration is not implemented yet.");
          setPayingId(null);
          break;

        case "easebuzz": {
          const payment_url = checkout?.client?.payment_url || checkout?.payment_url;
          if (payment_url) {
            window.location.href = payment_url;
          } else {
            toast.error("Payment URL not received from server.");
            setPayingId(null);
          }
          break;
        }

        default:
          toast.error(`Payment gateway "${gateway || "unknown"}" is not implemented yet.`);
          setPayingId(null);
          break;
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error(err?.message || "Failed to initiate payment.");
      setPayingId(null);
    } finally {
      const paymentGateway = fees.payment_gateway || {};
      const gateway = paymentGateway.gateway?.toLowerCase();
      if (gateway !== "razorpay") {
        setPayingId(null);
      }
    }
  };

  useEffect(() => {
    dispatch(fetchStudentFees());
  }, [dispatch]);

  if (loading || !fees) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load fees details: {error}
      </div>
    );
  }

  // API returns summary, payments, receipts
  const summary = fees.summary || {};
  const payments = fees.payments || [];
  const receipts = fees.receipts || [];
  const paymentGateway = fees.payment_gateway || {};

  return (
    <div className="space-y-6 text-left w-full">
      <PageHeader
        title="My Fees Statement"
        description="Review fees cycle structures, outstanding term dues, and download print receipts."
      />

      {/* Warning Banner if Gateway is Disabled */}
      {paymentGateway?.enabled === false && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-2xl">
          Online payment is currently unavailable. Please contact the administration office.
        </div>
      )}

      {/* Overview Cards - Centered & Colored Format */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Assigned
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            ₹{(summary.total_assigned || 0).toLocaleString()}
          </h3>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total Paid
          </span>
          <h3 className="text-xl font-black text-emerald-700 mt-1">
            ₹{(summary.total_paid || 0).toLocaleString()}
          </h3>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Total Due
          </span>
          <h3 className="text-xl font-black text-rose-700 mt-1">
            ₹{(summary.total_due || 0).toLocaleString()}
          </h3>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Pending Fees
          </span>
          <h3 className="text-xl font-black text-amber-700 mt-1">
            {summary.pending_count || 0}
          </h3>
        </div>

        <div className="bg-red-50 border border-red-100 p-4.5 rounded-2xl text-center col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
            Overdue Fees
          </span>
          <h3 className="text-xl font-black text-red-700 mt-1">
            {summary.overdue_count || 0}
          </h3>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FaMoneyBillWave className="text-violet-600" /> Payment Vouchers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4 whitespace-nowrap min-w-[160px]">Fee Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Amount</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Paid</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Due</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Late Fee</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Total Payable</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Due Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Frequency</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Receipt</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[100px]">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {payments.map((v, idx) => {
                const statusStr = v.status_label || v.status || "Due";
                let badgeClass = "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20";

                if (statusStr.toLowerCase() === "paid") {
                  badgeClass = "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";
                } else if (statusStr.toLowerCase() === "due") {
                  badgeClass = "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
                } else if (statusStr.toLowerCase() === "overdue") {
                  badgeClass = "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20";
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-bold text-slate-900 whitespace-nowrap">
                      {v.fee_name || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      ₹{(v.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold whitespace-nowrap">
                      ₹{(v.paid_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-semibold whitespace-nowrap">
                      ₹{(v.due_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      ₹{(v.late_fee_amount || v.late_fee || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      ₹{(v.total_payable || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {v.due_date_label || v.due_date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 capitalize whitespace-nowrap">
                      {v.frequency || "One-Time"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {v.receipt_no || v.receipt_number || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${badgeClass}`}>
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      {v.can_pay_online && statusStr.toLowerCase() !== "paid" ? (
                        <button
                          disabled={payingId === v.id || paymentGateway?.enabled === false}
                          onClick={() => handlePayment(v.id, v.fee_name)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-all disabled:opacity-50"
                        >
                          {payingId === v.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Processing</span>
                            </>
                          ) : (
                            <span>Pay Now</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-slate-400 italic text-sm">
                    No Fee Vouchers Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <FaReceipt className="text-violet-600 w-4 h-4" />
          <h3 className="text-sm font-bold text-slate-900">Payment Receipts</h3>
        </div>

        {receipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4 whitespace-nowrap min-w-[160px]">Receipt Number</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Fee Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Transaction Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Amount</th>
                  <th className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap min-w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {receipts.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                      {r.receipt_no || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {r.fee_name || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {r.paid_at_label || r.date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 whitespace-nowrap">
                      ₹{(r.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.print_url && (
                          <button
                            disabled={printingId === r.receipt_no}
                            onClick={() => printReceipt(r.print_url, r.receipt_no)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors disabled:opacity-50"
                            title="Print Receipt"
                          >
                            {printingId === r.receipt_no ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FaPrint className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Print</span>
                          </button>
                        )}
                        {r.pdf_url && (
                          <button
                            disabled={downloadingId === r.receipt_no}
                            onClick={() => downloadReceipt(r.pdf_url, r.receipt_no)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingId === r.receipt_no ? (
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FaDownload className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>PDF</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 italic text-sm">
            No Receipts Available
          </div>
        )}
      </div>
    </div>
  );
}