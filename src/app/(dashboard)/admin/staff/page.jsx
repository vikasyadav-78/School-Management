"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/services/api";
import { 
  FaSearch, FaPlus, FaTimes, FaUser, FaFileAlt,
  FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaIdCard, FaCamera, 
  FaFolder, FaUniversity, FaChevronLeft, 
  FaChevronRight, FaPrint, FaUserCheck
} from "react-icons/fa";
import { 
  getAdminStaffMeta,
  getAdminStaff,
  getAdminStaffDetail,
  addAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  toggleAdminStaffStatus,
  getAdminStaffIdCard
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 30, total: 0 });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "active" | "inactive"
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);

  // Selection & Details Modal State
  const [activeStaff, setActiveStaff] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Staff ID Card Modal State
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [idCardData, setIdCardData] = useState(null);
  const [loadingIdCard, setLoadingIdCard] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [targetStaffIdCard, setTargetStaffIdCard] = useState(null);

  // Creation/Edit Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [salary, setSalary] = useState("");
  const [address, setAddress] = useState("");
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [employeeId, setEmployeeId] = useState("");

  // Bank & Pan Info
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState("savings");
  const [panNumber, setPanNumber] = useState("");

  // File Uploads
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [aadhaarName, setAadhaarName] = useState("");
  const [existingAadhaar, setExistingAadhaar] = useState(null);

  const [panCard, setPanCard] = useState(null);
  const [panCardName, setPanCardName] = useState("");
  const [existingPanCard, setExistingPanCard] = useState(null);

  const [idProof, setIdProof] = useState(null);
  const [idProofName, setIdProofName] = useState("");
  const [existingIdProof, setExistingIdProof] = useState(null);

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showDocUploads, setShowDocUploads] = useState(false);

  // Load form meta and roster data
  const loadRoster = async () => {
    try {
      setLoading(true);
      const metaData = await getAdminStaffMeta();
      setMeta(metaData.meta || metaData.data || metaData);
      
      const params = { page, per_page: perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;

      const listData = await getAdminStaff(params);
      setStaffList(listData.staff || listData.data || (Array.isArray(listData) ? listData : []));
      if (listData.pagination) {
        setPagination(listData.pagination);
      } else {
        setPagination({ page: 1, per_page: perPage, total: listData.length || 0 });
      }
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load staff panel assets: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [page, perPage]);

  // Fetch list based on search and status filters (debounced search)
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const params = { page: 1, per_page: perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      
      const listData = await getAdminStaff(params);
      setStaffList(listData.staff || listData.data || (Array.isArray(listData) ? listData : []));
      if (listData.pagination) {
        setPagination(listData.pagination);
      } else {
        setPagination({ page: 1, per_page: perPage, total: listData.length || 0 });
      }
      setPage(1);
    } catch (err) {
      console.error("Filter failed:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      const handler = setTimeout(() => {
        fetchFilteredList();
      }, 400);
      return () => clearTimeout(handler);
    }
  }, [searchQuery, selectedStatus]);

  // Clean form
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setDesignation("");
    setDepartment("");
    setJoiningDate("");
    setDateOfBirth("");
    setGender("male");
    setSalary("");
    setAddress("");
    setAutoGenerateId(true);
    setEmployeeId("");

    setBankName("");
    setAccountHolderName("");
    setAccountNumber("");
    setIfscCode("");
    setAccountType("savings");
    setPanNumber("");

    setPhoto(null);
    setPhotoPreview("");
    setAadhaarCard(null);
    setAadhaarName("");
    setExistingAadhaar(null);

    setPanCard(null);
    setPanCardName("");
    setExistingPanCard(null);

    idProof && setIdProof(null);
    setIdProofName("");
    setExistingIdProof(null);

    setFormError("");
    setEditingStaffId(null);
    setShowBankDetails(false);
    setShowDocUploads(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = async (staff) => {
    try {
      resetForm();
      setListLoading(true);
      const detailed = await getAdminStaffDetail(staff.id);
      const data = detailed.staff || detailed.data || detailed;

      setEditingStaffId(data.id);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setDesignation(data.designation || "");
      setDepartment(data.department || "");
      setJoiningDate(data.joining_date || "");
      setDateOfBirth(data.date_of_birth || "");
      setGender(data.gender || "male");
      setSalary(data.salary || "");
      setAddress(data.address || "");
      setAutoGenerateId(false);
      setEmployeeId(data.employee_id || "");

      setBankName(data.bank_name || "");
      setAccountHolderName(data.account_holder_name || "");
      setAccountNumber(data.account_number || "");
      setIfscCode(data.ifsc_code || "");
      setAccountType(data.account_type || "savings");
      setPanNumber(data.pan_number || "");

      if (data.photo) setPhotoPreview(data.photo);
      if (data.aadhaar_card) setExistingAadhaar(data.aadhaar_card);
      if (data.pan_card) setExistingPanCard(data.pan_card);
      if (data.id_proof) setExistingIdProof(data.id_proof);

      setIsFormModalOpen(true);
    } catch (err) {
      toast.error("Failed to load staff detail: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenDetail = async (staff) => {
    try {
      setListLoading(true);
      const detailed = await getAdminStaffDetail(staff.id);
      setActiveStaff(detailed.staff || detailed.data || detailed);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to get staff details: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const resp = await toggleAdminStaffStatus(staff.id);
      toast.success(resp.message || "Staff status toggled successfully.");
      
      setStaffList(prev => prev.map(s => {
        if (s.id === staff.id) {
          return { ...s, is_active: !s.is_active };
        }
        return s;
      }));
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleOpenDelete = (staff) => {
    setDeleteTarget(staff);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await deleteAdminStaff(deleteTarget.id);
      toast.success(resp.message || "Staff member removed successfully.");
      setDeleteTarget(null);
      loadRoster();
    } catch (err) {
      toast.error("Failed to delete staff member: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenIdCard = async (staff) => {
    try {
      setTargetStaffIdCard(staff);
      setLoadingIdCard(true);
      setIsIdCardModalOpen(true);
      const idCard = await getAdminStaffIdCard(staff.id, { theme: selectedTheme, format: "json" });
      setIdCardData(idCard.data || idCard);
    } catch (err) {
      toast.error("Failed to load ID card profile: " + (err.message || err));
    } finally {
      setLoadingIdCard(false);
    }
  };

  useEffect(() => {
    if (isIdCardModalOpen && targetStaffIdCard) {
      const reloadIdCardTheme = async () => {
        try {
          setLoadingIdCard(true);
          const idCard = await getAdminStaffIdCard(targetStaffIdCard.id, { theme: selectedTheme, format: "json" });
          setIdCardData(idCard.data || idCard);
        } catch (err) {
          console.warn("Failed to reload card theme:", err);
        } finally {
          setLoadingIdCard(false);
        }
      };
      reloadIdCardTheme();
    }
  }, [selectedTheme]);

  const handlePrintIdCard = async () => {
    if (!targetStaffIdCard) return;
    try {
      toast.loading("Generating print layout...", { id: "print-id-card" });
      const printUrl = `/admin/staff/${targetStaffIdCard.id}/id-card?theme=${selectedTheme}&format=print`;
      const response = await api.get(printUrl, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "text/html" });
      const blobUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, "_blank");
      if (newTab) {
        newTab.focus();
      } else {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
      toast.dismiss("print-id-card");
    } catch (err) {
      toast.error("Failed to load print layout: " + (err.message || err), { id: "print-id-card" });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo exceeds maximum limit of 2MB");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim()) {
      setFormError("First Name is required.");
      return;
    }
    if (!designation.trim()) {
      setFormError("Designation is required.");
      return;
    }

    if (!editingStaffId) {
      if (email.trim() && !password) {
        setFormError("Password is required when Login Email is provided.");
        return;
      }
      if (password && password.length < 8) {
        setFormError("Password must be at least 8 characters long.");
        return;
      }
    }


    try {
      setSubmitting(true);
      const isMultipart = photo || aadhaarCard || panCard || idProof;
      let payload;

      if (isMultipart) {
        payload = new FormData();
        payload.append("first_name", firstName.trim());
        payload.append("last_name", lastName.trim());
        payload.append("designation", designation.trim());
        payload.append("department", department.trim());
        if (joiningDate) payload.append("joining_date", joiningDate);
        if (dateOfBirth) payload.append("date_of_birth", dateOfBirth);
        if (phone) payload.append("phone", phone.trim());
        if (gender) payload.append("gender", gender);
        if (salary) payload.append("salary", salary);
        if (address) payload.append("address", address.trim());
        
        if (!editingStaffId) {
          payload.append("auto_generate_id", autoGenerateId ? "true" : "false");
          if (!autoGenerateId && employeeId) {
            payload.append("employee_id", employeeId.trim());
          }
          if (email) payload.append("email", email.trim());
          if (password) payload.append("password", password);
        }

        // Bank info
        if (bankName) payload.append("bank_name", bankName.trim());
        if (accountHolderName) payload.append("account_holder_name", accountHolderName.trim());
        if (accountNumber) payload.append("account_number", accountNumber.trim());
        if (ifscCode) payload.append("ifsc_code", ifscCode.trim());
        if (accountType) payload.append("account_type", accountType);
        if (panNumber) payload.append("pan_number", panNumber.trim());

        // File appends
        if (photo) payload.append("photo", photo);
        if (aadhaarCard) payload.append("aadhaar_card", aadhaarCard);
        if (panCard) payload.append("pan_card", panCard);
        if (idProof) payload.append("id_proof", idProof);
      } else {
        payload = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          designation: designation.trim(),
          department: department.trim(),
          joining_date: joiningDate || null,
          date_of_birth: dateOfBirth || null,
          phone: phone.trim() || null,
          gender: gender,
          salary: salary ? parseFloat(salary) : null,
          address: address.trim() || null,
          bank_name: bankName.trim() || null,
          account_holder_name: accountHolderName.trim() || null,
          account_number: accountNumber.trim() || null,
          ifsc_code: ifscCode.trim() || null,
          account_type: accountType,
          pan_number: panNumber.trim() || null
        };
        if (!editingStaffId) {
          payload.auto_generate_id = autoGenerateId;
          if (!autoGenerateId && employeeId) {
            payload.employee_id = employeeId.trim();
          }
          if (email) payload.email = email.trim();
          if (password) payload.password = password;
        }
      }

      let resp;
      if (editingStaffId) {
        resp = await updateAdminStaff(editingStaffId, payload);
        toast.success(resp.message || "Staff profile updated successfully.");
      } else {
        resp = await addAdminStaff(payload);
        toast.success(resp.message || "New staff member registered successfully.");
      }

      setIsFormModalOpen(false);
      resetForm();
      loadRoster();
    } catch (err) {
      setFormError(err.message || "Failed to complete form action.");
      toast.error(err.message || "Form submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const getThemeBackground = () => {
    switch (selectedTheme) {
      case "navy":
        return "bg-gradient-to-br from-slate-900 to-indigo-950 text-white";
      case "green":
        return "bg-gradient-to-br from-teal-900 to-emerald-950 text-white";
      case "wave":
        return "bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 text-white";
      case "classic":
      default:
        return "bg-white border border-zinc-200 text-zinc-800";
    }
  };

  const getThemeHeaderBg = () => {
    switch (selectedTheme) {
      case "navy":
        return "bg-slate-800";
      case "green":
        return "bg-teal-800";
      case "wave":
        return "bg-violet-850";
      case "classic":
      default:
        return "bg-violet-600";
    }
  };

  const getThemeTextPrimary = () => {
    if (selectedTheme === "classic") return "text-zinc-800";
    return "text-white";
  };

  const getThemeTextSecondary = () => {
    if (selectedTheme === "classic") return "text-zinc-550";
    return "text-zinc-300";
  };

  const getThemeTextValue = () => {
    if (selectedTheme === "classic") return "text-zinc-850";
    return "text-zinc-100";
  };

  const getThemeBorder = () => {
    if (selectedTheme === "classic") return "border-zinc-100";
    return "border-zinc-700/50";
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
          <FaTimes className="text-rose-500 w-12 h-12 mb-4" />
          <h2 className="text-zinc-800 font-extrabold text-base mb-2">Access Denied</h2>
          <p className="text-zinc-500 font-medium mb-6">Your current user credentials do not permit administration of School Staff assets.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader 
            title="Staff Roster Desk"
            subtitle="Administer profiles, payroll accounts, bank records, and generated ID cards."
          />
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Register Staff Member
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by name, designation, department, employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Roster Listing Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <PageLoader />
          </div>
        ) : staffList.length === 0 ? (
          <EmptyState 
            title="No Staff Registries Found"
            desc="Add staff profiles to start managing registry rosters, bank info, and generated cards."
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4 whitespace-nowrap">Employee ID</th>
                      <th className="px-6 py-4 whitespace-nowrap">Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Designation / Department</th>
                      <th className="px-6 py-4 whitespace-nowrap">Email / Contact</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700 font-semibold">
                    {staffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-zinc-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-zinc-500">
                          {staff.employee_id || "STF-SCH-00" + staff.id.toString().slice(0, 3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {staff.photo ? (
                              <img src={staff.photo} alt={staff.full_name || staff.first_name} className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0 aspect-square min-w-[36px]" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs shrink-0 aspect-square min-w-[36px]">
                                {(staff.full_name || staff.first_name || "S").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-zinc-800 block">{staff.full_name || `${staff.first_name} ${staff.last_name || ""}`}</span>
                              <span className="text-[9px] text-zinc-400 font-medium">Joined: {staff.joining_date || "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-zinc-800 block">{staff.designation}</span>
                          <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider">{staff.department || "General"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          <span className="block text-zinc-800 font-semibold">{staff.email || "—"}</span>
                          <span className="text-[9px] text-zinc-400">{staff.phone || "—"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                            staff.is_active 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {staff.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenIdCard(staff)}
                              className="p-1.5 hover:bg-violet-50 rounded-lg text-violet-600 hover:text-violet-750 transition-colors cursor-pointer"
                              title="View Staff ID Card"
                            >
                              <FaIdCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(staff)}
                              className="bg-zinc-50 hover:bg-zinc-100 text-zinc-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                              title="View Details"
                            >
                              <FaEye className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              className="p-1.5 hover:bg-violet-50 rounded-lg text-zinc-500 hover:text-violet-600 transition-colors cursor-pointer"
                              title="Edit Profile"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                staff.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                              }`}
                              title={staff.is_active ? "Deactivate" : "Activate"}
                            >
                              {staff.is_active ? <FaToggleOn className="w-5.5 h-5.5" /> : <FaToggleOff className="w-5.5 h-5.5" />}
                            </button>
                            <button
                              onClick={() => handleOpenDelete(staff)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Remove Staff Member"
                            >
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination.total > pagination.per_page && (
              <div className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, pagination.total)} of {pagination.total} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <FaChevronLeft className="w-3 h-3 text-zinc-600" />
                  </button>
                  <span className="px-3 text-xs font-bold text-zinc-700">{page}</span>
                  <button
                    disabled={page * perPage >= pagination.total}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <FaChevronRight className="w-3 h-3 text-zinc-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Staff Roster Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaIdCard className="text-violet-500" />
                  {editingStaffId ? "Edit Staff Registry Profile" : "Register New Staff Profile"}
                </h3>
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[75vh] custom-scrollbar">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                    {formError}
                  </div>
                )}

                {/* Personal details grid */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">First Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Rahul"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Last Name</label>
                      <input 
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Kumar"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Date of Birth</label>
                      <input 
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit phone"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Login accounts details (Only for creates) */}
                {!editingStaffId && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Credentials (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Login Email</label>
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="username@school.com"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Login Password</label>
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Registry assignment */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Assignment Registry</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Designation <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Clerk, Peon"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Department</label>
                      <input 
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Accounts, Admin"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Joining Date</label>
                      <input 
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Salary (Monthly)</label>
                      <input 
                        type="number"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="e.g. 18000"
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                      />
                    </div>
                    {!editingStaffId && (
                      <>
                        <div className="space-y-1 flex flex-col justify-end pb-2">
                          <label className="flex items-center gap-2 font-bold text-zinc-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={autoGenerateId} 
                              onChange={(e) => setAutoGenerateId(e.target.checked)} 
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500" 
                            />
                            Auto Employee ID
                          </label>
                        </div>
                        {!autoGenerateId && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Employee ID</label>
                            <input 
                              type="text"
                              value={employeeId}
                              onChange={(e) => setEmployeeId(e.target.value)}
                              placeholder="e.g. STF-1234"
                              className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Residential Address</label>
                  <textarea 
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full residential address details..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                  />
                </div>

                {/* Collapsible Bank details */}
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm bg-zinc-50/20">
                  <button
                    type="button"
                    onClick={() => setShowBankDetails(!showBankDetails)}
                    className="w-full px-5 py-3.5 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between font-bold text-zinc-800 text-xs border-b border-zinc-100 transition-colors shrink-0"
                  >
                    <span className="flex items-center gap-2"><FaUniversity className="text-violet-500 w-4 h-4" /> Bank Account & PAN Information</span>
                    <span className="text-zinc-400">{showBankDetails ? "Hide" : "Show"}</span>
                  </button>
                  {showBankDetails && (
                    <div className="p-5 space-y-4 bg-white">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Bank Name</label>
                          <input 
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Account Holder Name</label>
                          <input 
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Full name as in passbook"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Account Number</label>
                          <input 
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Account number"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">IFSC Code</label>
                          <input 
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            placeholder="11-character code"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Account Type</label>
                          <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black cursor-pointer"
                          >
                            <option value="savings">Savings</option>
                            <option value="current">Current</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">PAN Number</label>
                          <input 
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            placeholder="10-character PAN"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Document Uploads */}
                <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm bg-zinc-50/20">
                  <button
                    type="button"
                    onClick={() => setShowDocUploads(!showDocUploads)}
                    className="w-full px-5 py-3.5 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between font-bold text-zinc-800 text-xs border-b border-zinc-100 transition-colors shrink-0"
                  >
                    <span className="flex items-center gap-2"><FaFolder className="text-violet-500 w-4 h-4" /> Photos & Documents Upload</span>
                    <span className="text-zinc-400">{showDocUploads ? "Hide" : "Show"}</span>
                  </button>
                  {showDocUploads && (
                    <div className="p-5 space-y-4 bg-white">
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="relative group w-20 h-20 rounded-full bg-zinc-200 border border-zinc-300 overflow-hidden flex items-center justify-center shrink-0">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <FaUser className="w-8 h-8 text-zinc-400 animate-pulse" />
                          )}
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <FaCamera className="text-white w-5 h-5" />
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          </label>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Profile Photo</span>
                          <p className="text-[9px] text-zinc-400 mt-1 leading-normal">Attach profile portrait (Max 2MB). Ideal dimensions: 300x300.</p>
                        </div>
                      </div>

                      {/* Documents Uploads */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        {/* Aadhaar File */}
                        <div className="p-3 border border-zinc-100 bg-zinc-50/50 rounded-xl space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Aadhaar Card</span>
                          {existingAadhaar && (
                            <a href={existingAadhaar} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 flex items-center gap-1 hover:underline font-semibold break-all">
                              <FaFileAlt /> View Current File
                            </a>
                          )}
                          <div className="relative border border-dashed border-zinc-300 hover:border-violet-500 rounded-xl p-2.5 text-center transition-colors">
                            <label className="cursor-pointer block">
                              <span className="text-[10px] font-bold text-zinc-600 block">{aadhaarName || "Choose PDF/Image"}</span>
                              <span className="text-[8px] text-zinc-400">Max 5MB</span>
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error("File exceeds limit of 5MB");
                                      return;
                                    }
                                    setAadhaarCard(file);
                                    setAadhaarName(file.name);
                                  }
                                }} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>

                        {/* PAN Card File */}
                        <div className="p-3 border border-zinc-100 bg-zinc-50/50 rounded-xl space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">PAN Card</span>
                          {existingPanCard && (
                            <a href={existingPanCard} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 flex items-center gap-1 hover:underline font-semibold break-all">
                              <FaFileAlt /> View Current File
                            </a>
                          )}
                          <div className="relative border border-dashed border-zinc-300 hover:border-violet-500 rounded-xl p-2.5 text-center transition-colors">
                            <label className="cursor-pointer block">
                              <span className="text-[10px] font-bold text-zinc-600 block">{panCardName || "Choose PDF/Image"}</span>
                              <span className="text-[8px] text-zinc-400">Max 5MB</span>
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error("File exceeds limit of 5MB");
                                      return;
                                    }
                                    setPanCard(file);
                                    setPanCardName(file.name);
                                  }
                                }} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>

                        {/* ID Proof File */}
                        <div className="p-3 border border-zinc-100 bg-zinc-50/50 rounded-xl space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ID Proof File</span>
                          {existingIdProof && (
                            <a href={existingIdProof} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 flex items-center gap-1 hover:underline font-semibold break-all">
                              <FaFileAlt /> View Current File
                            </a>
                          )}
                          <div className="relative border border-dashed border-zinc-300 hover:border-violet-500 rounded-xl p-2.5 text-center transition-colors">
                            <label className="cursor-pointer block">
                              <span className="text-[10px] font-bold text-zinc-600 block">{idProofName || "Choose PDF/Image"}</span>
                              <span className="text-[8px] text-zinc-400">Max 5MB</span>
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error("File exceeds limit of 5MB");
                                      return;
                                    }
                                    setIdProof(file);
                                    setIdProofName(file.name);
                                  }
                                }} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl font-bold cursor-pointer hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving Registry..." : editingStaffId ? "Update Staff" : "Register Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Viewer Modal */}
        {isDetailModalOpen && activeStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaUserCheck className="text-violet-500" />
                  Staff File Details: {activeStaff.employee_id || "STF-SCH"}
                </h3>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  {activeStaff.photo ? (
                    <img src={activeStaff.photo} alt={activeStaff.full_name} className="w-16 h-16 rounded-full object-cover border border-zinc-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-2xl">
                      {(activeStaff.full_name || activeStaff.first_name || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-zinc-800 text-sm">{activeStaff.full_name || `${activeStaff.first_name} ${activeStaff.last_name || ""}`}</h3>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">{activeStaff.designation} &bull; {activeStaff.department || "General"}</span>
                  </div>
                </div>

                {/* Info grids */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider block border-b border-zinc-100 pb-1 mb-2">Assignment Details</span>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-zinc-500">
                      <div>Employee ID: <span className="text-zinc-800 font-bold block">{activeStaff.employee_id || "—"}</span></div>
                      <div>Joining Date: <span className="text-zinc-800 font-bold block">{activeStaff.joining_date || "—"}</span></div>
                      <div>Monthly Salary: <span className="text-zinc-800 font-bold block">{activeStaff.salary ? `₹${activeStaff.salary}` : "—"}</span></div>
                      <div>Employment: <span className="text-zinc-800 font-bold block">{activeStaff.is_active ? "Active" : "Inactive"}</span></div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider block border-b border-zinc-100 pb-1 mb-2">Contact & Personal Info</span>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-zinc-500">
                      <div>Email Address: <span className="text-zinc-800 font-bold block break-all">{activeStaff.email || "—"}</span></div>
                      <div>Phone Number: <span className="text-zinc-800 font-bold block">{activeStaff.phone || "—"}</span></div>
                      <div>Gender: <span className="text-zinc-800 font-bold block capitalize">{activeStaff.gender || "—"}</span></div>
                      <div>Date of Birth: <span className="text-zinc-800 font-bold block">{activeStaff.date_of_birth || "—"}</span></div>
                      <div className="col-span-2">Residential Address: <span className="text-zinc-800 font-bold block whitespace-pre-wrap">{activeStaff.address || "—"}</span></div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider block border-b border-zinc-100 pb-1 mb-2">Bank Account & PAN</span>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-zinc-500">
                      <div>Bank Name: <span className="text-zinc-800 font-bold block">{activeStaff.bank_name || "—"}</span></div>
                      <div>Account Holder: <span className="text-zinc-800 font-bold block">{activeStaff.account_holder_name || "—"}</span></div>
                      <div>Account Number: <span className="text-zinc-800 font-bold block">{activeStaff.account_number || "—"}</span></div>
                      <div>IFSC Code: <span className="text-zinc-800 font-bold block">{activeStaff.ifsc_code || "—"}</span></div>
                      <div>Account Type: <span className="text-zinc-800 font-bold block capitalize">{activeStaff.account_type || "—"}</span></div>
                      <div>PAN Card Number: <span className="text-zinc-800 font-bold block uppercase">{activeStaff.pan_number || "—"}</span></div>
                    </div>
                  </div>

                  {/* Documents link */}
                  {(activeStaff.aadhaar_card || activeStaff.pan_card || activeStaff.id_proof) && (
                    <div>
                      <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider block border-b border-zinc-100 pb-1 mb-2">Registry Attachments</span>
                      <div className="flex flex-wrap gap-3">
                        {activeStaff.aadhaar_card && (
                          <a href={activeStaff.aadhaar_card} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 font-bold transition-all">
                            <FaFileAlt className="text-zinc-400" /> Aadhaar Card
                          </a>
                        )}
                        {activeStaff.pan_card && (
                          <a href={activeStaff.pan_card} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 font-bold transition-all">
                            <FaFileAlt className="text-zinc-400" /> PAN Card
                          </a>
                        )}
                        {activeStaff.id_proof && (
                          <a href={activeStaff.id_proof} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 font-bold transition-all">
                            <FaFileAlt className="text-zinc-400" /> ID Proof Document
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Close File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left p-6 space-y-4">
              <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2">
                <FaTrash className="text-rose-500" /> Remove Staff Registry
              </h3>
              <p className="text-zinc-500 font-semibold leading-normal">
                Are you sure you want to delete <span className="font-extrabold text-zinc-800">{deleteTarget.full_name || `${deleteTarget.first_name} ${deleteTarget.last_name || ""}`}</span> from the registry? This action will soft-delete their profile.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Removing..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ID Card Viewer Modal */}
        {isIdCardModalOpen && targetStaffIdCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaIdCard className="text-violet-500" /> Staff Identity Badge
                </h3>
                <button 
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar flex flex-col items-center">
                {/* Theme Selector */}
                <div className="w-full flex items-center justify-between gap-4 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">ID Card Theme</span>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="px-3 py-1 border border-zinc-200 rounded-xl bg-white outline-none text-xs font-bold text-zinc-700 cursor-pointer"
                  >
                    <option value="classic">Classic</option>
                    <option value="wave">Wave</option>
                    <option value="green">Emerald Green</option>
                    <option value="navy">Navy Dark</option>
                  </select>
                </div>

                {loadingIdCard ? (
                  <div className="flex items-center justify-center h-72">
                    <PageLoader />
                  </div>
                ) : idCardData ? (
                  <div className={`w-[290px] h-[435px] shrink-0 ${getThemeBackground()} rounded-2xl border ${getThemeBorder()} shadow-xl relative overflow-hidden flex flex-col justify-between`}>
                    {/* Decorative Header Bar */}
                    <div className="bg-[#111e3b] px-4 py-3 text-center text-white shrink-0 relative flex items-center justify-between border-b border-t border-[#81c784]">
                      <div className="flex items-center gap-1.5 text-left">
                        {idCardData.school?.logo && (
                          <img src={idCardData.school.logo} alt="Logo" className="w-5 h-5 object-contain rounded-full bg-white p-0.5" />
                        )}
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wide block text-white select-none truncate max-w-[150px]">
                            {idCardData.school?.name || "SCHOOL ACADEMY"}
                          </span>
                          <span className="text-[6px] text-zinc-300 font-bold uppercase tracking-widest block">STAFF IDENTITY CARD</span>
                        </div>
                      </div>
                      <div className="text-[6px] px-1 py-0.5 bg-[#81c784] text-zinc-950 font-black rounded uppercase tracking-wider">
                        Active
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 flex-1 flex flex-col items-center justify-center text-center space-y-2.5">
                      {/* Photo */}
                      <div className="relative w-16 h-16 rounded-full bg-zinc-100 border-4 border-[#81c784] overflow-hidden shadow-md flex items-center justify-center shrink-0">
                        {idCardData.staff?.photo ? (
                          <img src={idCardData.staff.photo} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-extrabold text-2xl">
                            {(idCardData.staff?.full_name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div>
                        <h4 className="font-extrabold text-zinc-900 text-xs tracking-tight">
                          {idCardData.staff?.full_name}
                        </h4>
                        <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-[#81c784]/20 border border-[#81c784] text-[#2e7d32] rounded-full text-[7px] font-extrabold uppercase tracking-wider">
                          {idCardData.staff?.designation || "Staff Member"}
                        </span>
                      </div>

                      {/* Key Attributes List */}
                      <div className="w-full space-y-1 text-[8px] text-zinc-550 font-bold px-2 pt-2 border-t border-zinc-100 text-left">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Emp ID</span>
                          <span className="text-zinc-800 font-extrabold">{idCardData.staff?.employee_id || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Phone</span>
                          <span className="text-zinc-800 font-extrabold">{idCardData.staff?.phone || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Dept.</span>
                          <span className="text-zinc-800 font-extrabold">{idCardData.staff?.department || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Joining</span>
                          <span className="text-zinc-800 font-extrabold">{idCardData.staff?.joining_date_label || idCardData.staff?.joining_date || "—"}</span>
                        </div>
                      </div>

                      {/* QR Code */}
                      {idCardData.qr_image ? (
                        <div className="shrink-0 bg-white p-1 rounded-lg shadow-inner border border-zinc-100 flex items-center justify-center aspect-square w-12">
                          <img src={idCardData.qr_image} alt="QR ID lookup" className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="h-2" />
                      )}
                    </div>

                    {/* Bottom Address Footer */}
                    <div className="bg-[#111e3b] text-white py-2 px-3 text-center shrink-0 border-t-2 border-[#81c784]">
                      <div className="text-[6px] font-bold text-zinc-300 truncate">
                        {idCardData.school?.address || "Jaipur, Rajasthan, India"}
                      </div>
                      <div className="text-[6px] font-black text-white mt-0.5">
                        📞 {idCardData.school?.phone || "8484848484"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center font-bold text-zinc-400 italic">Failed to render card preview.</div>
                )}
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between shrink-0">
                <button
                  onClick={handlePrintIdCard}
                  disabled={!idCardData}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <FaPrint className="w-3.5 h-3.5" /> Print Card
                </button>
                <button 
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
