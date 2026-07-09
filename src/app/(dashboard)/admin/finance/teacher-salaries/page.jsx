"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import {
  fetchTeacherSalaries,
  payTeacherSalary,
  fetchSalaryHistory
} from "@/features/finance/redux/financeThunk";
import TeacherSalariesTable from "@/features/finance/components/TeacherSalariesTable";
import SalaryHistoryTable from "@/features/finance/components/SalaryHistoryTable";
import SalaryPaymentForm from "@/features/finance/components/SalaryPaymentForm";
import Button from "@/components/ui/Button";
import { FaGraduationCap, FaPrint, FaCheckCircle, FaHistory, FaCalendarAlt } from "react-icons/fa";
import { APP_CONFIG } from "@/constants/appConfig";

export default function TeacherSalariesPage() {
  const dispatch = useDispatch();

  // Tab state: 'records' | 'history'
  const [activeTab, setActiveTab] = useState("records");

  // Filter Month (Default to current: June 2026)
  const [selectedMonth, setSelectedMonth] = useState("2026-06");

  // Overlay control states
  const [payingRecord, setPayingRecord] = useState(null);
  const [receiptRecord, setReceiptRecord] = useState(null);

  // Redux states
  const {
    salariesList,
    salaryHistory,
    loading
  } = useSelector((state) => state.finance);

  // Load teacher salaries list when month changes
  useEffect(() => {
    dispatch(fetchTeacherSalaries(selectedMonth));
  }, [selectedMonth, dispatch]);

  // Load salary history when switching tabs
  useEffect(() => {
    if (activeTab === "history") {
      dispatch(fetchSalaryHistory());
    }
  }, [activeTab, dispatch]);

  const handlePaySalary = (paymentData) => {
    if (!payingRecord) return;
    dispatch(
      payTeacherSalary({
        recordId: payingRecord.id,
        paymentData
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        // Refresh records list
        dispatch(fetchTeacherSalaries(selectedMonth));
        // Show salary receipt voucher
        setReceiptRecord(res.payload.data);
      }
      setPayingRecord(null);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Salaries"
        subtitle="Process monthly faculty payouts, view attendance counts, and maintain payment history"
      />

      <div className="space-y-6">
        {/* Tab Header Controls */}
        <div className="flex border-b border-zinc-200 bg-white p-2 rounded-xl border shadow-sm">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "records"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <FaCalendarAlt className="w-4 h-4" />
            <span>Salary Records</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "history"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <FaHistory className="w-4 h-4" />
            <span>Payment History</span>
          </button>
        </div>

        {/* Tab Workspaces */}
        {activeTab === "records" && (
          <div className="space-y-6">
            {/* Month selector panel */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-bold text-zinc-700 uppercase">Select Pay Period</h4>
                <p className="text-[10px] text-zinc-400 font-semibold">Salaries are generated dynamically per calendar month.</p>
              </div>
              <div className="w-full md:w-56">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
                  required
                />
              </div>
            </div>

            {loading && salariesList.length === 0 ? (
              <PageLoader />
            ) : (
              <TeacherSalariesTable
                records={salariesList}
                onPay={(rec) => setPayingRecord(rec)}
                onViewReceipt={(rec) => setReceiptRecord(rec)}
              />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <>
            {loading && salaryHistory.length === 0 ? (
              <PageLoader />
            ) : (
              <SalaryHistoryTable
                records={salaryHistory}
                onViewReceipt={(rec) => setReceiptRecord(rec)}
              />
            )}
          </>
        )}
      </div>

      {/* Salary payment modal overlay */}
      {payingRecord && (
        <SalaryPaymentForm
          record={payingRecord}
          onClose={() => setPayingRecord(null)}
          onSubmit={handlePaySalary}
          loading={loading}
        />
      )}

      {/* Salary receipt voucher modal overlay */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full my-auto mx-auto overflow-hidden print:border-none print:shadow-none print:max-w-full print:rounded-none">
            {/* Voucher body */}
            <div className="p-8 space-y-6 print:p-0" id="printable-receipt">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <FaGraduationCap className="text-violet-600 w-8 h-8 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-800 text-sm block">{APP_CONFIG.name}</span>
                    <span className="text-[9px] text-zinc-400 font-semibold block uppercase">Salary Payment Voucher</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase">Voucher No</span>
                  <span className="text-xs font-bold text-zinc-800">{receiptRecord.id}</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-800 print:hidden">
                <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-left text-xs font-semibold">
                  <h4 className="font-bold">Transaction Confirmed</h4>
                  <p className="text-[10px] font-medium mt-0.5">Faculty salary disbursement successfully processed.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-medium border-b border-zinc-100 pb-6">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Teacher Name</span>
                  <span className="text-zinc-800 font-bold">{receiptRecord.teacherName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Teacher ID</span>
                  <span className="text-zinc-800 font-semibold">{receiptRecord.teacherId}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Department</span>
                  <span className="text-zinc-800 font-semibold">{receiptRecord.department}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Pay Period</span>
                  <span className="text-zinc-800 font-bold">{receiptRecord.month}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Total Working Days</span>
                  <span className="text-zinc-800 font-semibold">{receiptRecord.totalWorkingDays || 22} Days</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Present Days</span>
                  <span className="text-zinc-800 font-semibold text-emerald-600">{receiptRecord.presentDays || 0} Days</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Absent Days</span>
                  <span className="text-zinc-800 font-semibold text-rose-500">{receiptRecord.absentDays || 0} Days</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Half Days</span>
                  <span className="text-zinc-800 font-semibold text-blue-600">{receiptRecord.halfDayDays || 0} Days</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Leave Days</span>
                  <span className="text-zinc-800 font-semibold text-amber-500">{receiptRecord.leaveDays || 0} Days</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Per Day Salary</span>
                  <span className="text-zinc-800 font-semibold">₹{(receiptRecord.perDaySalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Base Salary</span>
                  <span className="text-zinc-800 font-semibold">₹{(receiptRecord.monthlySalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Deductions</span>
                  <span className="text-rose-500 font-bold whitespace-nowrap">-₹{(receiptRecord.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Payment Date</span>
                  <span className="text-zinc-800 font-semibold">{receiptRecord.paymentDate}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-zinc-400">Payment Method</span>
                  <span className="text-zinc-800 font-semibold">{receiptRecord.paymentMethod}</span>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Final Payable Salary</span>
                <span className="text-lg font-extrabold text-zinc-800">₹{(receiptRecord.finalSalary || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Voucher Footer Controls */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-4 print:hidden">
              <button
                onClick={() => setReceiptRecord(null)}
                className="flex-1 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold transition-all"
              >
                Close Voucher
              </button>
              <Button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/10 transition-all flex items-center justify-center gap-2"
              >
                <FaPrint className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
