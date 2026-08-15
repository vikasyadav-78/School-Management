"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaPlus, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaEye, FaEdit, FaToggleOn, FaToggleOff, FaIdCard, FaCamera, FaFolder, FaFileAlt
} from "react-icons/fa";
import { 
  getTeacherStaffMeta,
  getTeacherStaff,
  getTeacherStaffDetail,
  addTeacherStaff,
  updateTeacherStaff,
  toggleTeacherStaffStatus,
  getTeacherStaffIdCard,
  printTeacherStaffIdCard
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function TeacherStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all"); // "all" | "active" | "inactive"

  // Selection & Details Modal State
  const [activeStaff, setActiveStaff] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  // File Uploads
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [aadhaarName, setAadhaarName] = useState("");
  const [existingAadhaar, setExistingAadhaar] = useState(null);

  // 1. Load form meta and roster data
  const loadRoster = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherStaffMeta();
      setMeta(metaData.meta || metaData.data || metaData);
      
      const listData = await getTeacherStaff();
      setStaffList(listData.staff || listData.data || (Array.isArray(listData) ? listData : []));
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
  }, []);

  // 2. Fetch list based on search and status filters
  const fetchFilteredList = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      
      const listData = await getTeacherStaff(params);
      setStaffList(listData.staff || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error("Filter thunk failed:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      const handler = setTimeout(() => {
        fetchFilteredList();
      }, 400); // 400ms debounce
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
    setAddress("");
    setIsActive(true);
    setPhoto(null);
    setPhotoPreview("");
    setAadhaarCard(null);
    setAadhaarName("");
    setExistingAadhaar(null);
    setFormError("");
    setEditingStaffId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = async (staff) => {
    try {
      resetForm();
      setLoading(true);
      const detailed = await getTeacherStaffDetail(staff.id);
      const s = detailed.staff || detailed.data || detailed || staff;
      
      setEditingStaffId(s.id);
      setFirstName(s.first_name || s.full_name?.split(" ")[0] || "");
      setLastName(s.last_name || s.full_name?.split(" ").slice(1).join(" ") || "");
      setEmail(s.email || "");
      setPhone(s.phone || "");
      setDesignation(s.designation || "");
      setDepartment(s.department || "");
      setJoiningDate(s.joining_date || "");
      setAddress(s.address || "");
      setIsActive(!!s.is_active);
      if (s.photo) {
        setPhotoPreview(s.photo);
      }
      if (s.documents?.aadhaar_card) {
        setExistingAadhaar(s.documents.aadhaar_card);
      }
      setIsFormModalOpen(true);
    } catch (err) {
      toast.error("Failed to load staff details: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (staff) => {
    try {
      const detailed = await getTeacherStaffDetail(staff.id);
      setActiveStaff(detailed.staff || detailed.data || detailed || staff);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load staff file details: " + (err.message || err));
    }
  };

  const handleOpenIdCard = async (staff) => {
    try {
      const url = staff.id_card_url || `/api/teacher/staff/${staff.id}/id-card?format=print`;
      const response = await api.get(url);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
      }
    } catch (err) {
      toast.error("Failed to load authenticated ID card: " + (err.message || err));
    }
  };

  const handleThemeChange = async (themeKey) => {
    if (!targetStaffIdCard) return;
    setSelectedTheme(themeKey);
    try {
      setLoadingIdCard(true);
      const data = await getTeacherStaffIdCard(targetStaffIdCard.id, { theme: themeKey, format: "json" });
      setIdCardData(data);
    } catch (err) {
      toast.error("Failed to change theme: " + (err.message || err));
    } finally {
      setLoadingIdCard(false);
    }
  };

  const handlePrintIdCard = async () => {
    if (!targetStaffIdCard) return;
    try {
      toast.info("Preparing authenticated ID Card layout...");
      const htmlContent = await printTeacherStaffIdCard(targetStaffIdCard.id, { theme: selectedTheme });
      
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        toast.error("Pop-up blocked. Please allow pop-ups for this site.");
      }
    } catch (err) {
      toast.error("Failed to print staff ID card: " + (err.message || err));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo cannot exceed 2MB.");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e, setter, nameSetter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Document size cannot exceed 5MB.");
        return;
      }
      setter(file);
      nameSetter(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim() || !email.trim() || !designation.trim()) {
      setFormError("First Name, Email, and Designation are required.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      formData.append("email", email.trim());
      if (password) formData.append("password", password);
      if (phone.trim()) formData.append("phone", phone.trim());
      formData.append("designation", designation.trim());
      if (department.trim()) formData.append("department", department.trim());
      if (joiningDate) formData.append("joining_date", joiningDate);
      if (address.trim()) formData.append("address", address.trim());
      formData.append("is_active", isActive ? "1" : "0");

      if (photo) formData.append("photo", photo);
      if (aadhaarCard) formData.append("aadhaar_card", aadhaarCard);

      if (editingStaffId) {
        await updateTeacherStaff(editingStaffId, formData);
        toast.success("Staff profile updated successfully!");
        
        // Refresh details modal in real time
        try {
          const detailed = await getTeacherStaffDetail(editingStaffId);
          const updated = detailed.staff || detailed.data || detailed;
          if (activeStaff && activeStaff.id === editingStaffId) {
            setActiveStaff(updated);
          }
        } catch (err) {
          console.error("Failed to re-fetch staff:", err);
        }
      } else {
        await addTeacherStaff(formData);
        toast.success("Staff registered successfully!");
      }

      setIsFormModalOpen(false);
      fetchFilteredList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save staff profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      await toggleTeacherStaffStatus(staff.id);
      toast.success(`Toggled active status for ${staff.full_name || staff.first_name}`);
      fetchFilteredList();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
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
          Staff feature is not enabled for your account. Contact school admin.
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
          title="Staff Roster Manager"
          subtitle="Administer teachers profiles, department tags, designations, and contact databases."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Staff Member
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search staff by name, email, department, designation..."
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
      {listLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState 
          title="No Staff Members Found"
          desc="Try adjusting your filters or typing a different search query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Staff ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Designation / Department</th>
                  <th className="px-6 py-4 whitespace-nowrap">Email / Contact</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-500">
                      {staff.employee_id || "STF-SCH-000" + staff.id.toString().slice(0, 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.full_name} className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0 aspect-square min-w-[32px] min-h-[32px]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs shrink-0 aspect-square min-w-[32px] min-h-[32px]">
                            {(staff.full_name || staff.first_name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-zinc-800 block">{staff.full_name || `${staff.first_name} ${staff.last_name || ""}`}</span>
                          <span className="text-[9px] text-zinc-400">Joined: {staff.joining_date || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-zinc-800 block">{staff.designation}</span>
                      <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider">{staff.department || "General"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      <span className="block text-zinc-800">{staff.email}</span>
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
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenIdCard(staff)}
                          className="p-1.5 hover:bg-violet-50 rounded-lg text-violet-600 hover:text-violet-700 transition-colors"
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
                          className="p-1.5 hover:bg-violet-50 rounded-lg text-zinc-500 hover:text-violet-600 transition-colors"
                          title="Edit Profile"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className={`p-1 rounded-lg transition-colors ${
                            staff.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                          }`}
                          title={staff.is_active ? "Deactivate" : "Activate"}
                        >
                          {staff.is_active ? <FaToggleOn className="w-5.5 h-5.5" /> : <FaToggleOff className="w-5.5 h-5.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">First Name</label>
                    <input 
                      type="text"
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
              </div>

              {/* Login accounts details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Credentials & Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@school.com"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingStaffId ? "Leave blank to keep current" : "Choose password"}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
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

              {/* Assignment registry */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Designation & Department</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Designation</label>
                    <input 
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Teacher"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Department</label>
                    <input 
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Science"
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
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Residential Address</label>
                <textarea 
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full resident address details..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                />
              </div>

              {/* Photo Upload & Status */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Photo & Status</h4>
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
                    <p className="text-[9px] text-zinc-400 mt-1 leading-normal">
                      Attach photo max 2MB. Clear portraits highly recommended.
                    </p>
                  </div>

                  <div className="sm:ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Status</span>
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-zinc-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Documents Attachment */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Documents (Max 5MB)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Aadhaar Card</label>
                    <div className="flex flex-col gap-2">
                      <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                        <span>{aadhaarName || existingAadhaar ? "Change File" : "Choose File"}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setAadhaarCard, setAadhaarName)} 
                          className="hidden" 
                        />
                      </label>
                      {aadhaarName ? (
                        <span className="text-[9px] text-zinc-400 truncate max-w-full font-bold text-center block mt-1">
                          {aadhaarName}
                        </span>
                      ) : existingAadhaar ? (
                        <div className="flex items-center justify-between mt-1 px-1 bg-emerald-50 rounded p-1 border border-emerald-100">
                          <span className="text-[9px] text-emerald-700 font-extrabold truncate max-w-[150px]">✔ {existingAadhaar.file_name || "Uploaded"}</span>
                          <a href={existingAadhaar.url} target="_blank" rel="noreferrer" className="text-[9px] text-violet-600 font-bold hover:underline">View</a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
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
                  {submitting ? "Saving..." : (editingStaffId ? "Save Updates" : "Register Member")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {isDetailModalOpen && activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFolder className="text-violet-500" />
                Staff File Inspector
              </h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Header Profile Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                {activeStaff.photo ? (
                  <img src={activeStaff.photo} alt={activeStaff.full_name} className="w-14 h-14 rounded-full object-cover border border-zinc-200 shadow-sm shrink-0 aspect-square min-w-[56px] min-h-[56px]" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-lg shadow-sm shrink-0 aspect-square min-w-[56px] min-h-[56px]">
                    {(activeStaff.full_name || activeStaff.first_name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-extrabold text-zinc-800 leading-tight">
                    {activeStaff.full_name || `${activeStaff.first_name} ${activeStaff.last_name || ""}`}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                    <span>ID: {activeStaff.employee_id || "STF-SCH-000" + activeStaff.id.toString().slice(0, 3)}</span>
                    <span>•</span>
                    <span>Joined: {activeStaff.joining_date || "—"}</span>
                  </div>
                </div>

                <div className="ml-auto">
                  <span className={`inline-flex px-2.5 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                    activeStaff.is_active 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {activeStaff.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Roster details list */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-zinc-600">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Designation</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStaff.designation || "—"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Department</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStaff.department || "General"}</span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="text-zinc-800 text-xs font-extrabold flex items-center gap-1.5">
                    <FaEnvelope className="text-zinc-400 w-3 h-3" />
                    {activeStaff.email}
                  </span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Phone Contact</span>
                  <span className="text-zinc-800 text-xs font-extrabold flex items-center gap-1.5">
                    <FaPhone className="text-zinc-400 w-3 h-3" />
                    {activeStaff.phone || "—"}
                  </span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Residential Address</span>
                  <span className="text-zinc-800 text-xs font-extrabold flex items-start gap-1.5 leading-relaxed">
                    <FaMapMarkerAlt className="text-zinc-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {activeStaff.address || "—"}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Uploaded Documents</span>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {/* Aadhaar Card */}
                    <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="space-y-0.5 max-w-[60%]">
                        <span className="font-bold text-zinc-700 text-[10px] block">Aadhaar Card</span>
                        {activeStaff.documents?.aadhaar_card && (
                          <span className="text-[9px] text-emerald-600 font-bold block truncate">✔ {activeStaff.documents.aadhaar_card.file_name}</span>
                        )}
                      </div>
                      {activeStaff.documents?.aadhaar_card ? (
                        <div className="flex gap-2 shrink-0">
                          <a href={activeStaff.documents.aadhaar_card.url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 font-extrabold hover:underline">View</a>
                          <span className="text-zinc-300">|</span>
                          <a href={activeStaff.documents.aadhaar_card.url} download className="text-[10px] text-violet-600 font-extrabold hover:underline">Download</a>
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-[9px] font-bold uppercase shrink-0">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenIdCard(activeStaff);
                }}
                className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
              >
                <FaIdCard className="w-3.5 h-3.5" /> Staff ID Card
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff ID Card Preview & Print Modal */}
      {isIdCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaIdCard className="text-violet-500" />
                Staff Identity Card
              </h3>
              <button 
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selector */}
            {idCardData?.themes && idCardData.themes.length > 0 && (
              <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-center gap-1.5 overflow-x-auto">
                {idCardData.themes.map((th) => (
                  <button
                    key={th.key}
                    type="button"
                    onClick={() => handleThemeChange(th.key)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedTheme === th.key
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {th.key}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5 flex flex-col items-center justify-center bg-zinc-100/50">
              {loadingIdCard ? (
                <div className="w-[260px] h-[350px] bg-white rounded-2xl border border-zinc-200/60 shadow-lg p-4 flex flex-col items-center justify-between animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 mb-2 mx-auto"></div>
                  <div className="h-3 bg-zinc-200 rounded w-3/4 mx-auto mb-3"></div>
                  <div className="w-16 h-16 rounded-full bg-zinc-200 mx-auto mb-3"></div>
                  <div className="h-3 bg-zinc-200 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-2 bg-zinc-200 rounded w-2/3 mx-auto mb-2"></div>
                  <div className="w-12 h-12 bg-zinc-200 rounded-lg mx-auto"></div>
                </div>
              ) : idCardData ? (
                <div className="w-[260px] bg-white rounded-2xl border border-zinc-200 shadow-xl relative overflow-hidden flex flex-col">
                  {/* Decorative Header Bar */}
                  <div className={`px-3.5 py-2.5 text-center text-white shrink-0 relative ${
                    selectedTheme === "wave" ? "bg-blue-600" :
                    selectedTheme === "green" ? "bg-emerald-600" :
                    selectedTheme === "navy" ? "bg-slate-900" : "bg-violet-600"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {idCardData.school?.logo && (
                        <img src={idCardData.school.logo} alt="Logo" className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-[9.5px] font-black uppercase tracking-wider block text-white select-none truncate max-w-[180px]">
                        {idCardData.school?.name || "School Management"}
                      </span>
                    </div>
                    <span className="text-[6.5px] text-violet-100 font-bold uppercase tracking-widest block mt-0.5">STAFF IDENTITY CARD</span>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex flex-col items-center justify-center text-center space-y-2.5">
                    {/* Photo */}
                    <div className="relative w-14 h-14 rounded-full bg-zinc-100 border-2 border-violet-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                      {idCardData.staff?.photo ? (
                        <img src={idCardData.staff.photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <FaUser className="text-zinc-300 w-7 h-7" />
                      )}
                    </div>

                    {/* Name & Title */}
                    <div>
                      <h4 className="font-black text-zinc-800 text-[11px] tracking-tight leading-snug">
                        {idCardData.staff?.full_name || `${idCardData.staff?.first_name || ""} ${idCardData.staff?.last_name || ""}`}
                      </h4>
                      <span className="text-[7px] font-bold text-violet-600 uppercase tracking-widest mt-0.5 block">
                        {idCardData.staff?.designation || "Staff Member"} • {idCardData.staff?.department || "General"}
                      </span>
                    </div>

                    {/* Key Attributes List */}
                    <div className="w-full space-y-1 text-[8px] text-zinc-500 font-bold px-1 pt-2 border-t border-zinc-100">
                      <div className="flex justify-between">
                        <span>EMPLOYEE ID</span>
                        <span className="text-zinc-800 font-black">{idCardData.staff?.employee_id || "STF-001"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>JOINING DATE</span>
                        <span className="text-zinc-800 font-black">{idCardData.staff?.joining_date_label || idCardData.staff?.joining_date || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DATE OF BIRTH</span>
                        <span className="text-zinc-800 font-black">{idCardData.staff?.date_of_birth_label || idCardData.staff?.date_of_birth || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PHONE</span>
                        <span className="text-zinc-800 font-black">{idCardData.staff?.phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with QR */}
                  <div className="px-3.5 py-1.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                    <div className="text-left">
                      <span className="text-[6px] text-zinc-400 font-extrabold uppercase block">STATUS</span>
                      <span className="text-[7.5px] text-emerald-600 font-black block">VERIFIED STAFF</span>
                    </div>
                    {(idCardData.qr_image || idCardData.staff?.qr_image) && (
                      <img src={idCardData.qr_image || idCardData.staff?.qr_image} alt="QR Code" className="w-7 h-7 object-contain animate-fade-in" />
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              {idCardData && (
                <button
                  type="button"
                  onClick={handlePrintIdCard}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FaIdCard className="w-3.5 h-3.5" />
                  Print Staff ID Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
