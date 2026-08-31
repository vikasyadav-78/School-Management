"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/services/axios";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import {
  getSchoolDetails,
  updateSchool,
  getSchoolIntegrations,
  updateSchoolIntegrations,
  getSchoolFeatures,
  updateSchoolFeatures,
  renewSchoolSubscription,
  getSchoolDocuments,
  uploadSchoolDocuments,
  deleteSchoolDocument
} from "@/features/super-admin/services/super-admin.service";
import { toast } from "sonner";
import {
  FaArrowLeft, FaBuilding, FaSlidersH, FaLink,
  FaFileContract, FaSave, FaSpinner, FaCloudUploadAlt,
  FaDownload, FaTrash, FaCheck, FaTimes, FaGlobe
} from "react-icons/fa";

export default function SuperAdminSchoolDetailPage() {
  const router = useRouter();
  const { schoolId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // "general" | "features" | "integrations" | "documents"

  // School general details
  const [school, setSchool] = useState({});
  
  // Integration details
  const [integrations, setIntegrations] = useState({});
  
  // Features details
  const [featuresData, setFeaturesData] = useState({ enabled_features: [], all_features: [] });
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  
  // Subscription renew state
  const [renewData, setRenewData] = useState({ subscription_ends_at: "", subscription_plan_id: "" });
  const [plansList, setPlansList] = useState([]);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docMeta, setDocMeta] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});

  const fetchGeneralDetails = async () => {
    try {
      const data = await getSchoolDetails(schoolId);
      setSchool(data.school || {});
      setRenewData({
        subscription_ends_at: data.school?.subscription_ends_at || "",
        subscription_plan_id: data.school?.subscription_plan_id || ""
      });
    } catch (err) {
      toast.error("Failed to load school details: " + (err.message || err));
    }
  };

  const fetchIntegrations = async () => {
    try {
      const data = await getSchoolIntegrations(schoolId);
      setIntegrations(data.integrations || data || {});
    } catch (err) {
      toast.error("Failed to load integrations: " + (err.message || err));
    }
  };

  const fetchFeatures = async () => {
    try {
      const data = await getSchoolFeatures(schoolId);
      setFeaturesData({
        enabled_features: data.enabled_features || [],
        all_features: data.all_features || []
      });
      setSelectedFeatures(data.enabled_features || []);
      setPlansList(data.plans || []);
    } catch (err) {
      toast.error("Failed to load features: " + (err.message || err));
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await getSchoolDocuments(schoolId);
      setDocuments(data.documents || []);
      setDocMeta(data.meta || {});
    } catch (err) {
      toast.error("Failed to load documents: " + (err.message || err));
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchGeneralDetails();
      if (activeTab === "integrations") await fetchIntegrations();
      if (activeTab === "features") await fetchFeatures();
      if (activeTab === "documents") await fetchDocuments();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchAllData();
    }
  }, [schoolId, activeTab]);

  // Tab handlers
  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData(e.target);
      await updateSchool(schoolId, form);
      toast.success("School details updated successfully!");
      fetchGeneralDetails();
    } catch (err) {
      toast.error("Failed to update school: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeatures = async () => {
    setSubmitting(true);
    try {
      await updateSchoolFeatures(schoolId, { enabled_features: selectedFeatures });
      toast.success("Features checklist updated!");
      fetchFeatures();
    } catch (err) {
      toast.error("Failed to update features: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubscription = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await renewSchoolSubscription(schoolId, renewData);
      toast.success("Subscription renewed successfully!");
      fetchGeneralDetails();
      fetchFeatures();
    } catch (err) {
      toast.error("Failed to renew subscription: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIntegrations = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData(e.target);
      const payload = {};
      form.forEach((value, key) => {
        // Convert checkbox state to boolean
        if (key.endsWith("_enabled")) {
          payload[key] = value === "true" || value === "on" || value === "1";
        } else {
          payload[key] = value;
        }
      });
      // Handle unchecked boxes
      ["email_enabled", "sms_enabled", "whatsapp_enabled", "payment_enabled", "microsoft_meet_enabled"].forEach((k) => {
        if (!payload.hasOwnProperty(k)) payload[k] = false;
      });

      await updateSchoolIntegrations(schoolId, payload);
      toast.success("Integrations updated successfully!");
      fetchIntegrations();
    } catch (err) {
      toast.error("Failed to update integrations: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(uploadFiles).forEach((key) => {
        data.append(key, uploadFiles[key]);
      });
      await uploadSchoolDocuments(schoolId, data);
      toast.success("Documents uploaded successfully!");
      setUploadFiles({});
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to upload document: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDoc = async (downloadUrl, filename) => {
    try {
      toast.info("Downloading document, please wait...");
      const response = await axiosInstance.get(downloadUrl, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "document.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download completed successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleDeleteDoc = async (documentId) => {
    try {
      await deleteSchoolDocument(documentId);
      toast.success("Document deleted!");
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to delete document: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-40 flex justify-center items-center">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left text-zinc-800">
        <PageHeader
          title={school.name || "School Details"}
          subtitle={`Branding settings, verification documents, dynamic features, and integrations.`}
          action={
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1.5"
              onClick={() => router.push("/super-admin/schools")}
            >
              <FaArrowLeft className="w-3.5 h-3.5" /> Back to Directory
            </Button>
          }
        />

        {/* Tab Headers */}
        <div className="flex border-b border-zinc-200 text-[12px] font-bold text-zinc-400 uppercase tracking-wider bg-white px-6 py-2 rounded-2xl shadow-sm gap-4">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-2 px-1 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "general" ? "border-violet-500 text-violet-600 font-extrabold" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <FaBuilding /> General Info
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`py-2 px-1 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "features" ? "border-violet-500 text-violet-600 font-extrabold" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <FaSlidersH /> Features & Sub
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`py-2 px-1 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "integrations" ? "border-violet-500 text-violet-600 font-extrabold" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <FaLink /> Integrations
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-2 px-1 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "documents" ? "border-violet-500 text-violet-600 font-extrabold" : "border-transparent hover:text-zinc-600"
            }`}
          >
            <FaFileContract /> Documents
          </button>
        </div>

        {/* General Details Tab */}
        {activeTab === "general" && (
          <form onSubmit={handleUpdateSchool} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
              {school.logo_url ? (
                <img src={school.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-zinc-50 border border-zinc-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-2xl border border-zinc-100">
                  {school.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-base font-extrabold text-zinc-800">{school.name}</h3>
                <p className="text-zinc-400 font-medium">Plan: {school.subscription_plan?.name} · Expires: {school.subscription_ends_at || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">School/College Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={school.name}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Unique Code (optional)</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={school.code}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Contact Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={school.email}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Mobile / Phone</label>
                <input
                  type="text"
                  name="mobile"
                  defaultValue={school.mobile || school.phone}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Principal Name</label>
                <input
                  type="text"
                  name="principal_name"
                  defaultValue={school.principal_name}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={school.city}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  defaultValue={school.state}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={school.country || "India"}
                  className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex justify-end">
              <Button type="submit" variant="primary" size="sm" className="inline-flex items-center gap-1.5" disabled={submitting}>
                {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Features Checklist */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-800">Module Access Checklist</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Turn specific functional features on/off for this school.</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleUpdateFeatures} disabled={submitting}>
                  {submitting ? <FaSpinner className="animate-spin" /> : "Update Access"}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuresData.all_features.map((feature) => {
                  const isChecked = selectedFeatures.includes(feature.key || feature);
                  const keyName = feature.key || feature;
                  const labelName = feature.label || feature.toUpperCase();
                  return (
                    <label key={keyName} className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeatures([...selectedFeatures, keyName]);
                          } else {
                            setSelectedFeatures(selectedFeatures.filter(f => f !== keyName));
                          }
                        }}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20"
                      />
                      <span className="font-semibold text-zinc-700 capitalize">{labelName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Renewal Panel */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <form onSubmit={handleRenewSubscription} className="space-y-4">
                <h3 className="text-sm font-extrabold text-zinc-800 border-b border-zinc-100 pb-3">Renew Subscription</h3>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Select Subscription Plan</label>
                  <select
                    value={renewData.subscription_plan_id}
                    onChange={(e) => setRenewData({ ...renewData, subscription_plan_id: e.target.value })}
                    className="w-full border border-zinc-200 p-2 rounded-xl bg-white outline-none focus:border-violet-500 font-semibold text-zinc-700"
                  >
                    {(plansList || []).map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}/{plan.billing_cycle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-semibold mb-1">New Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={renewData.subscription_ends_at?.split(" ")[0]}
                    onChange={(e) => setRenewData({ ...renewData, subscription_ends_at: e.target.value })}
                    className="w-full border border-zinc-200 p-2 rounded-xl outline-none focus:border-violet-500 font-semibold text-zinc-700"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full justify-center text-center font-bold" disabled={submitting}>
                  {submitting ? <FaSpinner className="animate-spin" /> : "Apply Renewal"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <form onSubmit={handleUpdateIntegrations} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-800">Integrations Config</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Configure Email SMTP, Payment Gateway, SMS settings, and Microsoft Teams integration.</p>
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? <FaSpinner className="animate-spin" /> : "Save Config"}
              </Button>
            </div>

            {/* Email Integrations */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-50 pb-1 flex justify-between">
                <span>Email SMTP Configuration</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="email_enabled" defaultChecked={integrations.email_enabled} className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20" />
                  <span className="font-semibold text-zinc-600 capitalize">Enable SMTP</span>
                </label>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">SMTP Host</label>
                  <input type="text" name="email_host" defaultValue={integrations.email_host} placeholder="smtp.mailtrap.io" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">SMTP Port</label>
                  <input type="number" name="email_port" defaultValue={integrations.email_port} placeholder="587" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">SMTP Username</label>
                  <input type="text" name="email_username" defaultValue={integrations.email_username} placeholder="Username" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Password</label>
                  <input type="password" name="email_password" placeholder={integrations.email_password_set ? "•••••••• (Password Saved)" : "SMTP Password"} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">SMTP Encryption</label>
                  <input type="text" name="email_encryption" defaultValue={integrations.email_encryption} placeholder="tls" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Sender Email</label>
                  <input type="email" name="email_from_address" defaultValue={integrations.email_from_address} placeholder="noreply@school.com" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
              </div>
            </div>

            {/* Microsoft Meet Configuration */}
            <div className="space-y-4">
              <h4 className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-50 pb-1 flex justify-between">
                <span>Microsoft Meet Integration</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="microsoft_meet_enabled" defaultChecked={integrations.microsoft_meet_enabled} className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20" />
                  <span className="font-semibold text-zinc-600 capitalize">Enable Microsoft Meet</span>
                </label>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Microsoft Tenant ID</label>
                  <input type="text" name="microsoft_tenant_id" defaultValue={integrations.microsoft_tenant_id} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Microsoft Client ID</label>
                  <input type="text" name="microsoft_client_id" defaultValue={integrations.microsoft_client_id} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Microsoft Client Secret</label>
                  <input type="password" name="microsoft_client_secret" placeholder={integrations.microsoft_client_secret_set ? "•••••••• (Secret Saved)" : "Microsoft Client Secret"} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Microsoft Organizer UPN</label>
                  <input type="text" name="microsoft_organizer_upn" defaultValue={integrations.microsoft_organizer_upn} placeholder="teacher@school.onmicrosoft.com" className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
              </div>
            </div>

            {/* Payment Integrations */}
            <div className="space-y-4">
              <h4 className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-50 pb-1 flex justify-between">
                <span>Payment Configuration</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="payment_enabled" defaultChecked={integrations.payment_enabled} className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500/20" />
                  <span className="font-semibold text-zinc-600 capitalize">Enable Payments</span>
                </label>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Payment Gateway</label>
                  <select name="payment_gateway" defaultValue={integrations.payment_gateway} className="w-full border border-zinc-200 p-2 rounded-xl bg-white outline-none">
                    <option value="razorpay">Razorpay</option>
                    <option value="stripe">Stripe</option>
                    <option value="payu">PayU</option>
                    <option value="easebuzz">Easebuzz</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Key / Client ID</label>
                  <input type="text" name="payment_key" defaultValue={integrations.payment_key} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Secret / Token</label>
                  <input type="password" name="payment_secret" placeholder={integrations.payment_secret_set ? "•••••••• (Secret Saved)" : "Secret Key"} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-semibold mb-1">Base URL (optional)</label>
                  <input type="text" name="payment_base_url" defaultValue={integrations.payment_base_url} className="w-full border border-zinc-200 p-2 rounded-xl outline-none" />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents List */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-800 border-b border-zinc-100 pb-3">Uploaded Verification Documents</h3>
              <div className="divide-y divide-zinc-100">
                {documents.length === 0 ? (
                  <p className="py-6 text-zinc-400 italic">No verification documents uploaded yet.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 text-zinc-500 font-bold">
                          PDF
                        </div>
                        <div>
                          <span className="font-bold text-zinc-800 block capitalize">{doc.type || "Document"}</span>
                          <span className="text-[9px] text-zinc-400 block font-normal">Uploaded: {doc.created_at || "—"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.file_url && (
                          <Button variant="outline" size="xs" onClick={() => handleDownloadDoc(doc.file_url, doc.type ? `${doc.type}.pdf` : "document.pdf")}>
                            <FaDownload className="w-3.5 h-3.5 text-zinc-500" />
                          </Button>
                        )}
                        <Button variant="outline" size="xs" onClick={() => handleDeleteDoc(doc.id)}>
                          <FaTrash className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Document Uploader */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <h3 className="text-sm font-extrabold text-zinc-800 border-b border-zinc-100 pb-3">Upload New Verification</h3>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-semibold mb-1">Select Document Category</label>
                  <select
                    className="w-full border border-zinc-200 p-2 rounded-xl bg-white outline-none font-semibold text-zinc-700"
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      // Setup an empty file input tracking mapping keys
                      setUploadFiles((prev) => {
                        const next = { ...prev };
                        if (!next[selectedType]) next[selectedType] = null;
                        return next;
                      });
                    }}
                  >
                    <option value="">Select Document Type</option>
                    {Object.keys(docMeta).map((key) => (
                      <option key={key} value={key}>{docMeta[key]}</option>
                    ))}
                  </select>
                </div>

                <div className="border border-dashed border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-zinc-50/50">
                  <FaCloudUploadAlt className="w-8 h-8 text-zinc-400" />
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const type = document.querySelector("select").value;
                      if (type && e.target.files?.[0]) {
                        setUploadFiles((prev) => ({ ...prev, [type]: e.target.files[0] }));
                      } else {
                        toast.error("Please select a document category first.");
                      }
                    }}
                    className="text-[10px] text-zinc-400 font-semibold cursor-pointer"
                  />
                </div>

                {Object.keys(uploadFiles).length > 0 && (
                  <div className="space-y-1 bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Queue to upload:</span>
                    {Object.keys(uploadFiles).map((k) => (
                      <div key={k} className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-700 capitalize">{k}:</span>
                        <span className="text-zinc-500 truncate max-w-[120px]">{uploadFiles[k]?.name || "Not Selected"}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" variant="primary" className="w-full justify-center font-bold" disabled={submitting || Object.keys(uploadFiles).length === 0}>
                  {submitting ? <FaSpinner className="animate-spin" /> : "Upload Queue"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
