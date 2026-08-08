"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaUserCheck, FaMoneyBillWave, FaDownload, FaCheck, FaCalculator, FaTimes, 
  FaFileInvoiceDollar, FaSearch, FaHistory, FaPlus, FaBriefcase, FaCalendarAlt, 
  FaExclamationCircle, FaUserCircle, FaInfoCircle, FaPrint
} from "react-icons/fa";
import { 
  getTeacherPayrollPending,
  getTeacherPayrollHistory,
  generateTeacherPayroll,
  getTeacherPayrollDetail,
  saveTeacherPayrollDeductions,
  markTeacherPayrollPaid,
  getTeacherPayrollReceipt
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

const getPreviousMonthString = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function TeacherPayrollPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [rawPayrollList, setRawPayrollList] = useState([]);

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState(getPreviousMonthString());
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "paid"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState(getPreviousMonthString());

  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [activePayroll, setActivePayroll] = useState(null);
  const [deductionsAmount, setDeductionsAmount] = useState("");
  const [deductionsReason, setDeductionsReason] = useState("");
  const [deductionsRemarks, setDeductionsRemarks] = useState("");

  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "online" | "cheque"
  const [paymentRefNumber, setPaymentRefNumber] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPayroll = async (customParams = {}) => {
    try {
      setListLoading(true);
      const params = {
        period: selectedMonth || undefined,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        ...customParams
      };

      if (activeTab === "pending") {
        const data = await getTeacherPayrollPending(params);
        setRawPayrollList(data.payrolls || data.data || (Array.isArray(data) ? data : []));
      } else {
        const data = await getTeacherPayrollHistory(params);
        setRawPayrollList(data.payrolls || data.history || data.data || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load payroll: " + (err.message || err));
      }
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [activeTab]);

  // Client-side filtering as secondary layer to ensure absolute search correctness
  const payrollList = useMemo(() => {
    return rawPayrollList.filter(p => {
      const name = (p.teacher_name || p.teacher?.full_name || p.staff_name || "").toLowerCase();
      const empId = (p.employee_id || p.teacher?.employee_id || p.id || "").toLowerCase();
      const dept = (p.department || p.teacher?.department || "academic").toLowerCase();
      const desig = (p.designation || p.teacher?.designation || "teacher").toLowerCase();
      const month = (p.period || p.month || "");
      const status = (p.status || "pending").toLowerCase();

      const matchesSearch = !searchQuery || 
        name.includes(searchQuery.toLowerCase()) ||
        empId.includes(searchQuery.toLowerCase()) ||
        dept.includes(searchQuery.toLowerCase()) ||
        desig.includes(searchQuery.toLowerCase());

      const matchesMonth = !selectedMonth || month.includes(selectedMonth);
      const matchesStatus = statusFilter === "all" || status === statusFilter.toLowerCase();

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [rawPayrollList, searchQuery, selectedMonth, statusFilter]);

  // Summary Metrics Computation
  const summaryMetrics = useMemo(() => {
    let pendingStaff = 0;
    let totalSalary = 0;
    let pendingAmount = 0;
    let paidAmount = 0;

    // We calculate based on the current list
    payrollList.forEach(p => {
      const net = parseFloat(p.net_salary || p.net_amount || p.salary || 0);
      totalSalary += net;
      if (p.status === "paid") {
        paidAmount += net;
      } else {
        pendingStaff++;
        pendingAmount += net;
      }
    });

    return { pendingStaff, totalSalary, pendingAmount, paidAmount };
  }, [payrollList]);

  const handleFilter = () => {
    fetchPayroll();
  };

  const handleReset = () => {
    const prevMonth = getPreviousMonthString();
    setSelectedMonth(prevMonth);
    setStatusFilter("all");
    setSearchQuery("");
    fetchPayroll({ period: prevMonth, search: undefined, status: undefined });
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!generatePeriod) {
      setFormError("Period (YYYY-MM) is required.");
      return;
    }

    try {
      setSubmitting(true);
      await generateTeacherPayroll({ period: generatePeriod });
      toast.success(`Payroll generated for period ${generatePeriod}!`);
      setIsGenerateModalOpen(false);
      fetchPayroll();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to generate payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeductions = async (p) => {
    try {
      const detailed = await getTeacherPayrollDetail(p.id);
      const prObj = detailed.payroll || detailed.data || detailed || p;
      setActivePayroll(prObj);
      setDeductionsAmount(prObj.deductions || "");
      setDeductionsReason(prObj.deduction_reason || "");
      setDeductionsRemarks(prObj.remarks || "");
      setFormError("");
      setIsDeductionModalOpen(true);
    } catch (err) {
      toast.error("Failed to load payroll details: " + (err.message || err));
    }
  };

  const handleSaveDeductionsSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      setSubmitting(true);
      await saveTeacherPayrollDeductions(activePayroll.id, {
        deductions: parseFloat(deductionsAmount) || 0,
        reason: deductionsReason.trim(),
        remarks: deductionsRemarks.trim()
      });
      toast.success("Payroll deductions saved!");
      setIsDeductionModalOpen(false);
      fetchPayroll();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save deductions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMarkPaid = (p) => {
    setActivePayroll(p);
    setPaymentMethod("cash");
    setPaymentRefNumber("");
    setPaymentRemarks("");
    setFormError("");
    setIsMarkPaidModalOpen(true);
  };

  const handleMarkPaidSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    // Call Custom Confirmation Dialog instead of window.confirm
    const confirmPay = await dialog.confirm({
      title: "Confirm Salary Disbursal",
      message: `Disbursing net salary of ₹${activePayroll?.net_salary || activePayroll?.net_amount || activePayroll?.salary || 0} to ${activePayroll?.teacher_name || activePayroll?.staff_name || "Staff"}. Do you want to proceed?`,
      type: "success",
      confirmText: "Disburse Salary",
      cancelText: "Cancel"
    });

    if (!confirmPay) return;

    try {
      setSubmitting(true);
      await markTeacherPayrollPaid(activePayroll.id, {
        payment_method: paymentMethod,
        reference_number: paymentRefNumber.trim(),
        remarks: paymentRemarks.trim()
      });
      toast.success("Payroll marked as paid successfully!");
      setIsMarkPaidModalOpen(false);
      fetchPayroll();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to mark paid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (p) => {
    try {
      const data = await getTeacherPayrollReceipt(p.id);
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.success("Downloading receipt PDF...");
      }
    } catch (err) {
      toast.error("Failed to get receipt: " + (err.message || err));
    }
  };

  const handleViewDetails = async (p) => {
    try {
      const detailed = await getTeacherPayrollDetail(p.id);
      setActivePayroll(detailed.payroll || detailed.data || detailed || p);
      setIsViewDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load details: " + (err.message || err));
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Payroll feature is not enabled for your account. Contact school admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Payroll Management"
          subtitle="Generate salary, manage payroll, deductions and payment history."
        />
        <button
          onClick={() => { setGeneratePeriod("2026-07"); setFormError(""); setIsGenerateModalOpen(true); }}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" /> Generate Monthly Payroll
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "pending" 
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" 
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Pending Payroll
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "history" 
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl" 
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Pending Staff</p>
            <h3 className="text-xl font-black text-zinc-800">{summaryMetrics.pendingStaff}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            👤
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Salary</p>
            <h3 className="text-xl font-black text-emerald-600">₹{summaryMetrics.totalSalary.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Pending Amount</p>
            <h3 className="text-xl font-black text-amber-600 font-black">₹{summaryMetrics.pendingAmount.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Paid Amount</p>
            <h3 className="text-xl font-black text-emerald-600">₹{summaryMetrics.paidAmount.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>
      </div>

      {/* Filter Section Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payroll Month</label>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Search Staff (Employee ID, Name, Dept, Desig)</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs"
              />
              <FaSearch className="absolute left-3.5 top-3.5 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button 
            type="button" 
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Reset
          </button>
          <button 
            type="button" 
            onClick={handleFilter}
            className="px-4.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Listing Content */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : payrollList.length === 0 ? (
        <EmptyState title="No Payroll Slips Found" desc="Generate payroll or adjust filters to search." />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="px-6 py-4 min-w-[200px]">Employee</th>
                    <th className="px-6 py-4 min-w-[100px]">Month</th>
                    <th className="px-6 py-4 min-w-[120px]">Gross Salary</th>
                    <th className="px-6 py-4 min-w-[120px]">Deductions</th>
                    <th className="px-6 py-4 min-w-[120px]">Net Salary</th>
                    <th className="px-6 py-4 text-center min-w-[150px]">Attendance</th>
                    <th className="px-6 py-4 text-center min-w-[100px]">Status</th>
                    <th className="px-6 py-4 text-center min-w-[240px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {payrollList.map((p) => {
                    const gross = parseFloat(p.gross_salary || p.net_salary || 0);
                    const ded = parseFloat(p.deductions || 0);
                    const net = parseFloat(p.net_salary || 0);
                    const isPaid = (p.status || "pending").toLowerCase() === "paid";
                    
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                              {p.teacher_name ? p.teacher_name.charAt(0) : "S"}
                            </div>
                            <div>
                              <p className="font-extrabold text-zinc-800">{p.teacher_name || p.teacher?.full_name || p.staff_name || "Staff Member"}</p>
                              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">ID: {p.employee_id || p.teacher?.employee_id || "EMP-" + p.id.slice(0, 5).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-600 whitespace-nowrap">
                          {p.period || p.month || "2026-07"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-700 whitespace-nowrap">
                          ₹{gross.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-semibold text-rose-600 whitespace-nowrap">
                          ₹{ded.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-black text-zinc-900 whitespace-nowrap">
                          ₹{net.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-zinc-500 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 text-[10px] flex-nowrap whitespace-nowrap">
                            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">P:22</span>
                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 whitespace-nowrap">A:1</span>
                            <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 whitespace-nowrap">L:2</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider whitespace-nowrap ${
                            isPaid ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                          }`}>
                            {p.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(p)}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[9px] rounded-lg cursor-pointer transition-all"
                            >
                              View
                            </button>
                            {!isPaid ? (
                              <>
                                <button
                                  onClick={() => handleOpenDeductions(p)}
                                  className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold text-[9px] rounded-lg cursor-pointer transition-all border border-violet-100 whitespace-nowrap"
                                >
                                  Add Deduction
                                </button>
                                <button
                                  onClick={() => handleOpenMarkPaid(p)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[9px] rounded-lg cursor-pointer transition-all shadow-sm whitespace-nowrap"
                                >
                                  Pay Salary
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDownloadReceipt(p)}
                                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[9px] rounded-lg cursor-pointer flex items-center gap-1 transition-all whitespace-nowrap"
                              >
                                <FaDownload className="w-2.5 h-2.5" /> Receipt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards List View */}
          <div className="md:hidden space-y-4">
            {payrollList.map((p) => {
              const gross = parseFloat(p.gross_salary || p.net_salary || 0);
              const ded = parseFloat(p.deductions || 0);
              const net = parseFloat(p.net_salary || 0);
              const isPaid = (p.status || "pending").toLowerCase() === "paid";
              
              return (
                <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        {p.teacher_name ? p.teacher_name.charAt(0) : "S"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-zinc-800">{p.teacher_name || p.teacher?.full_name || p.staff_name}</h4>
                        <p className="text-[9px] text-zinc-400 font-extrabold">ID: {p.employee_id || p.teacher?.employee_id || "EMP-" + p.id.slice(0, 5).toUpperCase()}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                      isPaid ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                    }`}>
                      {p.status || "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center">
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Gross</p>
                      <p className="text-[10px] font-extrabold text-zinc-700">₹{gross.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Deductions</p>
                      <p className="text-[10px] font-extrabold text-rose-600">₹{ded.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Net Paid</p>
                      <p className="text-[10px] font-black text-zinc-900">₹{net.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span className="font-bold">Month: {p.period || p.month}</span>
                    <span className="font-bold text-zinc-400">Attendance: P:22 A:1 L:2</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => handleViewDetails(p)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all text-center"
                    >
                      View
                    </button>
                    {!isPaid ? (
                      <>
                        <button
                          onClick={() => handleOpenDeductions(p)}
                          className="flex-1 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-xl text-xs transition-all text-center border border-violet-100"
                        >
                          Deduction
                        </button>
                        <button
                          onClick={() => handleOpenMarkPaid(p)}
                          className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs transition-all text-center shadow-sm"
                        >
                          Pay
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDownloadReceipt(p)}
                        className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <FaDownload className="w-3 h-3" /> Receipt PDF
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Generate Payroll Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-extrabold text-zinc-800 text-sm">Generate Monthly Payroll</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><FaTimes className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4">
              {formError && <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] rounded-xl font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payroll Period (YYYY-MM)</label>
                <input 
                  type="month" 
                  value={generatePeriod} 
                  onChange={(e) => setGeneratePeriod(e.target.value)} 
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm">{submitting ? "Generating..." : "Generate Payroll"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deduction Modal */}
      {isDeductionModalOpen && activePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-extrabold text-zinc-800 text-sm">Save Payroll Deductions</h3>
              <button onClick={() => setIsDeductionModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><FaTimes className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveDeductionsSubmit} className="p-6 space-y-4">
              {formError && <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] rounded-xl font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Deduction Amount (₹)</label>
                <input 
                  type="number" 
                  value={deductionsAmount} 
                  onChange={(e) => setDeductionsAmount(e.target.value)} 
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Deduction Reason</label>
                <input 
                  type="text" 
                  value={deductionsReason} 
                  onChange={(e) => setDeductionsReason(e.target.value)} 
                  placeholder="e.g. Unpaid leave deduction"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Remarks</label>
                <textarea
                  rows={2}
                  value={deductionsRemarks}
                  onChange={(e) => setDeductionsRemarks(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs resize-none focus:border-violet-500"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsDeductionModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm">{submitting ? "Saving..." : "Save Deductions"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Confirmation Modal */}
      {isMarkPaidModalOpen && activePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-extrabold text-zinc-800 text-sm">Disburse Salary Payment</h3>
              <button onClick={() => setIsMarkPaidModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><FaTimes className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleMarkPaidSubmit} className="p-6 space-y-4">
              {formError && <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] rounded-xl font-bold">{formError}</div>}
              
              {/* Info Breakdowns */}
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 text-[11px] space-y-1.5">
                <div className="flex justify-between font-bold text-zinc-700">
                  <span>Employee:</span>
                  <span>{activePayroll.teacher_name || activePayroll.staff_name}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-700">
                  <span>Month / Period:</span>
                  <span>{activePayroll.period || activePayroll.month}</span>
                </div>
                <div className="h-px bg-zinc-200 my-1"></div>
                <div className="flex justify-between font-semibold text-zinc-500">
                  <span>Gross Salary:</span>
                  <span>₹{parseFloat(activePayroll.gross_salary || activePayroll.net_salary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-rose-600">
                  <span>Deductions:</span>
                  <span>- ₹{parseFloat(activePayroll.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-zinc-900 text-xs">
                  <span>Net Salary Payable:</span>
                  <span>₹{parseFloat(activePayroll.net_salary || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online / Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Reference Number (if applicable)</label>
                <input 
                  type="text" 
                  value={paymentRefNumber} 
                  onChange={(e) => setPaymentRefNumber(e.target.value)} 
                  placeholder="e.g. UTR / Txn ID / Cheque No"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Remarks</label>
                <input 
                  type="text" 
                  value={paymentRemarks} 
                  onChange={(e) => setPaymentRemarks(e.target.value)} 
                  placeholder="e.g. Month salary paid"
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsMarkPaidModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm">{submitting ? "Processing..." : "Pay Salary"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewDetailModalOpen && activePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-extrabold text-zinc-800 text-sm">Payroll Slip Inspector</h3>
              <button onClick={() => setIsViewDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><FaTimes className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0 select-none">
                  {activePayroll.teacher_name ? activePayroll.teacher_name.charAt(0) : "S"}
                </div>
                <div>
                  <h4 className="font-black text-zinc-800">{activePayroll.teacher_name || activePayroll.staff_name || "Staff Member"}</h4>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">ID: {activePayroll.employee_id || activePayroll.teacher?.employee_id || activePayroll.id}</p>
                </div>
              </div>

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/40">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Period / Month</span>
                  <span className="font-bold text-zinc-700">{activePayroll.period || activePayroll.month}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Gross Salary</span>
                  <span className="font-bold text-zinc-700">₹{parseFloat(activePayroll.gross_salary || activePayroll.net_salary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Deductions</span>
                  <span className="font-bold text-rose-600">₹{parseFloat(activePayroll.deductions || 0).toLocaleString()}</span>
                </div>
                {activePayroll.deduction_reason && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Deduction Reason</span>
                    <span className="font-bold text-zinc-600 max-w-[180px] text-right truncate" title={activePayroll.deduction_reason}>{activePayroll.deduction_reason}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5">
                  <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Net Salary</span>
                  <span className="font-black text-zinc-900">₹{parseFloat(activePayroll.net_salary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    activePayroll.status === "paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {activePayroll.status || "Pending"}
                  </span>
                </div>
                {activePayroll.payment_method && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Payment Method</span>
                    <span className="font-bold text-zinc-700 uppercase">{activePayroll.payment_method}</span>
                  </div>
                )}
                {activePayroll.payment_date && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="font-extrabold text-zinc-400 uppercase text-[9px]">Disbursed On</span>
                    <span className="font-bold text-zinc-700">{activePayroll.payment_date}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                {activePayroll.status === "paid" && (
                  <button 
                    onClick={() => handleDownloadReceipt(activePayroll)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <FaPrint className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsViewDetailModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
