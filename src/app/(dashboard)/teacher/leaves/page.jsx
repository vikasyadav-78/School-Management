"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { FaFileAlt, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaCalendarPlus, FaTimes } from "react-icons/fa";
import { fetchTeacherLeaves, applyTeacherLeave } from "@/features/teachers/redux/teacherThunk";
import { toast } from "sonner";

export default function TeacherLeavesPage() {
  const dispatch = useDispatch();
  const { leaves, loading, error } = useSelector((state) => state.teachers);

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Filters state
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (monthFilter) params.month = monthFilter;

    dispatch(fetchTeacherLeaves(params)).then((action) => {
      if (action.payload) {
        console.log("Teacher Leaves API response payload:", action.payload);
        const hasApprovedInBackend = action.payload.records?.some(r => r.status?.toLowerCase() === "approved");
        const hasPendingInBackend = action.payload.records?.some(r => r.status?.toLowerCase() === "pending");
        console.log(`Backend reports: hasApproved=${hasApprovedInBackend}, hasPending=${hasPendingInBackend}. Note: If approved leaves display as Pending, please verify the backend database status.`);
      }
    });
  }, [dispatch, statusFilter, monthFilter]);

  // Calculate leave days automatically when dates change
  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays(fromDate, toDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!fromDate || !toDate || !reason.trim()) {
      setFormError("All fields are required.");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setFormError("The To Date cannot be earlier than the From Date.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim()
      };

      await dispatch(applyTeacherLeave(payload)).unwrap();

      toast.success("Leave application submitted successfully!");
      setIsModalOpen(false);

      // Reset form
      setFromDate("");
      setToDate("");
      setReason("");

      // Refresh list
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (monthFilter) params.month = monthFilter;
      dispatch(fetchTeacherLeaves(params));
    } catch (err) {
      setFormError(err || "Failed to submit leave request.");
      toast.error(err || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load leave requests: {error}
      </div>
    );
  }

  const stats = leaves?.summary || leaves?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 };
  const records = leaves?.leaves || leaves?.records || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Leave Requests"
          subtitle="Submit and track your formal leave applications and approval logs."
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 px-4 font-bold flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <FaCalendarPlus className="w-3.5 h-3.5" />
          Apply Leave
        </Button>
      </div>

      {/* Summary Cards - Centered & Colored Format */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total Requests</span>
          <h3 className="text-2xl font-black text-zinc-800 mt-1">{stats.total}</h3>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending</span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{stats.pending}</h3>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Approved</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.approved}</h3>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Rejected</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">{stats.rejected}</h3>
        </div>
      </div>

      {/* Leaves History Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-xs font-bold text-zinc-700 uppercase">Leave Logs</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 font-bold text-zinc-700 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-40 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 font-bold text-zinc-700 transition-all [color-scheme:dark] cursor-pointer font-mono"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4 whitespace-nowrap">Applied Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Leave From</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Leave To</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Total Days</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Reason</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Admin Remarks</th>
                <th className="py-3.5 pl-4 pr-6 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
              {records.map((r, idx) => {
                const statusStr = r.status_label || r.status || "Pending";
                let badgeClass = "bg-zinc-50 text-zinc-500 border-zinc-200";
                let StatusIcon = FaHourglassHalf;

                if (statusStr.toLowerCase() === "approved") {
                  badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  StatusIcon = FaCheckCircle;
                } else if (statusStr.toLowerCase() === "rejected" || statusStr.toLowerCase() === "cancelled") {
                  badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                  StatusIcon = FaTimesCircle;
                } else {
                  badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                  StatusIcon = FaHourglassHalf;
                }

                return (
                  <tr key={r.id || r._id || idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-bold text-zinc-800 whitespace-nowrap">
                      {r.created_at_label || r.applied_date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono whitespace-nowrap">
                      {r.from_date_label || r.from_date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono whitespace-nowrap">
                      {r.to_date_label || r.to_date || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-800 whitespace-nowrap">
                      {r.days || r.total_days || r.totalDays || 0} Days
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate whitespace-nowrap" title={r.reason}>
                      {r.reason || r.details || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-normal whitespace-nowrap">
                      {r.admin_remarks || "—"}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${badgeClass}`}>
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        {statusStr}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
                    No Leave Requests Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaCalendarPlus className="text-violet-500" />
                Apply for Leave
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Leave From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setFormError("");
                    }}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold text-zinc-800 cursor-pointer font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Leave To Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setFormError("");
                    }}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold text-zinc-800 cursor-pointer font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Days Calculated</label>
                <div className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-extrabold text-sm flex items-center justify-between">
                  <span>{totalDays} Days</span>
                  {totalDays > 0 && (
                    <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Valid Range
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Reason for Leave</label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Provide details about the leave requirement..."
                  className="w-full p-3 border border-zinc-200 rounded-xl outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all font-semibold leading-relaxed text-zinc-800 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 rounded-xl border border-zinc-200 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}