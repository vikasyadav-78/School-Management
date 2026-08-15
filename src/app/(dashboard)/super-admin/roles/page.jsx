"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import {
  getRoles,
  getRolesMeta,
  createRole,
  syncRolePermissions,
  getSchoolAdminFeatures,
  updateSchoolAdminFeatures
} from "@/features/super-admin/services/super-admin.service";
import {
  FaPlus,
  FaTimes,
  FaSave,
  FaUserShield,
  FaSlidersH,
  FaKey,
  FaCheck
} from "react-icons/fa";

export default function SuperAdminRolesPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("roles");
  const [loading, setLoading] = useState(true);

  // Meta Data
  const [meta, setMeta] = useState({
    permissions: [],
    permission_groups: [],
    school_admin_features: []
  });

  // Roles state
  const [roles, setRoles] = useState([]);

  // School Admin global features state
  const [features, setFeatures] = useState([]);
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  const [submittingFeatures, setSubmittingFeatures] = useState(false);

  // Create Role Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: "", permissions: [] });
  const [submittingRole, setSubmittingRole] = useState(false);

  // Sync Permissions Modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [submittingSync, setSubmittingSync] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const rolesRes = await getRoles();
      const metaRes = await getRolesMeta();
      const featuresRes = await getSchoolAdminFeatures();

      if (rolesRes.success) {
        setRoles(rolesRes.roles || []);
      }
      if (metaRes.success) {
        setMeta(metaRes);
      }
      if (featuresRes.success) {
        setFeatures(featuresRes.features || []);
        setEnabledFeatures(featuresRes.enabled_features || []);
      }
    } catch (err) {
      console.error("Failed to load roles and permissions:", err);
      toast.error("Failed to retrieve system roles data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Perms Modal Open
  const handleOpenSyncModal = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
    setShowSyncModal(true);
  };

  const handleTogglePermissionSelection = (permName) => {
    if (selectedPermissions.includes(permName)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permName));
    } else {
      setSelectedPermissions([...selectedPermissions, permName]);
    }
  };

  const handleSaveSyncedPermissions = async (e) => {
    e.preventDefault();
    setSubmittingSync(true);
    try {
      const res = await syncRolePermissions(selectedRole.id, {
        permissions: selectedPermissions
      });
      if (res.success) {
        toast.success(res.message || "Permissions updated successfully!");
        setShowSyncModal(false);
        const rolesRes = await getRoles();
        if (rolesRes.success) setRoles(rolesRes.roles || []);
      } else {
        toast.error(res.message || "Failed to update permissions.");
      }
    } catch (err) {
      toast.error("Error syncing role permissions.");
    } finally {
      setSubmittingSync(false);
    }
  };

  // Create Custom Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;
    setSubmittingRole(true);
    try {
      const res = await createRole({
        name: newRoleForm.name,
        permissions: newRoleForm.permissions
      });
      if (res.success) {
        toast.success(res.message || "New custom role created.");
        setShowCreateModal(false);
        setNewRoleForm({ name: "", permissions: [] });
        const rolesRes = await getRoles();
        if (rolesRes.success) setRoles(rolesRes.roles || []);
      } else {
        toast.error(res.message || "Failed to create role.");
      }
    } catch (err) {
      toast.error("Error creating role.");
    } finally {
      setSubmittingRole(false);
    }
  };

  // Toggle Global Feature selection
  const handleToggleFeature = (key) => {
    if (enabledFeatures.includes(key)) {
      setEnabledFeatures(enabledFeatures.filter((f) => f !== key));
    } else {
      setEnabledFeatures([...enabledFeatures, key]);
    }
  };

  // Toggle All Features check/uncheck
  const handleToggleAllFeatures = () => {
    if (enabledFeatures.length === features.length) {
      setEnabledFeatures([]);
    } else {
      setEnabledFeatures(features.map((f) => f.key));
    }
  };

  const handleSaveGlobalFeatures = async () => {
    const isConfirmed = await dialog.confirm({
      title: "Update Global Modules",
      message:
        "Are you sure you want to update the default School Admin modules checklist globally? Existing school overrides remain unchanged.",
      confirmText: "Save changes",
      type: "confirm"
    });
    if (!isConfirmed) return;

    setSubmittingFeatures(true);
    try {
      const res = await updateSchoolAdminFeatures({
        features: enabledFeatures
      });
      if (res.success) {
        toast.success("Global School Admin modules updated successfully!");
        const featuresRes = await getSchoolAdminFeatures();
        if (featuresRes.success) {
          setFeatures(featuresRes.features || []);
          setEnabledFeatures(featuresRes.enabled_features || []);
        }
      } else {
        toast.error(res.message || "Failed to save features list.");
      }
    } catch (err) {
      toast.error("Error saving global features.");
    } finally {
      setSubmittingFeatures(false);
    }
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="Roles & Security Permissions"
          description="Manage granular platform permissions, Spatie roles, and the default checklist of modules for School Admins."
        />

        {/* Tab Selection */}
        <div className="flex border border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-sm max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "roles"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaUserShield className="w-4 h-4" />
            Roles & Permissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("features")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "features"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaSlidersH className="w-4 h-4" />
            Global School Features
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <PageLoader />
          </div>
        ) : (
          <>
            {/* TAB: ROLES & SPATIE PERMISSIONS */}
            {activeTab === "roles" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Spatie User Roles</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Roles determine baseline features accessibility for support staff and admins.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm"
                  >
                    <FaPlus className="w-3 h-3" /> Create Custom Role
                  </Button>
                </div>

                {/* Roles Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <span className="font-bold text-slate-900 text-base capitalize block">
                              {role.name.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                              Guard: {role.guard_name}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20 text-xs font-semibold">
                            {role.permissions_count} Permissions
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {role.permissions?.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">
                              No permissions synced yet. Click sync permissions below.
                            </span>
                          ) : (
                            role.permissions?.map((p) => (
                              <span
                                key={p}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 text-slate-700 rounded-lg text-xs font-medium"
                              >
                                {p}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenSyncModal(role)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 transition-colors"
                        >
                          <FaKey className="w-3 h-3 text-slate-400" />
                          <span>Sync Permissions</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GLOBAL SCHOOL FEATURES */}
            {activeTab === "features" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Global School Modules</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure default enabled modules for newly created School Admins
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleAllFeatures}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      {enabledFeatures.length === features.length ? "Deselect All" : "Select All"}
                    </button>
                    <Button
                      onClick={handleSaveGlobalFeatures}
                      disabled={submittingFeatures}
                      variant="primary"
                      size="sm"
                      className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 shadow-sm"
                    >
                      <FaSave className="w-3.5 h-3.5" /> Save Checklist
                    </Button>
                  </div>
                </div>

                {/* Features Switch Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feat) => {
                    const isEnabled = enabledFeatures.includes(feat.key);
                    return (
                      <div
                        key={feat.key}
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer select-none transition-all duration-150 ${
                          isEnabled
                            ? "bg-violet-50/30 border-violet-300 text-violet-950 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-900">{feat.label}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Key: {feat.key}</p>
                        </div>

                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                            isEnabled ? "bg-violet-600 flex justify-end" : "bg-slate-200 flex justify-start"
                          }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: CREATE ROLE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100/80 text-violet-600 flex items-center justify-center text-sm">
                  <FaUserShield />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create New Role</h3>
                  <p className="text-[11px] text-slate-500">Define a custom platform role</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. auditor, operations"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value.toLowerCase() })}
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Select Baseline Permissions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Baseline Permissions
                </label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto space-y-2.5">
                  {meta.permissions?.map((p) => {
                    const isChecked = newRoleForm.permissions.includes(p.name);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-white rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewRoleForm({
                                ...newRoleForm,
                                permissions: newRoleForm.permissions.filter((x) => x !== p.name)
                              });
                            } else {
                              setNewRoleForm({
                                ...newRoleForm,
                                permissions: [...newRoleForm.permissions, p.name]
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                        />
                        <span className="capitalize text-xs font-medium text-slate-700">
                          {p.name.replace("_", " ")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingRole}
                  className="text-xs font-semibold px-4 py-2 shadow-sm"
                >
                  {submittingRole ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SYNC ROLE PERMISSIONS */}
      {showSyncModal && selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100/80 text-violet-600 flex items-center justify-center text-sm">
                  <FaKey />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm capitalize">
                    Sync Permissions — {selectedRole.name.replace("_", " ")}
                  </h3>
                  <p className="text-[11px] text-slate-500">Update Spatie capabilities matrix</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSelectedRole(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleSaveSyncedPermissions} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {meta.permission_groups?.map((group) => (
                  <div key={group.group} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      {group.group} Operations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.permissions?.map((p) => {
                        const isChecked = selectedPermissions.includes(p.name);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleTogglePermissionSelection(p.name)}
                            className={`p-3 border rounded-xl flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                              isChecked
                                ? "bg-violet-50/40 border-violet-300 text-violet-950 font-bold shadow-2xs"
                                : "bg-slate-50/50 border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                            />
                            <span className="capitalize text-xs">{p.name.replace("_", " ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSyncModal(false);
                    setSelectedRole(null);
                  }}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingSync}
                  className="text-xs font-semibold px-5 py-2 shadow-sm"
                >
                  {submittingSync ? "Syncing..." : "Sync Permissions"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}