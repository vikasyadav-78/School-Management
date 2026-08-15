"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  getSchools,
  getSchoolMeta,
  createSchool,
  toggleSchoolStatus,
  deleteSchool,
  provisionSchoolAdmin
} from "@/features/super-admin/services/super-admin.service";
import { toast } from "sonner";
import {
  FaPlus,
  FaBuilding,
  FaSearch,
  FaTimes,
  FaKey,
  FaTrash,
  FaEye,
  FaSpinner,
  FaCloudUploadAlt
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";

export default function SuperAdminSchoolsPage() {
  const router = useRouter();
  const dialog = useAppDialog();

  const [schools, setSchools] = useState([]);
  const [meta, setMeta] = useState({ plans: [], document_types: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Add School Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    mobile: "",
    principal_name: "",
    city: "",
    state: "",
    country: "India",
    subscription_plan_id: "",
    is_active: "1",
    primary_color: "#4f46e5",
    secondary_color: "#06b6d4",
    default_theme_mode: "light",
    login_welcome_text: "Welcome to School Management System",
    footer_text: "Powered by TrishPay"
  });

  // File uploads
  const [logoFile, setLogoFile] = useState(null);

  const fetchMeta = async () => {
    try {
      const res = await getSchoolMeta();
      setMeta(res);
      if (res.plans?.length > 0) {
        setFormData((prev) => ({ ...prev, subscription_plan_id: res.plans[0].id }));
      }
    } catch (err) {
      console.error("Meta fetch error:", err);
    }
  };

  const fetchSchoolsList = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: selectedStatus || undefined,
        subscription_plan_id: selectedPlan || undefined,
        page: currentPage,
        per_page: pageSize
      };
      const res = await getSchools(params);
      setSchools(res.schools || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      toast.error("Failed to load schools: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchSchoolsList();
  }, [searchTerm, selectedPlan, selectedStatus, currentPage]);

  const handleToggleStatus = async (schoolId, currentStatus) => {
    const confirmed = await dialog.confirm({
      type: "warning",
      title: `${currentStatus ? "Deactivate" : "Activate"} School`,
      message: `Are you sure you want to change the status of this school?`
    });

    if (!confirmed) return;

    try {
      await toggleSchoolStatus(schoolId);
      toast.success("School status toggled successfully!");
      fetchSchoolsList();
    } catch (err) {
      toast.error("Failed to toggle school status: " + (err.message || err));
    }
  };

  const handleDeleteSchool = async (schoolId, schoolName) => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete School",
      message: `Are you sure you want to soft delete "${schoolName}"? This action can be undone by restoring the database record.`
    });

    if (!confirmed) return;

    try {
      await deleteSchool(schoolId);
      toast.success("School deleted successfully!");
      fetchSchoolsList();
    } catch (err) {
      toast.error("Failed to delete school: " + (err.message || err));
    }
  };

  const handleProvisionAdmin = async (schoolId) => {
    try {
      const res = await provisionSchoolAdmin(schoolId);
      if (res.success && res.school_login?.created) {
        await dialog.alert({
          type: "success",
          title: "Admin Provisioned Successfully",
          message: `Login Email: ${res.school_login.email}\nPassword: ${res.school_login.password}\n\nPlease share these credentials with the school admin.`
        });
      } else {
        toast.info(res.message || "Admin account already exists.");
      }
    } catch (err) {
      toast.error("Failed to provision admin: " + (err.message || err));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (logoFile) {
        data.append("logo", logoFile);
      }

      const res = await createSchool(data);
      toast.success("School created successfully!");
      setShowAddModal(false);

      setFormData({
        name: "",
        code: "",
        email: "",
        phone: "",
        mobile: "",
        principal_name: "",
        city: "",
        state: "",
        country: "India",
        subscription_plan_id: meta.plans?.[0]?.id || "",
        is_active: "1",
        primary_color: "#4f46e5",
        secondary_color: "#06b6d4",
        default_theme_mode: "light",
        login_welcome_text: "Welcome to School Management System",
        footer_text: "Powered by TrishPay"
      });
      setLogoFile(null);

      if (res.school_login?.created) {
        await dialog.alert({
          type: "success",
          title: "Admin Credentials Generated",
          message: `Email: ${res.school_login.email}\nPassword: ${res.school_login.password}`
        });
      }

      fetchSchoolsList();
    } catch (err) {
      toast.error("Failed to create school: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left w-full">
        {/* Page Header */}
        <PageHeader
          title="Colleges & Schools Directory"
          description="Manage registered institutions, subscription tiers, administrative provisioning, and branding settings."
          action={
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-2 text-sm font-semibold shadow-sm px-4 py-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="w-3.5 h-3.5" /> Create School
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
                  placeholder="Name, code, city, email..."
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
                Subscription Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Plans</option>
                {(meta.plans || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
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
                  setSelectedPlan("");
                  setSelectedStatus("");
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* School Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <PageLoader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-4">School / Institution</th>
                    <th className="py-4 px-4">Code</th>
                    <th className="py-4 px-4">Contact Email</th>
                    <th className="py-4 px-4">Subscription</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 italic text-sm">
                        No institutions registered yet. Click &quot;Create School&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    schools.map((school) => (
                      <tr
                        key={school.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* School Info */}
                        <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            {school.logo_url ? (
                              <img
                                src={school.logo_url}
                                alt="Logo"
                                className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-1 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center font-bold text-sm shrink-0">
                                {school.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 block text-sm">
                                {school.name}
                              </span>
                              <span className="text-xs text-slate-500 block font-normal mt-0.5">
                                {school.city ? `${school.city}, ` : ""}{school.state || "India"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-600">
                          {school.code || "—"}
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                          {school.email}
                        </td>

                        {/* Subscription */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-900 block text-sm">
                              {school.subscription_plan?.name || "No Plan"}
                            </span>
                            <span className="text-xs text-slate-500 block font-normal mt-0.5">
                              Ends: {school.subscription_ends_at || "Lifetime / Free"}
                            </span>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleStatus(school.id, school.is_active)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              school.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 hover:bg-slate-200"
                            }`}
                          >
                            {school.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Action Buttons with Icon + Label */}
                        <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/super-admin/schools/${school.id}`)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 transition-colors"
                            >
                              <FaEye className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleProvisionAdmin(school.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors"
                            >
                              <FaKey className="w-3 h-3 text-amber-600" />
                              <span>Admin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-colors"
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

        {/* Create School Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center text-base">
                    <FaBuilding />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Create School Registration
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provision a new institution workspace
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateSchool} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        School/College Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Delhi Public School"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Unique Code <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleFormChange}
                        placeholder="e.g. DPS01"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="admin@school.com"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Mobile / Phone
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleFormChange}
                        placeholder="9876543210"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Principal Name
                      </label>
                      <input
                        type="text"
                        name="principal_name"
                        value={formData.principal_name}
                        onChange={handleFormChange}
                        placeholder="Dr. John Doe"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleFormChange}
                        placeholder="Jaipur"
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Subscription & Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Active Plan <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="subscription_plan_id"
                        required
                        value={formData.subscription_plan_id}
                        onChange={handleFormChange}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        {(meta.plans || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₹{p.price}/{p.billing_cycle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Initial Status
                      </label>
                      <select
                        name="is_active"
                        value={formData.is_active}
                        onChange={handleFormChange}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Theme & Branding Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Theme & Branding
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="primary_color"
                          value={formData.primary_color}
                          onChange={handleFormChange}
                          className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                        />
                        <span className="text-xs font-mono text-slate-600 uppercase">
                          {formData.primary_color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="secondary_color"
                          value={formData.secondary_color}
                          onChange={handleFormChange}
                          className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                        />
                        <span className="text-xs font-mono text-slate-600 uppercase">
                          {formData.secondary_color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Default Mode
                      </label>
                      <select
                        name="default_theme_mode"
                        value={formData.default_theme_mode}
                        onChange={handleFormChange}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    School Logo
                  </h4>
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 hover:border-violet-300 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FaCloudUploadAlt className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        {logoFile ? (
                          <span className="text-violet-600">{logoFile.name}</span>
                        ) : (
                          "Click or drag logo file here"
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or SVG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Submit Area */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-4 py-2"
                    onClick={() => setShowAddModal(false)}
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
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create School"
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