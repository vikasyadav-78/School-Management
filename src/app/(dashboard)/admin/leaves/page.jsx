"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaTimes,
  FaCheck,
  FaBan,
  FaCalendarAlt,
  FaClipboardCheck,
  FaSearch
} from "react-icons/fa";
import {
  getAdminManageLeaves,
  approveAdminManageLeave,
  rejectAdminManageLeave,
  getAdminManageLeavesMeta
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AdminManageLeavesPage() {
  const dialog = useAppDialog();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [typeOptions, setTypeOptions] = useState([
    { value: "all", label: "All Applicants" },
    { value: "student", label: "Students" },
    { value: "teacher", label: "Teachers" }
  ]);
  const [statusOptions, setStatusOptions] = useState([
    { value: "all", label: "All Applications" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" }
  ]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  const [activeLeave, setActiveLeave] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("approve");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMeta = async () => {
    try {
      const metaData = await getAdminManageLeavesMeta();
      if (metaData?.types?.length) {
        setTypeOptions(metaData.types);
      }
      if (metaData?.statuses?.length) {
        setStatusOptions(metaData.statuses);
      }
    } catch (err) {
      console.warn("Admin leave meta request did not return a usable payload:", err);
    }
  };

  const fetchLeaves = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setListLoading(true);

      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const listData = await getAdminManageLeaves(params);
      const nextLeaves = listData.leaves || listData.data || (Array.isArray(listData) ? listData : []);
      setLeaves(nextLeaves);
    } catch (err) {
      if (isInitial && (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403")))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load leave applications: " + (err.message || err));
      }
    } finally {
      if (isInitial) setLoading(false);
      else setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchLeaves(true);
  }, [typeFilter, statusFilter]);

  const handleOpenAction = (leave, type) => {
    setActiveLeave(leave);
    setActionType(type);
    setRemarks("");
    setIsActionModalOpen(true);
  };

  const handleProcessAction = async (e) => {
    e.preventDefault();
    if (!activeLeave) return;

    const confirmed = await dialog.confirm({
      title: actionType === "approve" ? "Approve Leave" : "Reject Leave",
      message: actionType === "approve"
        ? "Are you sure you want to approve this leave application?"
        : "Are you sure you want to reject this leave application?",
      type: actionType === "approve" ? "info" : "delete",
      confirmText: actionType === "approve" ? "Approve" : "Reject",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      const payload = { admin_remarks: remarks.trim() };

      if (actionType === "approve") {
        await approveAdminManageLeave(activeLeave.id, payload);
        toast.success("Leave application approved successfully!");
      } else {
        await rejectAdminManageLeave(activeLeave.id, payload);
        toast.success("Leave application rejected successfully!");
      }

      setIsActionModalOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update leave application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
            <FaTimes className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-500 font-bold leading-relaxed mt-2">
            Leave feature is not enabled for your account. Contact school admin.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  // Local Search & Stats Calculations
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeaves = leaves.filter((leave) => {
    const term = searchTerm.toLowerCase().trim();
    const applicantName = (leave.applicant_name || leave.student_name || leave.teacher_name || leave.name || "").toLowerCase();
    const reason = (leave.reason || "").toLowerCase();
    const type = (leave.leave_type || leave.type || "").toLowerCase();
    return !term || applicantName.includes(term) || reason.includes(term) || type.includes(term);
  });

  const totalCount = leaves.length;
  const pendingCount = leaves.filter(l => String(l.status || l.status_label || "").toLowerCase() === "pending").length;
  const approvedCount = leaves.filter(l => String(l.status || l.status_label || "").toLowerCase() === "approved").length;
  const rejectedCount = leaves.filter(l => String(l.status || l.status_label || "").toLowerCase() === "rejected").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader
          title="Leave Approval Desk"
          subtitle="Manage and evaluate leave applications submitted by student pupils and teachers staff."
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Requests</span>
            <span className="text-2xl font-extrabold text-zinc-800 mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Pending
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{pendingCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Approved
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{approvedCount}</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Rejected
            </span>
            <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{rejectedCount}</span>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Search Applicant / Reason</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <FaSearch className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by name, reason or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Applicant Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-20">
            <PageLoader />
          </div>
        ) : filteredLeaves.length === 0 ? (
          <EmptyState
            title="No Leave Applications Found"
            desc="Try adjusting your filters or search query."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4 whitespace-nowrap">Applicant</th>
                    <th className="px-6 py-4 whitespace-nowrap">Type / Reason</th>
                    <th className="px-6 py-4 whitespace-nowrap">Leave Schedule</th>
                    <th className="px-6 py-4 whitespace-nowrap">Total Days</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                  {filteredLeaves.map((leave) => {
                    const applicantType = String(leave.applicant_type || leave.user_type || "student").toLowerCase();
                    const applicantTypeLabel = leave.applicant_type_label || (applicantType === "student" ? "Student" : applicantType === "teacher" ? "Teacher" : "Applicant");
                    const applicantName = leave.applicant_name || leave.student_name || leave.teacher_name || leave.name || "Applicant";
                    const applicantDetail = leave.applicant_detail || "";
                    const fromDateText = leave.from_date_label || leave.from_date || "—";
                    const toDateText = leave.to_date_label || leave.to_date || "—";
                    const statusText = leave.status_label || leave.status || "Pending";
                    const statusKey = String(statusText).toLowerCase();
                    const canApprove = leave.can_approve !== false;
                    const canReject = leave.can_reject !== false;

                    return (
                      <tr key={leave.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs">
                              {applicantName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-800 block">
                                {applicantName}
                              </span>
                              <span className="text-[9px] text-zinc-400 uppercase font-black tracking-wider block">
                                {applicantTypeLabel}
                              </span>
                              {applicantDetail ? (
                                <span className="text-[9px] text-zinc-400 font-semibold block">
                                  {applicantDetail}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-zinc-800 block capitalize">{leave.leave_type || leave.type || "Casual"}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold block line-clamp-1 max-w-[200px]">
                            {leave.reason || "No reason submitted"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-600">
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-zinc-400 w-3 h-3" />
                            <span>{fromDateText}</span>
                            <span className="text-zinc-400 font-medium">to</span>
                            <span>{toDateText}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-zinc-800">
                          {leave.days || leave.days_count || leave.total_days || 1} Days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                            statusKey === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            statusKey === "rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
                            statusKey === "pending" ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                            "bg-zinc-50 text-zinc-500 border-zinc-200"
                          }`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {statusKey === "pending" ? (
                            <div className="flex items-center justify-center gap-2">
                              {canApprove ? (
                                <button
                                  onClick={() => handleOpenAction(leave, "approve")}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                  title="Approve Leave"
                                >
                                  <FaCheck className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                              {canReject ? (
                                <button
                                  onClick={() => handleOpenAction(leave, "reject")}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Reject Leave"
                                >
                                  <FaBan className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isActionModalOpen && activeLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaClipboardCheck className="text-violet-500" />
                  {actionType === "approve" ? "Approve Application" : "Reject Application"}
                </h3>
                <button
                  onClick={() => setIsActionModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleProcessAction} className="p-6 space-y-4">
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 text-[11px] text-zinc-500 font-bold leading-normal">
                  <div className="flex justify-between">
                    <span>Applicant</span>
                    <span className="text-zinc-800 font-black">{activeLeave.applicant_name || activeLeave.student_name || activeLeave.teacher_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="text-zinc-800 font-black">{activeLeave.from_date} to {activeLeave.to_date}</span>
                  </div>
                  <div className="border-t border-zinc-200/50 pt-2 text-zinc-500">
                    <span className="text-[9px] uppercase tracking-wide block mb-0.5">Reason:</span>
                    <p className="normal-case font-semibold text-zinc-700 italic">"{activeLeave.reason || 'No reason submitted'}"</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Decision Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide approval / rejection comments..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer text-xs ${
                      actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400" : "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400"
                    }`}
                  >
                    {submitting ? "Processing..." : (actionType === "approve" ? "Confirm Approve" : "Confirm Reject")}
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