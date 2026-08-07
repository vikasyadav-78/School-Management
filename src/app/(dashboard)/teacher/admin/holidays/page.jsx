"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaUmbrellaBeach, FaTrash, FaCalendarAlt
} from "react-icons/fa";
import { 
  getTeacherManageHolidays,
  addTeacherManageHoliday,
  deleteTeacherManageHoliday
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherManageHolidaysPage() {
  const dialog = useAppDialog();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Creation Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  // 1. Load Holidays
  const loadHolidays = async () => {
    try {
      setLoading(true);
      const listData = await getTeacherManageHolidays();
      setHolidays(listData.holidays || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load holidays manager: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  // Clean form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFromDate("");
    setToDate("");
    setSendEmail(true);
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !description.trim() || !fromDate || !toDate) {
      setFormError("All fields are required.");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setFormError("To Date must be on or after From Date.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        from_date: fromDate,
        to_date: toDate,
        send_email: sendEmail
      };

      await addTeacherManageHoliday(payload);
      toast.success("Holiday announced successfully!");
      setIsFormModalOpen(false);
      loadHolidays();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to announce holiday.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (holidayId) => {
    const isConfirmed = await dialog.confirm({
      title: "Remove Holiday",
      message: "Are you sure you want to remove this holiday announcement?",
      type: "delete",
      confirmText: "Remove",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteTeacherManageHoliday(holidayId);
      toast.success("Holiday removed successfully!");
      loadHolidays();
    } catch (err) {
      toast.error("Failed to remove holiday: " + (err.message || err));
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
          Holidays feature is not enabled for your account. Contact school admin.
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
          title="Announce Holidays Center"
          subtitle="Provision holidays, breaks, and vacations to the school calendar with notifications."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Announce Holiday
        </button>
      </div>

      {/* Roster Listing Grid */}
      {holidays.length === 0 ? (
        <EmptyState 
          title="No Holidays Announced"
          desc="Create a vacation or diwali festival break event here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holidays.map((holiday) => (
            <div key={holiday.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="inline-flex px-2 py-0.5 rounded-lg border border-violet-100 bg-violet-50 text-[8px] font-black text-violet-600 uppercase tracking-wider">
                    Holiday Event
                  </span>
                  <button
                    onClick={() => handleDelete(holiday.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Remove Holiday"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-extrabold text-zinc-800 text-sm mb-1.5">{holiday.title}</h4>
                <p className="text-zinc-500 font-semibold leading-relaxed mb-4">{holiday.description}</p>
              </div>

              <div className="border-t border-zinc-100 pt-3 flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                <FaCalendarAlt className="w-3 h-3 text-zinc-400" />
                <span>{holiday.from_date_label || holiday.from_date}</span>
                <span>to</span>
                <span>{holiday.to_date_label || holiday.to_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announce Holiday Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaUmbrellaBeach className="text-violet-500" />
                Announce Calendar Holiday
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Holiday Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Break"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Announce vacation details or festival description..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">From Date</label>
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">To Date</label>
                  <input 
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="sendEmailCheckbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300 cursor-pointer"
                />
                <label htmlFor="sendEmailCheckbox" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">Dispatch Announcement Email</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  {submitting ? "Saving..." : "Announce Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
