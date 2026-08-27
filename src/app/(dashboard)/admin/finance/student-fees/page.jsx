"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaSearch, FaPlus, FaTimes, FaMoneyBillWave, FaTrash, FaCheck, FaBell, FaClock, FaHistory, FaUserCheck, FaLayerGroup, FaCalendarAlt, FaChartLine, FaFilter, FaPrint
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
  getTeacherFeeStructuresReport,
  getOnlinePayments,
  getInventoryMeta
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function AdminFeesPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("payments"); // "payments" | "structures" | "assign" | "late-rules" | "structure-report" | "online-payments"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [meta, setMeta] = useState(null);

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

  // Send Reminders Modal
  const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
  const [reminderPayment, setReminderPayment] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState(["dashboard"]);

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
  const [notes, setNotes] = useState("");

  // --- Late Fee Rules Tab State ---
  const [lateRulesData, setLateRulesData] = useState(null);
  const [targetFeeStructureId, setTargetFeeStructureId] = useState("");
  const [daysAfterDue, setDaysAfterDue] = useState("5");
  const [lateFeePerDay, setLateFeePerDay] = useState("50");
  const [applyToAll, setApplyToAll] = useState(false);

  // --- Structure Reports State ---
  const [structureReport, setStructureReport] = useState([]);
  const [expandedStructureId, setExpandedStructureId] = useState(null);

  // --- Online Payments State ---
  const [onlinePayments, setOnlinePayments] = useState([]);
  const [onlineSummary, setOnlineSummary] = useState(null);
  const [onlineDaily, setOnlineDaily] = useState([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  });
  const [onlineSearch, setOnlineSearch] = useState("");
  const [onlineModeFilter, setOnlineModeFilter] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [studentsList, setStudentsList] = useState([]);

  // Load Meta Options
  const loadMeta = async () => {
    try {
      setLoading(true);
      const data = await getTeacherFeesMeta();
      setMeta(data.meta || data.data || data || null);

      try {
        const invMeta = await getInventoryMeta();
        const stds = invMeta.students || invMeta.data?.students || [];
        setStudentsList(stds);
      } catch (invErr) {
        console.error("Failed to load students registry for dropdown: ", invErr);
      }
    } catch (err) {
      toast.error("Failed to load fees configuration: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  // Fetch Payments List
  const loadPayments = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (classFilter !== "all") params.class_id = classFilter;
      if (sectionFilter !== "all") params.section_id = sectionFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getTeacherFees(params);
      setPayments(data.payments || data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      toast.error("Failed to load payments roster: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Structures List
  const loadStructures = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherFeeStructures();
      setStructures(data.structures || data.data || []);
    } catch (err) {
      toast.error("Failed to load fee structures: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Late Fee Rules
  const loadLateFeeRules = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherLateFeeRules();
      setLateRulesData(data || null);
    } catch (err) {
      toast.error("Failed to load late fee rules: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Structure-wise Report
  const loadStructureReports = async () => {
    try {
      setListLoading(true);
      const data = await getTeacherFeeStructuresReport();
      setStructureReport(data.report || data.data || []);
    } catch (err) {
      toast.error("Failed to load structure-wise report: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Online Payments
  const loadOnlinePayments = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (onlineSearch.trim()) params.search = onlineSearch.trim();
      if (onlineModeFilter) params.payment_mode = onlineModeFilter;

      const data = await getOnlinePayments(params);
      setOnlinePayments(data.transactions || data.data || []);
      setOnlineSummary(data.summary || null);
      setOnlineDaily(data.daily || []);
    } catch (err) {
      toast.error("Failed to load online payments: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (loading) return;
    if (activeTab === "payments") {
      loadPayments();
    } else if (activeTab === "structures") {
      loadStructures();
    } else if (activeTab === "late-rules") {
      loadLateFeeRules();
    } else if (activeTab === "structure-report") {
      loadStructureReports();
    } else if (activeTab === "online-payments") {
      loadOnlinePayments();
    }
  }, [activeTab, loading, statusFilter, classFilter, sectionFilter, searchQuery]);

  // Debounced search triggers for Online Report
  useEffect(() => {
    if (activeTab === "online-payments" && !loading) {
      const timer = setTimeout(() => {
        loadOnlinePayments();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dateFrom, dateTo, onlineSearch, onlineModeFilter]);

  // Filter sections options based on selected class
  const classSections = useMemo(() => {
    if (!meta || !meta.sections) return [];
    if (classFilter === "all") return [];
    return meta.sections.filter(s => s.class_id === classFilter);
  }, [meta, classFilter]);

  // Filter form sections
  const formSections = useMemo(() => {
    if (!meta || !meta.sections) return [];
    if (!selectedClassId) return [];
    return meta.sections.filter(s => s.class_id === selectedClassId);
  }, [meta, selectedClassId]);

  // Handle Record Manual Payment submit
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      setFormError("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);
      await recordTeacherFeePayment(activePayment.id, {
        amount: parseFloat(paidAmount),
        payment_method: paymentMode
      });
      toast.success("Payment recorded successfully!");
      setIsRecordModalOpen(false);
      loadPayments();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Unpaid Payment
  const handleDeleteUnpaid = async (paymentId, studentName) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Unpaid Payment Record",
      message: `Are you sure you want to delete the pending/unpaid payment record for "${studentName || "Student"}"?`,
      type: "delete",
      confirmText: "Delete Record",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      await deleteTeacherFeePayment(paymentId);
      toast.success("Payment record deleted successfully.");
      loadPayments();
    } catch (err) {
      toast.error("Failed to delete record: " + (err.message || err));
    }
  };

  // Handle Create Fee Structure
  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!structureName.trim() || !structureAmount || !structureFrequency) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      await addTeacherFeeStructure({
        name: structureName.trim(),
        amount: parseFloat(structureAmount),
        frequency: structureFrequency,
        school_class_id: structureClassId || null,
        due_date: structureDueDate || null
      });
      toast.success("Fee structure created successfully!");
      setIsStructureModalOpen(false);

      // Reset form
      setStructureName("");
      setStructureAmount("");
      setStructureFrequency("monthly");
      setStructureClassId("");
      setStructureDueDate("");

      loadStructures();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create fee structure.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Fee Structure
  const handleDeleteStructure = async (id, name) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Fee Structure",
      message: `Are you sure you want to delete the fee structure "${name}"? This operation cannot be undone.`,
      type: "delete",
      confirmText: "Delete Structure",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      await deleteTeacherFeeStructure(id);
      toast.success("Fee structure deleted successfully.");
      loadStructures();
    } catch (err) {
      toast.error("Failed to delete structure: " + (err.message || err));
    }
  };

  // Handle Assign Fee (Single & Bulk)
  const handleAssignFee = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedStructureId) {
      setFormError("Please select a fee structure.");
      return;
    }

    try {
      setSubmitting(true);
      if (assignMode === "single") {
        if (!selectedStudentId) {
          setFormError("Please select a student.");
          setSubmitting(false);
          return;
        }
        await assignTeacherFee({
          student_id: selectedStudentId,
          fee_structure_id: selectedStructureId,
          due_date: dueDate || null,
          notes: notes.trim() || null
        });
        toast.success("Fee assigned to student successfully!");
      } else {
        if (!selectedClassId) {
          setFormError("Please select a class.");
          setSubmitting(false);
          return;
        }
        await bulkAssignTeacherFee({
          fee_structure_id: selectedStructureId,
          school_class_id: selectedClassId,
          section_id: selectedSectionId || null
        });
        toast.success("Fee structure assigned bulk to class successfully!");
      }

      // Reset assignment state
      setSelectedStudentId("");
      setSelectedClassId("");
      setSelectedSectionId("");
      setDueDate("");
      setNotes("");
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to assign fee structure.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Send Reminder submit
  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await remindTeacherFee({
        payment_id: reminderPayment.id,
        channels: selectedChannels
      });
      toast.success("Fee reminder dispatched successfully!");
      setIsRemindModalOpen(false);
    } catch (err) {
      toast.error("Failed to dispatch reminders: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Late Fee Rule
  const handleSaveLateRule = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      setSubmitting(true);
      await saveTeacherLateFeeRule({
        fee_structure_id: targetFeeStructureId || null,
        days_after_due: parseInt(daysAfterDue),
        late_fee_per_day: parseFloat(lateFeePerDay),
        apply_to_all: applyToAll
      });
      toast.success("Late fee rule configured successfully!");
      loadLateFeeRules();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to configure late rule.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Clear Late Fee Rule
  const handleClearLateRule = async (structureId) => {
    const isConfirmed = await dialog.confirm({
      title: "Remove Configured Rule",
      message: "Are you sure you want to clear/delete the active late fee rules for this structure?",
      type: "danger",
      confirmText: "Clear Rule",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      await clearTeacherLateFeeRule({ fee_structure_id: structureId });
      toast.success("Late fee rule cleared successfully.");
      loadLateFeeRules();
    } catch (err) {
      toast.error("Failed to clear rules: " + (err.message || err));
    }
  };

  // Handle Delete Late Fee Rule History Item
  const handleDeleteRuleHistory = async (id) => {
    try {
      await deleteTeacherLateFeeRuleHistory(id);
      toast.success("History rule record deleted.");
      loadLateFeeRules();
    } catch (err) {
      toast.error("Failed to delete history rule: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader
          title="Student Fees Management"
          subtitle="Define session fee structures, assign terms classes dues, record payments, and inspect collection summaries."
        />

        {/* tab navigation bar */}
        <div className="bg-white border border-zinc-200 p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "payments" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaMoneyBillWave className="w-3.5 h-3.5" /> Payments Roster
          </button>
          <button
            onClick={() => setActiveTab("structures")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "structures" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaLayerGroup className="w-3.5 h-3.5" /> Fee Structures
          </button>
          <button
            onClick={() => setActiveTab("structure-report")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "structure-report" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaChartLine className="w-3.5 h-3.5" /> Structure Report
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "assign" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaUserCheck className="w-3.5 h-3.5" /> Assign Fee
          </button>
          <button
            onClick={() => setActiveTab("late-rules")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "late-rules" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaClock className="w-3.5 h-3.5" /> Late Fee Rules
          </button>
          <button
            onClick={() => setActiveTab("online-payments")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "online-payments" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaHistory className="w-3.5 h-3.5" /> Online Collection
          </button>
        </div>

        {/* ========================================================
            TAB 1: PAYMENTS ROSTER
            ======================================================== */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Counter Row */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Assigned Dues</span>
                  <span className="text-sm font-black text-zinc-800 block mt-1">₹{stats.total_assigned?.toLocaleString() || stats.assigned?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Collected Amount</span>
                  <span className="text-sm font-black text-emerald-700 block mt-1">₹{stats.total_collected?.toLocaleString() || stats.paid?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Outstanding Due</span>
                  <span className="text-sm font-black text-rose-700 block mt-1">₹{stats.total_due?.toLocaleString() || stats.due?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Late Fees Dues</span>
                  <span className="text-sm font-black text-amber-700 block mt-1">₹{stats.total_late_fee?.toLocaleString() || stats.late_fee?.toLocaleString() || 0}</span>
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by student name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 cursor-pointer outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>

                <select
                  value={classFilter}
                  onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("all"); }}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 cursor-pointer outline-none"
                >
                  <option value="all">All Classes</option>
                  {meta?.classes?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  disabled={classFilter === "all"}
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 cursor-pointer outline-none disabled:opacity-50"
                >
                  <option value="all">All Sections</option>
                  {classSections.map(s => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>

                <button
                  onClick={loadPayments}
                  className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all border border-violet-100"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Payments List Table */}
            {listLoading ? (
              <div className="py-12"><PageLoader /></div>
            ) : payments.length === 0 ? (
              <EmptyState title="No Payment Records Found" desc="There are no student dues records matching your active filters." />
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Fee Structure Item</th>
                        <th className="px-6 py-4 text-center">Amount Due</th>
                        <th className="px-6 py-4 text-center">Late Fee Dues</th>
                        <th className="px-6 py-4 text-center">Total Payable</th>
                        <th className="px-6 py-4 text-center">Payment Status</th>
                        <th className="px-6 py-4 text-center">Due Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-zinc-800 block capitalize">{p.student_name || "Guest Student"}</span>
                              <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">
                                Roll No: {p.roll_no || "N/A"} • ID: {p.student_code || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-800 capitalize">
                            {p.fee_name}
                          </td>
                          <td className="px-6 py-4 text-center font-extrabold">₹{p.amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center text-amber-600 font-extrabold">
                            ₹{p.late_fee_amount || 0}
                          </td>
                          <td className="px-6 py-4 text-center font-extrabold text-violet-600">₹{p.total_payable?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${p.status === "paid" ? "bg-emerald-50 text-emerald-700" : p.status === "partial" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-zinc-500">
                            {p.due_date_label || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status !== "paid" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActivePayment(p);
                                      setPaidAmount(p.due_amount || p.amount);
                                      setIsRecordModalOpen(true);
                                      setFormError("");
                                    }}
                                    className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-[9px] transition-all cursor-pointer uppercase tracking-wider"
                                    title="Record Cash/Cheque Dues Payment"
                                  >
                                    Pay Dues
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReminderPayment(p);
                                      setSelectedChannels(["dashboard"]);
                                      setIsRemindModalOpen(true);
                                    }}
                                    className="p-1.5 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-400 hover:text-violet-600 transition-all cursor-pointer"
                                    title="Send Reminders Notification"
                                  >
                                    <FaBell className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteUnpaid(p.id, p.student_name)}
                                className="p-1.5 border border-zinc-200 hover:border-rose-300 rounded-lg text-zinc-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Delete Unpaid Record"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: FEE STRUCTURES
            ======================================================== */}
        {activeTab === "structures" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-zinc-800 text-sm">Fee Structures Catalog</h3>
              <button
                onClick={() => {
                  setIsStructureModalOpen(true);
                  setFormError("");
                }}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FaPlus className="w-3 h-3" /> Create Structure
              </button>
            </div>

            {listLoading ? (
              <div className="py-12"><PageLoader /></div>
            ) : structures.length === 0 ? (
              <EmptyState title="No Structures Configured" desc="No classfee structures catalogs are defined yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {structures.map(st => (
                  <div key={st.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-zinc-100">
                        <h4 className="font-extrabold text-zinc-800 text-sm capitalize">{st.name}</h4>
                        <button
                          onClick={() => handleDeleteStructure(st.id, st.name)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Structure"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                          <span>Standard Amount:</span>
                          <span className="font-black text-zinc-800">₹{st.amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                          <span>Billing Frequency:</span>
                          <span className="font-black text-zinc-800 uppercase tracking-widest">{st.frequency}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                          <span>Associated Class:</span>
                          <span className="font-black text-zinc-800">{st.class_name || "All Classes"}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                          <span>Due Date:</span>
                          <span className="font-black text-zinc-800">{st.due_date || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: STRUCTURE REPORTS (FIXED)
            ======================================================== */}
        {activeTab === "structure-report" && (
          <div className="space-y-6 animate-fade-in text-left">
            <h3 className="font-extrabold text-zinc-800 text-sm">Structure-Wise Collections Summary</h3>

            {listLoading ? (
              <div className="py-12"><PageLoader /></div>
            ) : structureReport.length === 0 ? (
              <EmptyState title="No Metrics Available" desc="Failed to load structure-wise collection records." />
            ) : (
              <div className="space-y-4">
                {structureReport.map((row) => {
                  const structureId = row.id;
                  const isExpanded = expandedStructureId === structureId;
                  const studentsList = row.students || [];

                  return (
                    <div key={structureId} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Header Summary Row */}
                      <div
                        onClick={() => setExpandedStructureId(isExpanded ? null : structureId)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/40 transition-colors"
                      >
                        <div>
                          <h4 className="font-extrabold text-zinc-800 text-sm capitalize">{row.name || "Unnamed Structure"}</h4>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mt-0.5">
                            Class: {row.class_name || "All"} • Amount: ₹{row.amount?.toLocaleString() || 0} • Frequency: {row.frequency || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          <div>
                            <span className="block text-[8px] text-zinc-400">Assigned</span>
                            <span className="font-black text-zinc-800 text-xs block mt-0.5">{row.assigned_count || 0} students</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-zinc-400">Total Value</span>
                            <span className="font-black text-violet-600 text-xs block mt-0.5">₹{row.total_assigned_amount?.toLocaleString() || 0}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-zinc-400">Collected</span>
                            <span className="font-black text-emerald-600 text-xs block mt-0.5">₹{row.total_collected?.toLocaleString() || 0}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-zinc-400">Outstanding Due</span>
                            <span className="font-black text-rose-600 text-xs block mt-0.5">₹{row.total_due?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Accordion Students List */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-zinc-100 bg-zinc-50/20">
                          <h5 className="font-bold text-zinc-800 text-[11px] my-3">Associated Student Payment Dues</h5>
                          {studentsList.length === 0 ? (
                            <p className="text-[10px] text-zinc-400 italic">No student payments associated with this structure.</p>
                          ) : (
                            <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] text-zinc-400 font-extrabold uppercase">
                                    <th className="px-4 py-2.5">Student Name</th>
                                    <th className="px-4 py-2.5">Student Code</th>
                                    <th className="px-4 py-2.5 text-center">Class / Sec</th>
                                    <th className="px-4 py-2.5 text-center">Amount</th>
                                    <th className="px-4 py-2.5 text-center">Paid Amount</th>
                                    <th className="px-4 py-2.5 text-center">Due Amount</th>
                                    <th className="px-4 py-2.5 text-center">Due Date</th>
                                    <th className="px-4 py-2.5 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-bold text-zinc-600">
                                  {studentsList.map((stStudent, sIdx) => (
                                    <tr key={stStudent.payment_id || sIdx} className="hover:bg-zinc-50/50">
                                      <td className="px-4 py-2.5 font-bold text-zinc-800 capitalize">
                                        {stStudent.student_name || "Guest / Unnamed"}
                                      </td>
                                      <td className="px-4 py-2.5 font-mono text-zinc-500">
                                        {stStudent.student_code || "N/A"}
                                      </td>
                                      <td className="px-4 py-2.5 text-center">
                                        {stStudent.class_name ? `${stStudent.class_name} ${stStudent.section_name ? `(${stStudent.section_name})` : ''}` : "N/A"}
                                      </td>
                                      <td className="px-4 py-2.5 text-center">
                                        ₹{parseFloat(stStudent.amount || 0).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-emerald-600">
                                        ₹{parseFloat(stStudent.paid_amount || 0).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-rose-600">
                                        ₹{parseFloat(stStudent.due_amount || 0).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-zinc-500">
                                        {stStudent.due_date || "N/A"}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black ${stStudent.status === "paid" ? "bg-emerald-50 text-emerald-700" : stStudent.status === "partial" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                          {stStudent.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: ASSIGN FEE
            ======================================================== */}
        {activeTab === "assign" && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm max-w-lg mx-auto text-left animate-fade-in">
            <h3 className="font-extrabold text-zinc-800 text-sm mb-4 border-b border-zinc-100 pb-3 flex items-center gap-1.5">
              <FaUserCheck className="text-violet-500" /> Assign Fee Structure
            </h3>

            <div className="flex gap-4 mb-5 p-1 bg-zinc-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setAssignMode("single")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignMode === "single" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-600"}`}
              >
                Individual Student
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("bulk")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignMode === "bulk" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-600"}`}
              >
                Bulk Class/Section
              </button>
            </div>

            <form onSubmit={handleAssignFee} className="space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Fee Structure *</label>
                <select
                  required
                  value={selectedStructureId}
                  onChange={(e) => setSelectedStructureId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                >
                  <option value="">Select Fee Structure</option>
                  {meta?.structures?.map(st => (
                    <option key={st.id} value={st.id}>{st.name} (₹{st.amount})</option>
                  ))}
                </select>
              </div>

              {assignMode === "single" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Select Student *</label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                    >
                      <option value="">Select Student</option>
                      {studentsList?.map((student) => {
                        const studentId = student.id;
                        const studentName = student.name || student.full_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Unnamed Student";
                        const className = student.class?.name || student.class || student.class_name || "No Class";
                        const sectionName = student.section?.name || student.section || student.section_name || "No Section";

                        return (
                          <option key={studentId} value={studentId}>
                            {studentName} ({className} - {sectionName})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Allocation Notes (Optional)</label>
                    <textarea
                      rows="3"
                      placeholder="Any additional remarks..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold resize-none"
                    ></textarea>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class *</label>
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                    >
                      <option value="">Select Class</option>
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
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                    >
                      <option value="">All Sections</option>
                      {formSections.map(s => (
                        <option key={s.id} value={s.id}>Section {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all text-xs"
              >
                {submitting ? "Assigning..." : "Assign Fee Structure"}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 5: LATE FEE RULES
            ======================================================== */}
        {activeTab === "late-rules" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
            {/* Create Rule Form */}
            <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="font-extrabold text-zinc-800 text-sm mb-4 border-b border-zinc-100 pb-3 flex items-center gap-1.5">
                <FaClock className="text-violet-500" /> Late Fee Configuration
              </h3>

              <form onSubmit={handleSaveLateRule} className="space-y-4 text-xs font-semibold">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Fee Structure *</label>
                  <select
                    value={targetFeeStructureId}
                    onChange={(e) => setTargetFeeStructureId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                  >
                    <option value="">Default (Apply to all unless specific)</option>
                    {meta?.structures?.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Grace Days (Days After Due) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5"
                    value={daysAfterDue}
                    onChange={(e) => setDaysAfterDue(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Late Fee Per Day (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={lateFeePerDay}
                    onChange={(e) => setLateFeePerDay(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-bold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="applyToAll"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="w-3.5 h-3.5 border-zinc-300 text-violet-600 focus:ring-violet-500 rounded"
                  />
                  <label htmlFor="applyToAll" className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block cursor-pointer">
                    Apply to all current structures
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all text-xs"
                >
                  {submitting ? "Configuring..." : "Configure Late Rule"}
                </button>
              </form>
            </div>

            {/* List and History Rules */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Active Rule Summary */}
              {lateRulesData?.current_rule && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-zinc-800 text-xs">Active Default Rule Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 border border-zinc-100 p-3.5 rounded-xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Grace Period</span>
                      <span className="font-black text-zinc-800 text-sm block mt-1">{lateRulesData.current_rule.days_after_due} Days grace</span>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl">
                      <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">Late Charge Per Day</span>
                      <span className="font-black text-amber-700 text-sm block mt-1">₹{lateRulesData.current_rule.late_fee_per_day}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-zinc-100">
                  <h4 className="font-extrabold text-zinc-800 text-xs">Rules Configuration History</h4>
                </div>

                {lateRulesData?.history?.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 italic font-bold">No historical rules defined.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                          <th className="px-6 py-3">Fee Structure</th>
                          <th className="px-6 py-3 text-center">Grace Days</th>
                          <th className="px-6 py-3 text-center">Late Fee / Day</th>
                          <th className="px-6 py-3 text-center">Configured On</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-600 font-bold">
                        {lateRulesData?.history?.map((hist) => (
                          <tr key={hist.id} className="hover:bg-zinc-50/40 transition-colors">
                            <td className="px-6 py-3 capitalize text-zinc-800">{hist.fee_structure || "Default"}</td>
                            <td className="px-6 py-3 text-center">{hist.days_after_due} Days</td>
                            <td className="px-6 py-3 text-center text-amber-600">₹{hist.late_fee_per_day}</td>
                            <td className="px-6 py-3 text-center text-zinc-500 text-[10px]">{hist.created_at_label || hist.created_at}</td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleClearLateRule(hist.fee_structure_id)}
                                  className="px-2 py-1 border border-zinc-200 hover:border-zinc-300 text-[10px] rounded-lg text-zinc-500 hover:text-zinc-800"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={() => handleDeleteRuleHistory(hist.id)}
                                  className="p-1.5 border border-zinc-200 hover:border-rose-300 text-zinc-400 hover:text-rose-600 rounded-lg"
                                  title="Delete history entry"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: ONLINE PAYMENTS REPORT
            ======================================================== */}
        {activeTab === "online-payments" && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Summary Row */}
            {onlineSummary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Transactions</span>
                  <span className="text-sm font-black text-zinc-800 block mt-1">{onlineSummary.count || 0} Payments</span>
                </div>
                <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider block">Total Online Collections</span>
                  <span className="text-sm font-black text-violet-700 block mt-1">₹{onlineSummary.total?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Cash Dues Recorded</span>
                  <span className="text-sm font-black text-emerald-700 block mt-1">₹{onlineSummary.cash_total?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Gateway Transactions</span>
                  <span className="text-sm font-black text-zinc-800 block mt-1">₹{onlineSummary.online_total?.toLocaleString() || 0}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">Cash vs Online Count</span>
                  <span className="text-sm font-black text-amber-700 block mt-1">{onlineSummary.cash_count || 0} / {onlineSummary.online_count || 0}</span>
                </div>
              </div>
            )}

            {/* Filter toolbar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by student name or transaction id..."
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Period:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-1 border border-zinc-200 rounded-xl outline-none text-xs text-zinc-700 bg-zinc-50 font-bold"
                  />
                  <span className="text-zinc-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-1 border border-zinc-200 rounded-xl outline-none text-xs text-zinc-700 bg-zinc-50 font-bold"
                  />
                </div>

                <select
                  value={onlineModeFilter}
                  onChange={(e) => setOnlineModeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 cursor-pointer outline-none"
                >
                  <option value="">All Payment Modes</option>
                  <option value="cash">Cash</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="easebuzz">Easebuzz</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

            {/* Daily Collections Subgrid */}
            {onlineDaily.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-zinc-800 text-xs flex items-center gap-1.5">
                  <FaChartLine className="text-violet-500" /> Daily Transactions Ledger Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {onlineDaily.map((day, idx) => (
                    <div key={idx} className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">{day.date_label}</span>
                      <span className="font-black text-zinc-800 text-xs block mt-1">₹{day.total?.toLocaleString()}</span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">{day.transaction_count} payments</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Log List */}
            {listLoading ? (
              <div className="py-12"><PageLoader /></div>
            ) : onlinePayments.length === 0 ? (
              <EmptyState title="No Transactions Logged" desc="No transaction records fit your active query timeframe." />
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Fee Item</th>
                        <th className="px-6 py-4 text-center">Amount Paid</th>
                        <th className="px-6 py-4 text-center">Transaction ID</th>
                        <th className="px-6 py-4 text-center">Receipt No</th>
                        <th className="px-6 py-4 text-center">Payment Mode</th>
                        <th className="px-6 py-4 text-right">Payment Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-bold text-zinc-600">
                      {onlinePayments.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-800 capitalize">{tx.student_name || "Guest Student"}</td>
                          <td className="px-6 py-4 font-bold text-zinc-800 capitalize">{tx.fee_name}</td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-extrabold">₹{tx.amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center text-zinc-500 font-mono text-[10px]">{tx.transaction_id || "N/A"}</td>
                          <td className="px-6 py-4 text-center text-zinc-500 font-mono text-[10px]">{tx.receipt_no || "N/A"}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-black bg-zinc-100 text-zinc-700">
                              {tx.payment_mode || tx.gateway}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-500 text-[10px]">{tx.paid_at_label || tx.paid_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            MODAL 1: RECORD MANUAL PAYMENTS
            ======================================================== */}
        {isRecordModalOpen && activePayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaMoneyBillWave className="text-violet-500" /> Record Offline Payment
                </h3>
                <button onClick={() => setIsRecordModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs font-semibold">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                    {formError}
                  </div>
                )}

                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Fee Structure Item</span>
                  <span className="text-zinc-800 font-extrabold text-[11px] block capitalize">{activePayment.fee_name}</span>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold block mt-2 uppercase">
                    <span>Student:</span>
                    <span className="text-zinc-800">{activePayment.student_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold block mt-1 uppercase">
                    <span>Dues Balance:</span>
                    <span className="text-rose-600">₹{activePayment.due_amount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter amount value"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-bold animate-scale-up"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                    <option value="online">Online Transfer</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 2: SEND REMINDERS NOTIFICATION
            ======================================================== */}
        {isRemindModalOpen && reminderPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaBell className="text-violet-500" /> Send Dues Reminder
                </h3>
                <button onClick={() => setIsRemindModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReminderSubmit} className="p-6 space-y-4 text-xs font-semibold">
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3.5">
                  <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Target Student</span>
                  <span className="text-zinc-800 font-extrabold text-[11px] block mt-0.5 capitalize">{reminderPayment.student_name}</span>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold block mt-2 uppercase">
                    <span>Pending Item:</span>
                    <span className="text-zinc-800">{reminderPayment.fee_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold block mt-1 uppercase">
                    <span>Due Amount:</span>
                    <span className="text-rose-600">₹{reminderPayment.due_amount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Notification Channels</label>
                  <div className="grid grid-cols-2 gap-3">
                    {meta?.reminder_channels ? (
                      meta.reminder_channels.map(channel => (
                        <div key={channel} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`remind-${channel}`}
                            checked={selectedChannels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannels(prev => [...prev, channel]);
                              } else {
                                setSelectedChannels(prev => prev.filter(c => c !== channel));
                              }
                            }}
                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-zinc-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`remind-${channel}`} className="text-[10px] text-zinc-600 uppercase block font-bold cursor-pointer">
                            {channel}
                          </label>
                        </div>
                      ))
                    ) : (
                      ["dashboard", "whatsapp", "sms", "email"].map(channel => (
                        <div key={channel} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`remind-${channel}`}
                            checked={selectedChannels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannels(prev => [...prev, channel]);
                              } else {
                                setSelectedChannels(prev => prev.filter(c => c !== channel));
                              }
                            }}
                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-zinc-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`remind-${channel}`} className="text-[10px] text-zinc-600 uppercase block font-bold cursor-pointer">
                            {channel}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRemindModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Send Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL 3: CREATE FEE STRUCTURE
            ======================================================== */}
        {isStructureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaPlus className="text-violet-500" /> Create Fee Structure
                </h3>
                <button onClick={() => setIsStructureModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStructure} className="p-6 space-y-4 text-xs font-semibold">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Structure Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Term 1 Tuition Fee"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Standard Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={structureAmount}
                    onChange={(e) => setStructureAmount(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Billing Frequency *</label>
                  <select
                    value={structureFrequency}
                    onChange={(e) => setStructureFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class Association (Optional)</label>
                  <select
                    value={structureClassId}
                    onChange={(e) => setStructureClassId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none focus:border-violet-500"
                  >
                    <option value="">Apply to all classes</option>
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
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsStructureModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Structure"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}