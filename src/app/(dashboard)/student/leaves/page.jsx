"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaCalendarPlus,
  FaTimes
} from "react-icons/fa";
import { fetchStudentLeaves, applyStudentLeave } from "@/features/students/redux/studentThunk";
import { toast } from "sonner";

export default function StudentLeavesPage() {
  const dispatch = useDispatch();
  const { leaves, loading, error } = useSelector((state) => state.students);

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(fetchStudentLeaves());
  }, [dispatch]);

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

    // Check for overlapping existing leave requests
    const records = leaves?.leaves || [];
    const newFrom = new Date(fromDate).getTime();
    const newTo = new Date(toDate).getTime();
    const overlappingLeave = records.find((leave) => {
      if (leave.status === "rejected") return false;
      const existingFrom = new Date(leave.from_date).getTime();
      const existingTo = new Date(leave.to_date).getTime();
      return newFrom <= existingTo && newTo >= existingFrom;
    });

    if (overlappingLeave) {
      const msg = `A leave request already exists for selected dates (${overlappingLeave.from_date} to ${overlappingLeave.to_date}). Please choose different dates.`;
      setFormError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim()
      };

      await dispatch(applyStudentLeave(payload)).unwrap();

      toast.success("Leave application submitted successfully!");
      setIsModalOpen(false);

      // Reset form
      setFromDate("");
      setToDate("");
      setReason("");

      // Refresh list
      dispatch(fetchStudentLeaves());
    } catch (err) {
      setFormError(err || "Failed to submit leave request.");
      toast.error(err || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !leaves) {
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

  const stats = leaves?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };
  const records = leaves?.leaves || [];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Leave Requests"
          description="Submit and track your formal leave applications and approval logs."
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="sm"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm self-start sm:self-auto"
        >
          <FaCalendarPlus className="w-3.5 h-3.5" />
          Apply Leave
        </Button>
      </div>

      {/* Summary Cards - Centered & Colored Format */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Requests
          </span>
          <h3 className="text-2xl font-black text-zinc-800 mt-1">
            {stats.total || 0}
          </h3>
        </div>

        {/* Pending */}
        <div className="bg-amber-50 border border-amber-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Pending
          </span>
          <h3 className="text-2xl font-black text-amber-700 mt-1">
            {stats.pending || 0}
          </h3>
        </div>

        {/* Approved */}
        <div className="bg-emerald-50 border border-emerald-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Approved
          </span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">
            {stats.approved || 0}
          </h3>
        </div>

        {/* Rejected */}
        <div className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl text-center">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Rejected
          </span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">
            {stats.rejected || 0}
          </h3>
        </div>
      </div>

      {/* Leaves History Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Leave Application Logs
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4 whitespace-nowrap min-w-[140px]">Applied Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Leave From</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Leave To</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[90px]">Days</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Reason</th>
                <th className="py-3.5 pl-4 pr-6 whitespace-nowrap min-w-[180px]">Admin Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
              {records.map((r) => {
                const statusStr = r.status || "Pending";
                let badgeClass = "bg-zinc-50 text-zinc-500 border-zinc-200";
                let StatusIcon = FaHourglassHalf;

                if (statusStr.toLowerCase() === "approved") {
                  badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  StatusIcon = FaCheckCircle;
                } else if (
                  statusStr.toLowerCase() === "rejected" ||
                  statusStr.toLowerCase() === "cancelled"
                ) {
                  badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                  StatusIcon = FaTimesCircle;
                } else {
                  badgeClass = "bg-amber-50 text-amber-600 border-amber-100";
                  StatusIcon = FaHourglassHalf;
                }

                return (
                  <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 pl-6 pr-4 font-bold text-zinc-800 whitespace-nowrap">
                      {r.created_at_label || r.applied_date || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-xs whitespace-nowrap">
                      {r.from_date || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-xs whitespace-nowrap">
                      {r.to_date || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-800 whitespace-nowrap">
                      {r.total_days || r.days || 0}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        {statusStr}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate text-xs" title={r.reason}>
                      {r.reason || r.details || "—"}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-zinc-500 font-normal text-xs whitespace-nowrap">
                      {r.admin_remarks || "—"}
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                  <FaCalendarPlus />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 text-sm">Apply for Leave</h3>
                  <p className="text-[11px] text-zinc-400">Submit a formal request to school admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Leave From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setFormError("");
                    }}
                    className="w-full border border-zinc-200 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-50 focus:bg-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Leave To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setFormError("");
                    }}
                    className="w-full border border-zinc-200 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-50 focus:bg-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Total Days Calculated
                </label>
                <div className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-extrabold text-sm flex items-center justify-between">
                  <span>{totalDays} Days</span>
                  {totalDays > 0 && (
                    <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Valid Range
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Provide details about the leave requirement..."
                  className="w-full border border-zinc-200 p-3 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 bg-zinc-50 focus:bg-white focus:outline-none focus:border-violet-500 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 text-xs font-semibold border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="w-1/2 py-2 text-xs font-semibold shadow-sm inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}