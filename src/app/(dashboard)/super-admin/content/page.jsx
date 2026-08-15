"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  getPlatformContent,
  getPlatformContentMeta,
  createPlatformContent,
  togglePlatformContentStatus,
  deletePlatformContent,
  getPlatformContentDetails
} from "@/features/super-admin/services/super-admin.service";
import { toast } from "sonner";
import {
  FaCloudUploadAlt,
  FaSearch,
  FaTimes,
  FaDownload,
  FaTrash,
  FaEye,
  FaSpinner,
  FaFilePdf,
  FaPlusCircle,
  FaMinusCircle
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";

export default function SuperAdminContentPage() {
  const dialog = useAppDialog();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ content_types: {}, schools: [], classes: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  // Upload Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "notes"
  });
  const [uploadedFile, setUploadedFile] = useState(null);

  // Distributions State: array of { school_id, school_class_id }
  const [distributions, setDistributions] = useState([{ school_id: "", school_class_id: "" }]);

  const fetchMeta = async () => {
    try {
      const res = await getPlatformContentMeta();
      setMeta({
        content_types: res.content_types || { notes: "Class Notes", exam_questions: "Exam Question Papers" },
        schools: res.schools || res.active_schools || [],
        classes: res.classes || []
      });
    } catch (err) {
      console.error("Meta fetch error:", err);
      setMeta({
        content_types: { notes: "Class Notes", exam_questions: "Exam Question Papers" },
        schools: [],
        classes: []
      });
    }
  };

  const fetchContentList = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        content_type: selectedType || undefined,
        status: selectedStatus || undefined,
        page: currentPage,
        per_page: pageSize
      };
      const res = await getPlatformContent(params);
      setItems(res.items || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      toast.error("Failed to load platform content: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchContentList();
  }, [searchTerm, selectedType, selectedStatus, currentPage]);

  const handleToggleStatus = async (id, currentStatus) => {
    const confirmed = await dialog.confirm({
      type: "warning",
      title: `${currentStatus ? "Deactivate" : "Activate"} Content`,
      message: `Are you sure you want to toggle the status of this distributed content?`
    });

    if (!confirmed) return;

    try {
      await togglePlatformContentStatus(id);
      toast.success("Content status toggled successfully!");
      fetchContentList();
    } catch (err) {
      toast.error("Failed to toggle content status: " + (err.message || err));
    }
  };

  const handleDeleteContent = async (id, title) => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Distributed Content",
      message: `Are you sure you want to delete "${title}"? This will delete the content and revoke its distribution in all colleges.`
    });

    if (!confirmed) return;

    try {
      await deletePlatformContent(id);
      toast.success("Content deleted successfully!");
      fetchContentList();
    } catch (err) {
      toast.error("Failed to delete content: " + (err.message || err));
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await getPlatformContentDetails(id);
      setSelectedItemDetails(res.item || res);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Failed to load details: " + (err.message || err));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleAddDistribution = () => {
    setDistributions([...distributions, { school_id: "", school_class_id: "" }]);
  };

  const handleRemoveDistribution = (index) => {
    setDistributions(distributions.filter((_, i) => i !== index));
  };

  const handleDistributionChange = (index, field, value) => {
    const updated = [...distributions];
    updated[index][field] = value;
    if (field === "school_id") {
      updated[index]["school_class_id"] = "";
    }
    setDistributions(updated);
  };

  const handleUploadAndDistribute = async (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error("Please select a PDF file to upload.");
      return;
    }

    const validDistributions = distributions.filter((d) => d.school_id);
    if (validDistributions.length === 0) {
      toast.error("Please add at least one school distribution target.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("content_type", formData.content_type);
      data.append("file", uploadedFile);

      const formattedDistributions = validDistributions.map((d) => ({
        school_id: d.school_id,
        school_class_id: d.school_class_id || null
      }));
      data.append("distributions", JSON.stringify(formattedDistributions));

      await createPlatformContent(data);
      toast.success("Content uploaded and distributed successfully!");
      setShowAddModal(false);

      setFormData({ title: "", description: "", content_type: "notes" });
      setUploadedFile(null);
      setDistributions([{ school_id: "", school_class_id: "" }]);

      fetchContentList();
    } catch (err) {
      toast.error("Upload failed: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left w-full">
        {/* Page Header */}
        <PageHeader
          title="Platform Content Distribution"
          description="Distribute core class notes and exam question papers to selected schools and classes."
          action={
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-2 text-sm font-semibold shadow-sm px-4 py-2"
              onClick={() => {
                fetchMeta();
                setShowAddModal(true);
              }}
            >
              <FaCloudUploadAlt className="w-4 h-4" /> Upload & Distribute
            </Button>
          }
        />

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Search Content
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search title, description..."
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
                Content Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                {Array.isArray(meta.content_types)
                  ? meta.content_types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))
                  : Object.keys(meta.content_types).map((k) => {
                      const val = typeof meta.content_types[k] === "object" ? meta.content_types[k].value || k : k;
                      const lbl = typeof meta.content_types[k] === "object" ? meta.content_types[k].label : meta.content_types[k];
                      return (
                        <option key={val} value={val}>
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
                  setSelectedType("");
                  setSelectedStatus("");
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <PageLoader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-4">Content Item</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Publisher</th>
                    <th className="py-4 px-4 text-center">Distributions</th>
                    <th className="py-4 px-4">Created Date</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                        No content papers distributed yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Content Title & Icon */}
                        <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
                              <FaFilePdf className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block text-sm">
                                {item.title}
                              </span>
                              <span className="text-xs text-slate-500 block font-normal truncate max-w-[220px] mt-0.5">
                                {item.description || "No description provided"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
                            {item.content_type_label || item.content_type}
                          </span>
                        </td>

                        {/* Publisher */}
                        <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {item.uploaded_by || "Super Admin"}
                        </td>

                        {/* Distributions */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className="font-semibold text-slate-900 text-sm">
                            {item.distributions_count || 0}
                          </span>{" "}
                          <span className="text-xs text-slate-500">Schools</span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                          {item.created_at_label || item.created_at?.split("T")[0]}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.is_active)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20 hover:bg-slate-200"
                            }`}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Actions with Icon + Label */}
                        <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              title="View distribution logs"
                              onClick={() => handleViewDetails(item.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 transition-colors"
                            >
                              <FaEye className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600" />
                              <span>Logs</span>
                            </button>

                            {item.download_url && (
                              <a
                                href={item.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors"
                              >
                                <FaDownload className="w-3 h-3 text-blue-600" />
                                <span>Download</span>
                              </a>
                            )}

                            <button
                              type="button"
                              title="Delete content distribution"
                              onClick={() => handleDeleteContent(item.id, item.title)}
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

        {/* Upload & Distribute Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center text-base">
                    <FaCloudUploadAlt />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Upload & Distribute Content
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Publish study notes or question papers across institutions
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
              <form onSubmit={handleUploadAndDistribute} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g. Class 10 Physics Midterm"
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="content_type"
                      required
                      value={formData.content_type}
                      onChange={handleFormChange}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                    >
                      {Array.isArray(meta.content_types)
                        ? meta.content_types.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))
                        : Object.keys(meta.content_types).map((k) => {
                            const val = typeof meta.content_types[k] === "object" ? meta.content_types[k].value || k : k;
                            const lbl = typeof meta.content_types[k] === "object" ? meta.content_types[k].label : meta.content_types[k];
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter notes or brief description regarding this document..."
                    className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                  />
                </div>

                {/* PDF File Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Document Attachment (PDF only) <span className="text-red-500">*</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 hover:border-violet-300 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                      <FaFilePdf className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        {uploadedFile ? (
                          <span className="text-emerald-600">
                            {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        ) : (
                          "Click or drag PDF document here"
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 50MB</p>
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Distribution Targets */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Distribution Targets <span className="text-red-500">*</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Select which schools and classes should receive this content
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDistribution}
                      className="text-violet-600 hover:text-violet-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <FaPlusCircle className="w-3.5 h-3.5" /> Add School Target
                    </button>
                  </div>

                  <div className="space-y-3">
                    {distributions.map((target, index) => {
                      const schoolClasses = meta.classes.filter((c) => c.school_id === target.school_id);

                      return (
                        <div
                          key={index}
                          className="flex gap-3 items-end bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80"
                        >
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Target School
                            </label>
                            <select
                              required
                              value={target.school_id}
                              onChange={(e) => handleDistributionChange(index, "school_id", e.target.value)}
                              className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                            >
                              <option value="">Select School</option>
                              {meta.schools.map((school) => (
                                <option key={school.id} value={school.id}>
                                  {school.name} ({school.code})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Target Class (Optional)
                            </label>
                            <select
                              value={target.school_class_id}
                              disabled={!target.school_id}
                              onChange={(e) => handleDistributionChange(index, "school_class_id", e.target.value)}
                              className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:opacity-50"
                            >
                              <option value="">Whole School (All Classes)</option>
                              {schoolClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {distributions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDistribution(index)}
                              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all mb-0.5 border border-red-100"
                            >
                              <FaMinusCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" /> Distributing...
                      </>
                    ) : (
                      <>
                        <FaCloudUploadAlt className="w-4 h-4" /> Distribute Content
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Distribution Details Modal */}
        {showDetailModal && selectedItemDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center">
                    <FaFilePdf className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Distribution Details
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Audit logs & assigned schools list
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-base font-bold text-slate-900">
                    {selectedItemDetails.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {selectedItemDetails.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Target Schools & Classes List
                  </span>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {(selectedItemDetails.distributions || []).map((dist, idx) => (
                      <div
                        key={dist.id || idx}
                        className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs"
                      >
                        <span className="font-semibold text-xs text-slate-800">
                          {dist.school_name || "DPS School"}
                        </span>
                        <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[10px] font-semibold">
                          {dist.target || "Whole School"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close Logs
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}