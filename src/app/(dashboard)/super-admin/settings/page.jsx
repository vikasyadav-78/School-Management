"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import {
  getSettingsMeta,
  getSystemSettings,
  saveBulkSettings,
  getIntegrationSettings,
  saveIntegrationSettings
} from "@/features/super-admin/services/super-admin.service";
import {
  FaCog,
  FaLink,
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaSms,
  FaWhatsapp,
  FaCreditCard
} from "react-icons/fa";

export default function SuperAdminSettingsPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);

  // System Settings state
  const [generalForm, setGeneralForm] = useState({
    app_name: "",
    app_tagline: "",
    support_email: "",
    support_phone: "",
    address: "",
    meta_title: "",
    meta_description: ""
  });
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Integration Settings state (secrets & values inputs)
  const [integrationsForm, setIntegrationsForm] = useState({
    sms_api_key: "",
    sms_sender_id: "",
    whatsapp_api_url: "",
    whatsapp_api_token: "",
    razorpay_key: "",
    stripe_key: "",
    stripe_secret: ""
  });

  // Masked flags returned by GET /integrations
  const [integrationsMeta, setIntegrationsMeta] = useState({
    sms_api_key_set: false,
    sms_sender_id: "",
    whatsapp_api_url: "",
    whatsapp_api_token_set: false,
    razorpay_key_set: false,
    stripe_key_set: false,
    stripe_secret_set: false
  });
  const [submittingIntegrations, setSubmittingIntegrations] = useState(false);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const systemRes = await getSystemSettings();
      const integrationsRes = await getIntegrationSettings();

      // Map loaded system settings array to generalForm keys
      if (systemRes.success && Array.isArray(systemRes.settings)) {
        const loadedForm = { ...generalForm };
        systemRes.settings.forEach((s) => {
          if (s.key in loadedForm) {
            loadedForm[s.key] = s.value || "";
          }
        });
        setGeneralForm(loadedForm);
      }

      if (integrationsRes.success && integrationsRes.integrations) {
        const data = integrationsRes.integrations;
        setIntegrationsMeta(data);
        setIntegrationsForm({
          sms_api_key: "",
          sms_sender_id: data.sms_sender_id || "",
          whatsapp_api_url: data.whatsapp_api_url || "",
          whatsapp_api_token: "",
          razorpay_key: "",
          stripe_key: "",
          stripe_secret: ""
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to retrieve platform settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    const isConfirmed = await dialog.confirm({
      title: "Save Platform Configuration",
      message: "Are you sure you want to update the general system variables globally?",
      confirmText: "Save",
      type: "confirm"
    });
    if (!isConfirmed) return;

    setSubmittingGeneral(true);
    try {
      const settingsPayload = Object.keys(generalForm).map((k) => ({
        key: k,
        value: generalForm[k],
        group: "general"
      }));

      const res = await saveBulkSettings({ settings: settingsPayload });
      if (res.success) {
        toast.success("System configurations updated successfully!");
        loadSettingsData();
      } else {
        toast.error(res.message || "Failed to update settings.");
      }
    } catch (err) {
      toast.error("Error saving bulk settings.");
    } finally {
      setSubmittingGeneral(false);
    }
  };

  const handleSaveIntegrationSettings = async (e) => {
    e.preventDefault();
    const isConfirmed = await dialog.confirm({
      title: "Save Security Credentials",
      message:
        "Update global third-party integration API keys? Blank secret fields will not overwrite existing active keys.",
      confirmText: "Update keys",
      type: "warning"
    });
    if (!isConfirmed) return;

    setSubmittingIntegrations(true);
    try {
      const payload = {};
      Object.keys(integrationsForm).forEach((key) => {
        if (integrationsForm[key] !== "") {
          payload[key] = integrationsForm[key];
        }
      });

      const res = await saveIntegrationSettings(payload);
      if (res.success) {
        toast.success("Third-party integration credentials saved!");
        loadSettingsData();
      } else {
        toast.error(res.message || "Failed to save API integration credentials.");
      }
    } catch (err) {
      toast.error("Error updating API integrations.");
    } finally {
      setSubmittingIntegrations(false);
    }
  };

  const renderStatusBadge = (isSet) => {
    return isSet ? (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 px-2.5 py-0.5 rounded-full">
        <FaCheckCircle className="w-3 h-3 text-emerald-600" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 ring-1 ring-inset ring-slate-500/20 px-2.5 py-0.5 rounded-full">
        <FaTimesCircle className="w-3 h-3 text-slate-400" /> Not Set
      </span>
    );
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="System Settings & API Gateways"
          description="Manage platform-wide variables, contact address, support helpdesk, and third-party SMS/WhatsApp/Payment gateways."
        />

        {/* Tab Selection */}
        <div className="flex border border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-sm max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaCog className="w-3.5 h-3.5" />
            General Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("integrations")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "integrations"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaLink className="w-3.5 h-3.5" />
            Third-Party Integrations
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <PageLoader />
          </div>
        ) : (
          <>
            {/* TAB: GENERAL PLATFORM CONFIGURATION */}
            {activeTab === "general" && (
              <form
                onSubmit={handleSaveGeneralSettings}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-base">Branding & Platform Configurations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Platform variables are loaded globally to style default emails and templates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Application Name</label>
                    <input
                      type="text"
                      placeholder="e.g. EduManage Pro"
                      value={generalForm.app_name}
                      onChange={(e) => setGeneralForm({ ...generalForm, app_name: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Application Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. The Smarter Way to Manage Schools"
                      value={generalForm.app_tagline}
                      onChange={(e) => setGeneralForm({ ...generalForm, app_tagline: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Support Helpdesk Email</label>
                    <input
                      type="email"
                      placeholder="support@edumanage.com"
                      value={generalForm.support_email}
                      onChange={(e) => setGeneralForm({ ...generalForm, support_email: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Support Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={generalForm.support_phone}
                      onChange={(e) => setGeneralForm({ ...generalForm, support_phone: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 4th Floor, Tech Hub Tower, New Delhi, India"
                      value={generalForm.address}
                      onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-5 col-span-1 md:col-span-2">
                    <h4 className="font-bold text-slate-900 text-sm">SEO Meta Defaults</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Baseline headers metadata used on public pages.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Default SEO Title</label>
                    <input
                      type="text"
                      placeholder="School Management System ERP"
                      value={generalForm.meta_title}
                      onChange={(e) => setGeneralForm({ ...generalForm, meta_title: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Default SEO Description</label>
                    <input
                      type="text"
                      placeholder="Fully functional automated ERP platform..."
                      value={generalForm.meta_description}
                      onChange={(e) => setGeneralForm({ ...generalForm, meta_description: e.target.value })}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={submittingGeneral}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 shadow-sm"
                  >
                    <FaSave className="w-3.5 h-3.5" /> Save Configurations
                  </Button>
                </div>
              </form>
            )}

            {/* TAB: API GATEWAY CREDENTIALS */}
            {activeTab === "integrations" && (
              <form onSubmit={handleSaveIntegrationSettings} className="space-y-6">
                {/* Notice Alert */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-sm mt-0.5">
                    <FaKey />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-amber-900">Security & Overrides Policy</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed font-normal">
                      These credentials configure platform-level fallbacks. Individual schools can configure custom
                      overrides inside their individual School Directory workspace.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                  {/* SMS Gateway (SMS) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                          <FaSms />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">SMS Gateway API</span>
                      </div>
                      {renderStatusBadge(integrationsMeta.sms_api_key_set)}
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">SMS API Secret Key</label>
                        <input
                          type="password"
                          placeholder={integrationsMeta.sms_api_key_set ? "••••••••••••••••••••" : "Enter API key"}
                          value={integrationsForm.sms_api_key}
                          onChange={(e) => setIntegrationsForm({ ...integrationsForm, sms_api_key: e.target.value })}
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">SMS Sender ID</label>
                        <input
                          type="text"
                          placeholder="e.g. EDUMP"
                          value={integrationsForm.sms_sender_id}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, sms_sender_id: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp API (WhatsApp) */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                          <FaWhatsapp />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">WhatsApp Business API</span>
                      </div>
                      {renderStatusBadge(integrationsMeta.whatsapp_api_token_set)}
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">WhatsApp API URL</label>
                        <input
                          type="text"
                          placeholder="https://graph.facebook.com/v17.0"
                          value={integrationsForm.whatsapp_api_url}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, whatsapp_api_url: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">WhatsApp Access Token</label>
                        <input
                          type="password"
                          placeholder={
                            integrationsMeta.whatsapp_api_token_set ? "••••••••••••••••••••" : "Enter access token"
                          }
                          value={integrationsForm.whatsapp_api_token}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, whatsapp_api_token: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Gateway */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm ring-1 ring-blue-500/10">
                          <FaCreditCard />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">Razorpay Checkout Gateway</span>
                      </div>
                      {renderStatusBadge(integrationsMeta.razorpay_key_set)}
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Razorpay Key ID</label>
                        <input
                          type="password"
                          placeholder={integrationsMeta.razorpay_key_set ? "••••••••••••••••••••" : "rzp_live_..."}
                          value={integrationsForm.razorpay_key}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, razorpay_key: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                      <p className="text-xs text-slate-400 font-normal">
                        Required to handle seamless student payment collection & checkout flow.
                      </p>
                    </div>
                  </div>

                  {/* Stripe Gateway */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm ring-1 ring-indigo-500/10">
                          <FaKey />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">Stripe Payments Gateway</span>
                      </div>
                      <div className="flex gap-1.5">
                        {renderStatusBadge(integrationsMeta.stripe_key_set)}
                        {renderStatusBadge(integrationsMeta.stripe_secret_set)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Stripe Publishable Key
                        </label>
                        <input
                          type="password"
                          placeholder={integrationsMeta.stripe_key_set ? "••••••••••••••••••••" : "pk_live_..."}
                          value={integrationsForm.stripe_key}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, stripe_key: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Stripe Secret Key</label>
                        <input
                          type="password"
                          placeholder={integrationsMeta.stripe_secret_set ? "••••••••••••••••••••" : "sk_live_..."}
                          value={integrationsForm.stripe_secret}
                          onChange={(e) =>
                            setIntegrationsForm({ ...integrationsForm, stripe_secret: e.target.value })
                          }
                          className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="submit"
                    disabled={submittingIntegrations}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 shadow-sm"
                  >
                    <FaSave className="w-3.5 h-3.5" /> Update Gateways Configuration
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}