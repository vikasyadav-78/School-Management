"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  getPlans,
  getPlansMeta,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  getPlanDetails
} from "@/features/super-admin/services/super-admin.service";
import { toast } from "sonner";
import {
  FaPlus,
  FaFileContract,
  FaSearch,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaBoxes
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";

export default function SuperAdminPlansPage() {
  const dialog = useAppDialog();

  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState({ billing_cycles: [], features: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Add/Edit Plan Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_cycle: "yearly",
    duration_days: "365",
    max_students: "",
    max_teachers: "",
    is_active: true
  });
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const fetchMeta = async () => {
    try {
      const res = await getPlansMeta();
      setMeta(res || { billing_cycles: ["monthly", "yearly"], features: [] });
    } catch (err) {
      console.error("Meta fetch error:", err);
      // Fallbacks
      setMeta({
        billing_cycles: ["monthly", "yearly"],
        features: [
          { key: "students", label: "Students" },
          { key: "teachers", label: "Teachers" },
          { key: "fees", label: "Fees" },
          { key: "attendance", label: "Attendance" },
          { key: "exams", label: "Exams" }
        ]
      });
    }
  };

  const fetchPlansList = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: selectedStatus || undefined,
        billing_cycle: selectedCycle || undefined,
        page: currentPage,
        per_page: pageSize
      };
      const res = await getPlans(params);
      setPlans(res.plans || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      toast.error("Failed to load plans: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchPlansList();
  }, [searchTerm, selectedCycle, selectedStatus, currentPage]);

  const handleToggleStatus = async (planId, currentStatus) => {
    const confirmed = await dialog.confirm({
      type: "warning",
      title: `${currentStatus ? "Deactivate" : "Activate"} Plan`,
      message: `Are you sure you want to toggle the status of this plan?`
    });

    if (!confirmed) return;

    try {
      await togglePlanStatus(planId);
      toast.success("Plan status toggled successfully!");
      fetchPlansList();
    } catch (err) {
      toast.error("Failed to toggle plan status: " + (err.message || err));
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Plan",
      message: `Are you sure you want to delete "${planName}"? This action cannot be undone.`
    });

    if (!confirmed) return;

    try {
      await deletePlan(planId);
      toast.success("Plan deleted successfully!");
      fetchPlansList();
    } catch (err) {
      toast.error("Failed to delete plan: " + (err.message || err));
    }
  };

  const handleOpenEdit = async (planId) => {
    try {
      const data = await getPlanDetails(planId);
      const plan = data.plan || data;
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price || "",
        billing_cycle: plan.billing_cycle || "yearly",
        duration_days: plan.duration_days || "365",
        max_students: plan.max_students || "",
        max_teachers: plan.max_teachers || "",
        is_active: plan.is_active ?? true
      });
      setSelectedFeatures(plan.features || []);
      setEditingPlanId(planId);
      setEditMode(true);
      setShowModal(true);
    } catch (err) {
      toast.error("Failed to load plan details: " + (err.message || err));
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      billing_cycle: "yearly",
      duration_days: "365",
      max_students: "",
      max_teachers: "",
      is_active: true
    });
    setSelectedFeatures([]);
    setEditMode(false);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      features: selectedFeatures
    };

    try {
      if (editMode) {
        await updatePlan(editingPlanId, payload);
        toast.success("Plan updated successfully!");
      } else {
        await createPlan(payload);
        toast.success("Plan created successfully!");
      }
      setShowModal(false);
      fetchPlansList();
    } catch (err) {
      toast.error("Failed to save plan: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left w-full">
        {/* Page Header */}
        <PageHeader
          title="Subscription Plans"
          description="Manage pricing tiers, limits, and module feature sets for colleges."
          action={
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-2 text-sm font-semibold shadow-sm px-4 py-2"
              onClick={handleOpenAdd}
            >
              <FaPlus className="w-3.5 h-3.5" /> Create Plan
            </Button>
          }
        />

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Search
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search plan name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Billing Cycle
              </label>
              <select
                value={selectedCycle}
                onChange={(e) => {
                  setSelectedCycle(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Cycles</option>
                {(meta.billing_cycles || ["monthly", "yearly"]).map((cycle) => {
                  const val = typeof cycle === "object" ? cycle.value : cycle;
                  const lbl = typeof cycle === "object" ? cycle.label : cycle;
                  return (
                    <option key={val} value={val} className="capitalize">
                      {lbl}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm font-semibold py-2.5 border-slate-200 hover:bg-slate-50 text-slate-600"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCycle("");
                  setSelectedStatus("");
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Plans Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <PageLoader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[240px]">Plan Name</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Price</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Billing Cycle</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[260px]">Student / Teacher Limits</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap min-w-[100px]">Schools</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Status</th>
                    <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                        No pricing plans defined yet. Click &quot;Create Plan&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Plan Name & Info */}
                        <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                              <FaFileContract className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block text-sm">
                                {plan.name}
                              </span>
                              <span className="text-xs text-slate-500 block font-normal truncate max-w-[220px] mt-0.5">
                                {plan.description || "No description provided"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900 text-sm">
                          ₹{plan.price}
                        </td>

                        {/* Billing Cycle */}
                        <td className="py-4 px-4 whitespace-nowrap capitalize text-sm text-slate-600">
                          {plan.billing_cycle}
                        </td>

                        {/* Limits */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="text-slate-400">Students:</span>{" "}
                          <span className="font-bold text-slate-800 mr-3.5">{plan.max_students || "∞"}</span>
                          <span className="text-slate-400">Teachers:</span>{" "}
                          <span className="font-bold text-slate-800">{plan.max_teachers || "∞"}</span>
                        </td>

                        {/* Schools Count */}
                        <td className="py-4 px-4 whitespace-nowrap text-center text-sm font-semibold text-slate-700">
                          {plan.schools_count ?? 0}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              plan.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 hover:bg-slate-200"
                            }`}
                          >
                            {plan.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Actions with Icon + Label */}
                        <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              title="Edit Plan"
                              onClick={() => handleOpenEdit(plan.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 transition-colors"
                            >
                              <FaEdit className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              title={
                                plan.schools_count > 0
                                  ? "Cannot delete plan with active schools"
                                  : "Delete Plan"
                              }
                              disabled={plan.schools_count > 0}
                              onClick={() => handleDeletePlan(plan.id, plan.name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FaTrash className="w-3 h-3 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalCount > pageSize && (
            <div className="px-6 py-4 border-t border-slate-100 bg-white">
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center text-base">
                    <FaBoxes />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {editMode ? "Edit Subscription Plan" : "Create Pricing Tier"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure package pricing, module limits, and access privileges
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSavePlan} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Plan Meta & Pricing */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Plan Meta & Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Plan Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Starter, Premium"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Price (INR) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleFormChange}
                        placeholder="9999"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Billing Cycle <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="billing_cycle"
                        required
                        value={formData.billing_cycle}
                        onChange={handleFormChange}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        name="duration_days"
                        value={formData.duration_days}
                        onChange={handleFormChange}
                        placeholder={formData.billing_cycle === "yearly" ? "365" : "30"}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Enrollment & Team Limits */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Enrollment & Team Limits
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Max Students Limit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="max_students"
                        required
                        min="1"
                        value={formData.max_students}
                        onChange={handleFormChange}
                        placeholder="1000"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Max Teachers Limit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="max_teachers"
                        required
                        min="1"
                        value={formData.max_teachers}
                        onChange={handleFormChange}
                        placeholder="100"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter brief description of package features..."
                    className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                  />
                </div>

                {/* Features Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Included Core Modules
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(meta.features || []).map((feature) => {
                      const keyName = feature.key || feature;
                      const labelName = feature.label || feature.toUpperCase();
                      const isChecked = selectedFeatures.includes(keyName);

                      return (
                        <label
                          key={keyName}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-violet-300 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFeatures([...selectedFeatures, keyName]);
                              } else {
                                setSelectedFeatures(
                                  selectedFeatures.filter((f) => f !== keyName)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                          />
                          <span className="text-xs font-semibold text-slate-700 capitalize">
                            {labelName}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Active Toggle Checkbox */}
                <div className="flex items-center gap-2.5 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20 cursor-pointer"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Active plan (visible to institutions during creation & renewal)
                  </label>
                </div>

                {/* Submit Area */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-4 py-2"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Plan"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}