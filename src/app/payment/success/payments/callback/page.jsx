"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle, FaReceipt, FaArrowLeft, FaHome } from "react-icons/fa";
import { api } from "@/services/api";
import { toast } from "sonner";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    receiptNo: "",
    amount: "0.00",
    paymentMethod: "Online Payment",
    paymentDate: "",
    feeName: "Tuition Fee"
  });

  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    // Run only on client side to prevent hydration mismatches
    const mockCheckout = {
      amount: searchParams.get("amount"),
      amount_rupees: searchParams.get("amount_rupees"),
      client: {
        amount: searchParams.get("client_amount") || searchParams.get("amount")
      }
    };
    console.log("Checkout Response:", mockCheckout);
    console.log("Amount:", mockCheckout.amount);
    console.log("Amount Rupees:", mockCheckout.amount_rupees);
    console.log("Client Amount:", mockCheckout.client?.amount);

    const amtParam = searchParams.get("amount_rupees") || searchParams.get("client_amount") || searchParams.get("amount");
    let resolvedAmount = "Amount Not Available";

    if (amtParam) {
      const amtNum = parseFloat(amtParam);
      if (!isNaN(amtNum)) {
        if (searchParams.get("amount_rupees")) {
          resolvedAmount = amtNum.toFixed(2);
        } else {
          // If value is > 5000 and has no decimals, convert paise to rupees
          if (amtNum > 5000 && String(amtParam).indexOf(".") === -1) {
            resolvedAmount = (amtNum / 100).toFixed(2);
          } else {
            resolvedAmount = amtNum.toFixed(2);
          }
        }
      }
    }

    setPaymentDetails({
      transactionId: searchParams.get("transaction_id") || searchParams.get("txnid") || searchParams.get("razorpay_payment_id") || "TXN-" + Math.floor(Math.random() * 100000000),
      receiptNo: searchParams.get("receipt_no") || searchParams.get("receipt") || "REC-" + Math.floor(Math.random() * 1000000),
      amount: resolvedAmount,
      paymentMethod: searchParams.get("payment_method") || "Online Payment",
      paymentDate: searchParams.get("date") || new Date().toLocaleDateString(),
      feeName: searchParams.get("fee_name") || "Tuition Fee"
    });
  }, [searchParams]);

  useEffect(() => {
    // If backend provides a payment_id, we can verify the status
    if (paymentId) {
      setLoading(true);
      const verifyPayment = async () => {
        try {
          const verifyPayload = {
            razorpay_payment_id: searchParams.get("razorpay_payment_id"),
            razorpay_order_id: searchParams.get("razorpay_order_id"),
            razorpay_signature: searchParams.get("razorpay_signature"),
            easebuzz_payment_id: searchParams.get("easebuzz_payment_id")
          };

          const verifyFields = [
            "status", "txnid", "easepayid", "amount", "hash",
            "email", "firstname", "productinfo",
            "udf1", "udf2", "udf3", "udf4", "udf5",
            "udf6", "udf7", "udf8", "udf9", "udf10"
          ];

          verifyFields.forEach((field) => {
            const val = searchParams.get(field);
            if (val !== null) {
              verifyPayload[field] = val;
            }
          });
          
          const response = await api.post(`/student/fees/${paymentId}/verify`, verifyPayload);
          const details = response.data.payment || response.data.data || {};
          console.log("Verify response details:", details);

          let resolvedVerifyAmount = paymentDetails.amount;
          const verifyAmt = details.amount_rupees || details.amount || details.total_payable;
          if (verifyAmt) {
            const parsedVerifyAmt = parseFloat(verifyAmt);
            if (!isNaN(parsedVerifyAmt)) {
              if (details.amount_rupees) {
                resolvedVerifyAmount = parsedVerifyAmt.toFixed(2);
              } else if (parsedVerifyAmt > 5000 && String(verifyAmt).indexOf(".") === -1) {
                resolvedVerifyAmount = (parsedVerifyAmt / 100).toFixed(2);
              } else {
                resolvedVerifyAmount = parsedVerifyAmt.toFixed(2);
              }
            }
          }
          
          setPaymentDetails((prev) => ({
            transactionId: details.transaction_id || details.payment_id || prev.transactionId,
            receiptNo: details.receipt_no || details.receipt_number || prev.receiptNo,
            amount: resolvedVerifyAmount,
            paymentMethod: details.payment_method || details.gateway || prev.paymentMethod,
            paymentDate: details.payment_date || details.created_at || prev.paymentDate,
            feeName: details.fee_name || prev.feeName
          }));
          toast.success("Payment verified successfully!");
        } catch (err) {
          console.error("Verification error:", err);
          toast.error("Failed to verify transaction status with server.");
        } finally {
          setLoading(false);
        }
      };
      verifyPayment();
    }
  }, [paymentId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-violet-650 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-widest animate-pulse">
          Verifying your payment...
        </h2>
        <p className="text-zinc-455 text-[10px] mt-1">Please do not refresh or close this tab.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-xs text-zinc-700">
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl w-full max-w-md overflow-hidden text-center p-8 space-y-6 animate-scale-up">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping scale-75 opacity-75" />
            <FaCheckCircle className="w-16 h-16 text-emerald-500 relative z-10 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-black text-zinc-850 uppercase tracking-wide">
            Payment Successful
          </h2>
          <p className="text-zinc-450 font-semibold text-[10px]">
            Your fee payment has been completed successfully.
          </p>
        </div>

        {/* Details Grid */}
        <div className="bg-zinc-50 rounded-2xl border border-zinc-150 p-5 space-y-3.5 text-left">
          <div className="flex justify-between items-center py-0.5 border-b border-zinc-150/40">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Fee Name</span>
            <span className="font-extrabold text-zinc-800">{paymentDetails.feeName}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-zinc-150/40">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Amount Paid</span>
            <span className="font-black text-emerald-600 text-sm">
              {paymentDetails.amount === "Amount Not Available" ? "Amount Not Available" : `₹${Number(paymentDetails.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-zinc-150/40">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Transaction ID</span>
            <span className="font-semibold text-zinc-650 font-mono text-[10px] break-all">{paymentDetails.transactionId}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-zinc-150/40">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Receipt Number</span>
            <span className="font-bold text-zinc-800">{paymentDetails.receiptNo}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-zinc-150/40">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Payment Method</span>
            <span className="font-bold text-zinc-800 capitalize">{paymentDetails.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Payment Date</span>
            <span className="font-semibold text-zinc-650">{paymentDetails.paymentDate}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/student/fees"
            className="w-full py-3 bg-violet-650 hover:bg-violet-750 text-white font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 tracking-wide uppercase text-[10px]"
          >
            <FaReceipt className="w-3.5 h-3.5" /> View Receipt
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/student/fees"
              className="py-3 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5 uppercase text-[9px] tracking-wider"
            >
              <FaArrowLeft className="w-3 h-3" /> Back to Fees
            </Link>
            <Link
              href="/student/dashboard"
              className="py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-855 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-1.5 uppercase text-[9px] tracking-wider"
            >
              <FaHome className="w-3 h-3" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
