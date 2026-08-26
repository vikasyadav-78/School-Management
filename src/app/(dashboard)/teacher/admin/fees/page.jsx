"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaPlus, FaTimes, FaMoneyBillWave, FaTrash, FaCheck, FaBell, FaClock, FaHistory, FaUserCheck, FaLayerGroup,
  FaEye, FaPrint, FaFilePdf, FaFileInvoiceDollar
} from "react-icons/fa";
import { 
  getTeacherFeesMeta,
  getTeacherFees,
  getTeacherFeeStructures,
  addTeacherFeeStructure,
  deleteTeacherFeeStructure,
  assignTeacherFee,
  bulkAssignTeacherFee,
  recordTeacherFeePayment,
  deleteTeacherFeePayment,
  remindTeacherFee,
  getTeacherLateFeeRules,
  saveTeacherLateFeeRule,
  clearTeacherLateFeeRule,
  deleteTeacherLateFeeRuleHistory,
  getTeacherStudents,
  getTeacherFeePaymentDetail,
  getTeacherFeePaymentReceipt,
  getTeacherFeeTransactionReceipt
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAppDialog } from "@/context/DialogContext";
import Pagination from "@/components/ui/Pagination";

export default function TeacherFeesPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("payments"); // "payments" | "structures" | "assign" | "late-rules"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [meta, setMeta] = useState(null);
  const [studentsList, setStudentsList] = useState([]);

  // --- Payments Tab State ---
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Record Manual Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");

  // Pagination states
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [structuresPage, setStructuresPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 10;

  // View Payment Receipts Modal
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- Structures Tab State ---
  const [structures, setStructures] = useState([]);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureName, setStructureName] = useState("");
  const [structureAmount, setStructureAmount] = useState("");
  const [structureFrequency, setStructureFrequency] = useState("monthly");
  const [structureClassId, setStructureClassId] = useState("");
  const [structureDueDate, setStructureDueDate] = useState("");

  // --- Assign Tab State ---
  const [assignMode, setAssignMode] = useState("single"); // "single" | "bulk"
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // --- Late Fee Rules Tab State ---
  const [lateRulesData, setLateRulesData] = useState(null);
  const [targetFeeStructureId, setTargetFeeStructureId] = useState("");
  const [daysAfterDue, setDaysAfterDue] = useState("5");
  const [lateFeePerDay, setLateFeePerDay] = useState("50");
  const [applyToAll, setApplyToAll] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Initial Meta Load
  const loadMeta = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherFeesMeta();
      setMeta(metaData.meta || metaData.data || metaData);
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load fees panel: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  // Fetch Payments List
  const fetchPayments = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (classFilter !== "all") params.class_id = classFilter;
      if (sectionFilter !== "all") params.section_id = sectionFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getTeacherFees(params);
      setPayments(data.payments || data.data || (Array.isArray(data) ? data : []));
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    setPaymentsPage(1);
    if (!loading && !forbidden && activeTab === "payments") {
      const handler = setTimeout(() => {
        fetchPayments();
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [loading, forbidden, activeTab, statusFilter, classFilter, sectionFilter, searchQuery]);

  // Fetch Structures List
  const fetchStructures = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherFeeStructures();
      setStructures(data.fee_structures || data.structures || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    setStructuresPage(1);
    setHistoryPage(1);
    if (!loading && !forbidden && activeTab === "structures") {
      fetchStructures();
    }
  }, [loading, forbidden, activeTab]);

  // Fetch Students for Single Fee Assignment
  const fetchStudents = async () => {
    try {
      const data = await getTeacherStudents();
      setStudentsList(data.students || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden && activeTab === "assign") {
      fetchStudents();
    }
  }, [loading, forbidden, activeTab]);

  // Fetch Late Fee Rules
  const fetchLateFeeRules = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (targetFeeStructureId) params.fee_structure_id = targetFeeStructureId;
      const data = await getTeacherLateFeeRules(params);
      setLateRulesData(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden && activeTab === "late-rules") {
      fetchLateFeeRules();
    }
  }, [loading, forbidden, activeTab, targetFeeStructureId]);

  // Handlers for Payments
  const handleOpenReceiptDetails = async (payment) => {
    try {
      const detailed = await getTeacherFeePaymentDetail(payment.id);
      setSelectedPaymentDetails(detailed.payment || detailed.data || detailed || payment);
      setIsDetailsModalOpen(true);
    } catch (err) {
      toast.error("Failed to load payment details: " + (err.message || err));
    }
  };

  const handlePrintReceiptDirect = async (url) => {
    try {
      const response = await api.get(url);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
      }
    } catch (err) {
      toast.error("Failed to load receipt: " + (err.message || err));
    }
  };
  const handleOpenRecordPayment = (payment) => {
    setActivePayment(payment);
    setPaidAmount(payment.due_amount || payment.amount || "");
    setPaymentMode("cash");
    setTransactionRef("");
    setFormError("");
    setIsRecordModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      setFormError("Valid Payment Amount is required.");
      return;
    }

    try {
      setSubmitting(true);
      await recordTeacherFeePayment(activePayment.id, {
        paid_amount: parseFloat(paidAmount),
        payment_mode: paymentMode,
        transaction_reference: transactionRef.trim()
      });
      toast.success("Fee payment recorded successfully!");
      setIsRecordModalOpen(false);
      fetchPayments();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Fee Entry",
      message: "Are you sure you want to delete this fee entry?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherFeePayment(paymentId);
      toast.success("Unpaid fee entry deleted!");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to delete fee entry: " + (err.message || err));
    }
  };

  const handleSendReminders = async () => {
    try {
      await remindTeacherFee();
      toast.success("Due fee reminders dispatched successfully!");
    } catch (err) {
      toast.error("Failed to send reminders: " + (err.message || err));
    }
  };

  // Handlers for Fee Structures
  const handleCreateStructureSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!structureName.trim() || !structureAmount || parseFloat(structureAmount) <= 0) {
      setFormError("Structure Name and valid Amount are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: structureName.trim(),
        amount: parseFloat(structureAmount),
        frequency: structureFrequency || "monthly"
      };
      if (structureClassId) payload.school_class_id = structureClassId;
      if (structureDueDate) payload.due_date = structureDueDate;

      await addTeacherFeeStructure(payload);
      toast.success("Fee structure created!");
      setIsStructureModalOpen(false);
      setStructureName("");
      setStructureAmount("");
      setStructureFrequency("monthly");
      setStructureClassId("");
      setStructureDueDate("");
      fetchStructures();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create structure.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStructure = async (structureId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Fee Structure",
      message: "Are you sure you want to delete this fee structure?",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherFeeStructure(structureId);
      toast.success("Structure deleted!");
      fetchStructures();
    } catch (err) {
      toast.error("Failed to delete structure: " + (err.message || err));
    }
  };

  // Handlers for Assigning Fees
  const handleAssignFeeSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!selectedStructureId || !dueDate) {
      setFormError("Fee Structure and Due Date are required.");
      return;
    }

    try {
      setSubmitting(true);
      if (assignMode === "single") {
        if (!selectedStudentId) {
          setFormError("Student selection is required.");
          setSubmitting(false);
          return;
        }
        await assignTeacherFee({
          student_id: selectedStudentId,
          fee_structure_id: selectedStructureId,
          due_date: dueDate
        });
        toast.success("Fee assigned to student successfully!");
      } else {
        if (!selectedClassId) {
          setFormError("Class selection is required for bulk assign.");
          setSubmitting(false);
          return;
        }
        await bulkAssignTeacherFee({
          school_class_id: selectedClassId,
          section_id: selectedSectionId || null,
          fee_structure_id: selectedStructureId,
          due_date: dueDate
        });
        toast.success("Fee assigned in bulk successfully!");
      }

      // Reset
      setSelectedStudentId("");
      setDueDate("");
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to assign fee.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Late Fee Rules
  const handleSaveLateFeeRuleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      setSubmitting(true);
      await saveTeacherLateFeeRule({
        fee_structure_id: targetFeeStructureId || null,
        days_after_due: parseInt(daysAfterDue) || 0,
        late_fee_per_day: parseFloat(lateFeePerDay) || 0,
        apply_to_all: applyToAll
      });
      toast.success("Late fee rule saved!");
      fetchLateFeeRules();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save late fee rule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearLateFeeRule = async () => {
    if (!targetFeeStructureId) {
      toast.error("Please select a specific fee structure to clear rule.");
      return;
    }
    try {
      await clearTeacherLateFeeRule({ fee_structure_id: targetFeeStructureId });
      toast.success("Late fee rule cleared for structure!");
      fetchLateFeeRules();
    } catch (err) {
      toast.error("Failed to clear rule: " + (err.message || err));
    }
  };

  const handleDeleteLateRuleHistory = async (ruleId) => {
    try {
      await deleteTeacherLateFeeRuleHistory(ruleId);
      toast.success("Rule history entry deleted!");
      fetchLateFeeRules();
    } catch (err) {
      toast.error("Failed to delete history entry: " + (err.message || err));
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
          Fees feature is not enabled for your account. Contact school admin.
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Fee Management Center"
          subtitle="Record payments, assign fee structures, send due reminders, and configure late rules."
        />
        <button
          onClick={handleSendReminders}
          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaBell className="w-3.5 h-3.5" />
          Send Due Reminders
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "payments" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Payments List
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "structures" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Fee Structures
        </button>
        <button
          onClick={() => setActiveTab("assign")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "assign" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Assign Fees
        </button>
        <button
          onClick={() => setActiveTab("late-rules")}
          className={`px-6 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "late-rules" ? "border-violet-600 text-violet-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Late Fee Rules
        </button>
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Collected</span>
                <span className="text-lg font-black text-emerald-800">₹{stats.total_collected || 0}</span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Total Pending Dues</span>
                <span className="text-lg font-black text-amber-800">₹{stats.total_due || 0}</span>
              </div>
              <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">Total Transactions</span>
                <span className="text-lg font-black text-violet-800">{stats.total_count || payments.length}</span>
              </div>
            </div>
          )}

          {/* Filters Toolbar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by student name, roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white text-black"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
              >
                <option value="all">All Classes</option>
                {meta?.classes?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payments Table */}
          {listLoading ? (
            <div className="flex items-center justify-center py-20"><PageLoader /></div>
          ) : payments.length === 0 ? (
            <EmptyState title="No Fee Payments Found" desc="Try adjusting your filters or typing a search query." />
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-500 uppercase">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Fee Structure</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 text-zinc-700">
                      {payments.slice((paymentsPage - 1) * pageSize, paymentsPage * pageSize).map(p => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800">
                            {p.student_name || p.student?.full_name || "Student"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-zinc-600">
                            {p.fee_structure_name || p.structure?.name || "Standard Fee"}
                          </td>
                          <td className="px-6 py-4 font-black text-zinc-900">
                            ₹{p.amount}
                          </td>
                          <td className="px-6 py-4 font-semibold text-zinc-500">
                            {p.due_date || "—"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[9px] font-black rounded-lg border uppercase ${
                              p.status === "paid" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                              p.status === "partial" ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-rose-50 border-rose-100 text-rose-600"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {p.status !== "paid" && (
                                <button
                                  onClick={() => handleOpenRecordPayment(p)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-100 cursor-pointer"
                                >
                                  Record Payment
                                </button>
                              )}
                              {(p.status === "paid" || p.status === "partial") && (
                                <button
                                  onClick={() => handleOpenReceiptDetails(p)}
                                  className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-750 font-bold text-[10px] rounded-lg border border-violet-100 cursor-pointer"
                                >
                                  Receipts / Details
                                </button>
                              )}
                              {p.status === "unpaid" && (
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {payments.length > pageSize && (
                <div className="w-full pt-2">
                  <Pagination
                    totalCount={payments.length}
                    pageSize={pageSize}
                    currentPage={paymentsPage}
                    onPageChange={setPaymentsPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === "structures" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setStructureName("");
                setStructureAmount("");
                setStructureFrequency("monthly");
                setFormError("");
                setIsStructureModalOpen(true);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <FaPlus className="w-3.5 h-3.5" /> Create Fee Structure
            </button>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-20"><PageLoader /></div>
          ) : structures.length === 0 ? (
            <EmptyState title="No Fee Structures" desc="Add tuition, transport, or lab fee structures." />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {structures.slice((structuresPage - 1) * pageSize, structuresPage * pageSize).map(s => (
                  <div key={s.id} className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase">{s.frequency || "monthly"}</span>
                        <button onClick={() => handleDeleteStructure(s.id)} className="p-1 text-zinc-400 hover:text-rose-600">
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-extrabold text-zinc-800 text-sm">{s.name}</h4>
                      <span className="text-base font-black text-zinc-900 block mt-1">₹{s.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              {structures.length > pageSize && (
                <div className="w-full pt-2">
                  <Pagination
                    totalCount={structures.length}
                    pageSize={pageSize}
                    currentPage={structuresPage}
                    onPageChange={setStructuresPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGN FEES */}
      {activeTab === "assign" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-5">
          <div className="flex border-b border-zinc-150 pb-3">
            <button
              type="button"
              onClick={() => setAssignMode("single")}
              className={`flex-1 py-1.5 font-bold uppercase text-[10px] tracking-wider rounded-lg transition-all ${
                assignMode === "single" ? "bg-violet-600 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              Assign to Single Student
            </button>
            <button
              type="button"
              onClick={() => setAssignMode("bulk")}
              className={`flex-1 py-1.5 font-bold uppercase text-[10px] tracking-wider rounded-lg transition-all ${
                assignMode === "bulk" ? "bg-violet-600 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              Bulk Assign to Class
            </button>
          </div>

          <form onSubmit={handleAssignFeeSubmit} className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl font-bold">{formError}</div>}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Fee Structure</label>
              <select
                value={selectedStructureId}
                onChange={(e) => setSelectedStructureId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
              >
                <option value="">Choose Fee Structure</option>
                {(meta?.structures || meta?.fee_structures || structures || []).map(fs => (
                  <option key={fs.id} value={fs.id}>{fs.name} (₹{fs.amount})</option>
                ))}
              </select>
            </div>

            {assignMode === "single" ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="">Choose Student</option>
                  {(meta?.students || studentsList || []).map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name || `${st.first_name || ""} ${st.last_name || ""}`.trim() || st.name} {st.student_code || st.employee_id || st.admission_no ? `(${st.student_code || st.employee_id || st.admission_no})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                  >
                    <option value="">Choose Class</option>
                    {meta?.classes?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section (Optional)</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                  >
                    <option value="">All Sections</option>
                    {(selectedClassId ? meta?.sections?.filter(sec => sec.class_id === selectedClassId) : meta?.sections || []).map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name} {sec.class_name ? `(${sec.class_name})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Due Date</label>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold cursor-pointer transition-all text-xs"
            >
              {submitting ? "Assigning Fee..." : "Confirm & Assign Fee"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: LATE FEE RULES */}
      {activeTab === "late-rules" && (
        <div className="space-y-6">
          {/* Rules Configuration Form */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
            <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2 border-b border-zinc-150 pb-2">
              <FaClock className="text-violet-500" /> Save / Apply Late Fee Rule
            </h3>

            <form onSubmit={handleSaveLateFeeRuleSubmit} className="space-y-4">
              {formError && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl font-bold">{formError}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Fee Structure</label>
                <select
                  value={targetFeeStructureId}
                  onChange={(e) => setTargetFeeStructureId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="">Specific Fee Structure (Select)</option>
                  {(meta?.structures || meta?.fee_structures || structures || []).map(fs => (
                    <option key={fs.id} value={fs.id}>{fs.name} (₹{fs.amount})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Grace Days (Days After Due)</label>
                  <input 
                    type="number"
                    value={daysAfterDue}
                    onChange={(e) => setDaysAfterDue(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Late Fee Per Day (₹)</label>
                  <input 
                    type="number"
                    value={lateFeePerDay}
                    onChange={(e) => setLateFeePerDay(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="applyToAllCheck"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300"
                />
                <label htmlFor="applyToAllCheck" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">Apply to all active fee structures</label>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleClearLateFeeRule}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs"
                >
                  Clear Rule for Selected Structure
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
                >
                  {submitting ? "Saving..." : "Save Late Fee Rule"}
                </button>
              </div>
            </form>
          </div>

          {/* History List */}
          {lateRulesData?.history && lateRulesData.history.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-zinc-800 text-xs flex items-center gap-1.5 mb-3">
                <FaHistory className="text-violet-500" /> Late Fee Rule History
              </h4>
              <div className="divide-y divide-zinc-100">
                {lateRulesData.history.slice((historyPage - 1) * pageSize, historyPage * pageSize).map(h => (
                  <div key={h.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="font-bold text-zinc-800 block">Structure: {h.fee_structure_name || "All Structures"}</span>
                      <span className="text-[10px] text-zinc-400">Grace: {h.days_after_due} Days • Fee: ₹{h.late_fee_per_day}/day</span>
                    </div>
                    <button onClick={() => handleDeleteLateRuleHistory(h.id)} className="p-1 text-zinc-400 hover:text-rose-600">
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {lateRulesData.history.length > pageSize && (
                <div className="w-full pt-2">
                  <Pagination
                    totalCount={lateRulesData.history.length}
                    pageSize={pageSize}
                    currentPage={historyPage}
                    onPageChange={setHistoryPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && activePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm">Record Fee Payment</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  value={paidAmount} 
                  onChange={(e) => setPaidAmount(e.target.value)} 
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Transaction Reference (Optional)</label>
                <input 
                  type="text" 
                  value={transactionRef} 
                  onChange={(e) => setTransactionRef(e.target.value)} 
                  placeholder="e.g. TXN987654321"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs">{submitting ? "Recording..." : "Confirm Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structure Modal */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm">Create Fee Structure</h3>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateStructureSubmit} className="p-6 space-y-4">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Structure Name</label>
                <input 
                  type="text" 
                  value={structureName} 
                  onChange={(e) => setStructureName(e.target.value)} 
                  placeholder="e.g. Tuition Fee"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Amount (₹)</label>
                <input 
                  type="number" 
                  value={structureAmount} 
                  onChange={(e) => setStructureAmount(e.target.value)} 
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Frequency</label>
                <select
                  value={structureFrequency}
                  onChange={(e) => setStructureFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  {(meta?.frequencies || ["monthly", "quarterly", "yearly", "one_time"]).map(freq => (
                    <option key={freq} value={freq}>
                      {freq === "one_time" ? "One Time" : freq === "yearly" ? "Yearly" : freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Class (Optional)</label>
                <select
                  value={structureClassId}
                  onChange={(e) => setStructureClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="">All Classes (General Fee)</option>
                  {meta?.classes?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Due Date (Optional)</label>
                <input 
                  type="date"
                  value={structureDueDate}
                  onChange={(e) => setStructureDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsStructureModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs">{submitting ? "Creating..." : "Create Structure"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipts & Transactions Details Modal */}
      {isDetailsModalOpen && selectedPaymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileInvoiceDollar className="text-violet-500" />
                Receipts & Payment History
              </h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Student</span>
                  <p className="font-extrabold text-zinc-800 text-sm mt-0.5">{selectedPaymentDetails.student_name || selectedPaymentDetails.student?.full_name || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Fee Structure</span>
                  <p className="font-semibold text-zinc-700 mt-0.5">{selectedPaymentDetails.fee_structure_name || selectedPaymentDetails.structure?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Total Amount</span>
                  <p className="font-black text-zinc-900 text-sm mt-0.5">₹{selectedPaymentDetails.amount}</p>
                </div>
              </div>

              {/* Combined Receipt Button (If available) */}
              {selectedPaymentDetails.has_receipt && (
                <div className="flex items-center justify-between bg-violet-50/50 p-3.5 rounded-xl border border-violet-100">
                  <div>
                    <h4 className="font-bold text-violet-850">Combined Receipt</h4>
                    <p className="text-[10px] text-violet-600/80">Download or print the combined receipt statement for this student.</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPaymentDetails.receipt_print_url && (
                      <button
                        onClick={() => handlePrintReceiptDirect(selectedPaymentDetails.receipt_print_url)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FaPrint className="w-3 h-3" /> Print
                      </button>
                    )}
                    {selectedPaymentDetails.receipt_pdf_url && (
                      <button
                        onClick={() => handlePrintReceiptDirect(selectedPaymentDetails.receipt_pdf_url)}
                        className="px-3 py-1.5 bg-white border border-violet-250 text-violet-700 hover:bg-violet-50 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FaFilePdf className="w-3 h-3" /> PDF
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Installments & Online Transactions */}
              <div>
                <h4 className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider text-violet-600 mb-3">Installments & Transactions Log</h4>
                {selectedPaymentDetails.online_transactions && selectedPaymentDetails.online_transactions.length > 0 ? (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50 text-[9px] font-bold text-zinc-400 uppercase">
                          <th className="px-4 py-2">Transaction ID</th>
                          <th className="px-4 py-2">Amount</th>
                          <th className="px-4 py-2">Mode</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 text-zinc-700">
                        {selectedPaymentDetails.online_transactions.map((txn) => (
                          <tr key={txn.id || txn.transaction_id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-2 font-mono text-zinc-650">{txn.transaction_id || "—"}</td>
                            <td className="px-4 py-2 font-bold text-zinc-900">₹{txn.amount}</td>
                            <td className="px-4 py-2 capitalize">{txn.payment_mode || "online"}</td>
                            <td className="px-4 py-2 text-zinc-500">{txn.created_at || "—"}</td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {txn.print_url && (
                                  <button
                                    onClick={() => handlePrintReceiptDirect(txn.print_url)}
                                    className="p-1 text-violet-600 hover:bg-violet-50 rounded"
                                    title="Print Statement"
                                  >
                                    <FaPrint className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {txn.pdf_url && (
                                  <button
                                    onClick={() => handlePrintReceiptDirect(txn.pdf_url)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                    title="Download PDF"
                                  >
                                    <FaFilePdf className="w-3.5 h-3.5" />
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
                  <div className="py-6 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-400">
                    No online transaction log found for this payment record.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end shrink-0">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl text-xs cursor-pointer">Close Drawer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
