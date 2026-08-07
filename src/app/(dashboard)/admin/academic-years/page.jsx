"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";


import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaCalendarAlt, FaEdit, FaCheckCircle, FaTrash
} from "react-icons/fa";
import { 
  getTeacherAcademicYears,
  addTeacherAcademicYear,
  updateTeacherAcademicYear,
  setTeacherCurrentAcademicYear,
  deleteTeacherAcademicYear
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherAcademicYearsPage() {
  const dialog = useAppDialog();
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Creation/Edit Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingYearId, setEditingYearId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  // 1. Initial Load
  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      const listData = await getTeacherAcademicYears();
      setAcademicYears(listData.academic_years || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load academic sessions: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Clean form
  const resetForm = () => {
    setName("");
    setStartsAt("");
    setEndsAt("");
    setIsCurrent(false);
    setFormError("");
    setEditingYearId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (year) => {
    resetForm();
    setEditingYearId(year.id);
    setName(year.name || "");
    setStartsAt(year.starts_at || "");
    setEndsAt(year.ends_at || "");
    setIsCurrent(!!year.is_current);
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !startsAt || !endsAt) {
      setFormError("Session Name, Starts At, and Ends At dates are required.");
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError("Ends At date must occur after Starts At date.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        is_current: isCurrent
      };

      if (editingYearId) {
        await updateTeacherAcademicYear(editingYearId, payload);
        toast.success("Academic year session updated successfully!");
      } else {
        await addTeacherAcademicYear(payload);
        toast.success("Academic year session added successfully!");
      }

      setIsFormModalOpen(false);
      loadAcademicYears();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save session details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (yearId) => {
    try {
      setLoading(true);
      await setTeacherCurrentAcademicYear(yearId);
      toast.success("Current academic session updated successfully!");
      loadAcademicYears();
    } catch (err) {
      toast.error("Failed to update current session: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (year) => {
    if (year.is_current) {
      toast.error("You cannot delete the current active academic session.");
      return;
    }

    const confirmDelete = await dialog.confirm({
      title: "Delete Academic Session",
      message: `Are you sure you want to permanently delete the academic year "${year.name}"? This action cannot be undone.`,
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deleteTeacherAcademicYear(year.id);
      toast.success("Academic year session deleted successfully!");
      loadAcademicYears();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete academic session.");
    } finally {
      setLoading(false);
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
          Academic Years feature is not enabled for your account. Contact school admin.
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
      <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Academic Years Manager"
          subtitle="Configure school sessions, set current academic years, and manage calendar periods."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Session Period
        </button>
      </div>

      {/* Roster Listing Grid */}
      {academicYears.length === 0 ? (
        <EmptyState 
          title="No Academic Sessions Configured"
          desc="Get started by announcing a new academic year session block."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Session Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Start Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">End Date</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-700">
                {academicYears.map((year) => (
                  <tr key={year.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                          <FaCalendarAlt className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-zinc-800">{year.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-zinc-600">
                      {year.starts_at}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-zinc-600">
                      {year.ends_at}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {year.is_current ? (
                        <span className="inline-flex px-2.5 py-0.5 text-[8px] font-extrabold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                          Current Year
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 text-[8px] font-bold rounded-lg bg-zinc-50 text-zinc-450 border border-zinc-200 uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(year)}
                          className="p-1.5 hover:bg-violet-50 rounded-lg text-zinc-500 hover:text-violet-600 transition-colors"
                          title="Edit Session Details"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        {!year.is_current && (
                          <>
                            <button
                              onClick={() => handleSetCurrent(year.id)}
                              className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-500 transition-colors"
                              title="Set Current Year"
                            >
                              <FaCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(year)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                              title="Delete Session"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Academic Session Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" />
                {editingYearId ? "Modify Academic Year Session" : "Define New Session Period"}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Session Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2026-2027"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Starts At</label>
                  <input 
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ends At</label>
                  <input 
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="isCurrentCheckbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300 cursor-pointer"
                />
                <label htmlFor="isCurrentCheckbox" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer">Set as Current Session Year</label>
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
                  {submitting ? "Saving..." : (editingYearId ? "Save Updates" : "Create Session")}
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
