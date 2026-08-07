"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import { useEffect, useState, Suspense } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaChalkboardTeacher, FaEdit, FaToggleOn, FaToggleOff, FaUser, FaPhone, 
  FaGraduationCap, FaEye, FaCheckCircle, FaTrash, FaSignInAlt, FaFolder, FaIdCard
} from "react-icons/fa";
import { 
  getTeacherTeachersMeta,
  getTeacherTeachers,
  addTeacherTeacher,
  getTeacherTeacherDetail,
  updateTeacherTeacher,
  toggleTeacherTeacherStatus,
  getTeacherFeatures,
  updateTeacherFeatures
} from "@/features/admin/services/admin.service";
import { deleteItem as deleteTeacherApi } from "@/features/teachers/services/teacher.service";
import { impersonateTeacherUser } from "@/features/auth/redux/moduleThunk";
import { useAppDialog } from "@/context/DialogContext";
import { toast } from "sonner";

function TeacherManagementContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useAppDialog();
  const editId = searchParams.get("edit");
  const [teachersList, setTeachersList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTeacher, setPreviewTeacher] = useState(null);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [featureEditingTeacher, setFeatureEditingTeacher] = useState(null);
  const [assignedFeatures, setAssignedFeatures] = useState([]);
  const [savingFeatures, setSavingFeatures] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [totalExperience, setTotalExperience] = useState("");
  const [previousSchools, setPreviousSchools] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [certFile, setCertFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherTeachersMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getTeacherTeachers();
      setTeachersList(listData.teachers || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load teachers list: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editId && teachersList.length > 0) {
      const matched = teachersList.find(t => t.id === editId);
      if (matched) {
        handleOpenEdit(matched);
      }
    }
  }, [editId, teachersList]);

  const refreshList = async () => {
    try {
      setListLoading(true);
      const listData = await getTeacherTeachers();
      setTeachersList(listData.teachers || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTeacherId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setEmployeeId(meta?.preview_employee_id || "");
    setPhone("");
    setQualification("");
    setSpecialization("");
    setJoiningDate("");
    setSalary("");
    setPhotoFile(null);

    setAutoGenerateId(true);
    setTotalExperience("");
    setPreviousSchools("");
    setDob("");
    setGender("");
    setAddress("");
    setAccountHolderName("");
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setAccountType("");
    setPanNumber("");
    setAadhaarFile(null);
    setPanFile(null);
    setCertFile(null);

    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenPreview = async (t) => {
    try {
      const detailed = await getTeacherTeacherDetail(t.id);
      const teacherObj = detailed.teacher || detailed.data || detailed || t;
      setPreviewTeacher(teacherObj);
    } catch (err) {
      toast.error("Failed to load preview details: " + (err.message || err));
    }
  };

  const handleOpenEdit = async (t) => {
    resetForm();
    try {
      const detailed = await getTeacherTeacherDetail(t.id);
      const teacherObj = detailed.teacher || detailed.data || detailed || t;

      setEditingTeacherId(teacherObj.id);
      const nameParts = (teacherObj.full_name || teacherObj.name || "").split(" ");
      setFirstName(teacherObj.first_name || nameParts[0] || "");
      setLastName(teacherObj.last_name || nameParts.slice(1).join(" ") || "");
      setEmail(teacherObj.email || "");
      setEmployeeId(teacherObj.employee_id || "");
      setPhone(teacherObj.phone || "");
      setQualification(teacherObj.qualification || "");
      setSpecialization(teacherObj.specialization || "");
      setJoiningDate(teacherObj.joining_date || "");
      setSalary(teacherObj.salary || "");

      setAutoGenerateId(false);
      setTotalExperience(teacherObj.total_experience || "");
      setPreviousSchools(teacherObj.previous_schools || "");
      setDob(teacherObj.date_of_birth || "");
      setGender(teacherObj.gender || "");
      setAddress(teacherObj.address || "");
      setAccountHolderName(teacherObj.account_holder_name || "");
      setBankName(teacherObj.bank_name || "");
      setAccountNumber(teacherObj.account_number || "");
      setIfscCode(teacherObj.ifsc_code || "");
      setAccountType(teacherObj.account_type || "");
      setPanNumber(teacherObj.pan_number || "");

      setIsModalOpen(true);
    } catch (err) {
      toast.error("Failed to load teacher details: " + (err.message || err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim() || !email.trim()) {
      setFormError("First Name and Email are required.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("email", email.trim());
      if (password) formData.append("password", password);
      
      formData.append("auto_generate_id", autoGenerateId ? "1" : "0");
      if (!autoGenerateId && employeeId) {
        formData.append("employee_id", employeeId.trim());
      }
      
      if (phone) formData.append("phone", phone.trim());
      if (qualification) formData.append("qualification", qualification.trim());
      if (specialization) formData.append("specialization", specialization.trim());
      if (joiningDate) formData.append("joining_date", joiningDate);
      if (salary) formData.append("salary", salary);
      
      if (totalExperience) formData.append("total_experience", totalExperience.trim());
      if (previousSchools) formData.append("previous_schools", previousSchools.trim());
      if (dob) formData.append("date_of_birth", dob);
      if (gender) formData.append("gender", gender.toLowerCase());
      if (address) formData.append("address", address.trim());
      
      if (accountHolderName) formData.append("account_holder_name", accountHolderName.trim());
      if (bankName) formData.append("bank_name", bankName.trim());
      if (accountNumber) formData.append("account_number", accountNumber.trim());
      if (ifscCode) formData.append("ifsc_code", ifscCode.trim());
      if (accountType) formData.append("account_type", accountType.toLowerCase());
      if (panNumber) formData.append("pan_number", panNumber.trim());

      if (photoFile) formData.append("photo", photoFile);
      if (aadhaarFile) formData.append("aadhaar_card", aadhaarFile);
      if (panFile) formData.append("pan_card", panFile);
      if (certFile) formData.append("qualification_certificate", certFile);

      if (editingTeacherId) {
        await updateTeacherTeacher(editingTeacherId, formData);
        toast.success("Teacher profile updated!");
      } else {
        await addTeacherTeacher(formData);
        toast.success("New teacher profile created!");
      }

      setIsModalOpen(false);
      refreshList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (t) => {
    try {
      await toggleTeacherTeacherStatus(t.id);
      toast.success(`${t.full_name || t.name} is ${t.is_active ? "inactive" : "active"}`);
      refreshList();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleDeleteTeacher = async (teacherObj) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Teacher",
      message: `Are you sure you want to permanently delete the teacher record of ${teacherObj.full_name || teacherObj.name}?`,
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (isConfirmed) {
      try {
        await deleteTeacherApi(teacherObj.id);
        toast.success("Teacher record deleted successfully!");
        setPreviewTeacher(null);
        refreshList();
      } catch (err) {
        toast.error("Failed to delete teacher: " + (err.message || err));
      }
    }
  };

  const handleImpersonateTeacher = async (teacherId) => {
    try {
      const resultAction = await dispatch(impersonateTeacherUser(teacherId));
      if (impersonateTeacherUser.fulfilled.match(resultAction)) {
        toast.success("Logged in as teacher successfully!");
        router.push("/teacher/dashboard");
      } else {
        toast.error(resultAction.payload || "Failed to login as teacher.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to impersonate teacher.");
    }
  };

  const handleOpenFeatures = async (t) => {
    try {
      const response = await getTeacherFeatures(t.id);
      setAssignedFeatures(response.features || response.data || []);
      setFeatureEditingTeacher(t);
    } catch (err) {
      toast.error("Failed to load delegated features: " + (err.message || err));
    }
  };

  const handleSaveFeatures = async (e) => {
    e.preventDefault();
    try {
      setSavingFeatures(true);
      await updateTeacherFeatures(featureEditingTeacher.id, { features: assignedFeatures });
      toast.success("Delegated features updated successfully!");
      setFeatureEditingTeacher(null);
    } catch (err) {
      toast.error("Failed to update features: " + (err.message || err));
    } finally {
      setSavingFeatures(false);
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
          Teachers feature is not enabled for your account. Contact school admin.
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
          title="Teacher Roster Management"
          subtitle="Add new faculty teachers, update qualifications, and manage active status."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" /> Add New Teacher
        </button>
      </div>

      {/* Roster Listing Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : teachersList.length === 0 ? (
        <EmptyState title="No Teachers Found" desc="Add faculty teachers to your school roster." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachersList.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleOpenPreview(t)}
              className="bg-white border border-zinc-200 rounded-2xl px-5 py-6 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                    t.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  }`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(t); }}
                      className={`p-1 rounded transition-colors ${t.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"}`}
                      title={t.is_active ? "Deactivate" : "Activate"}
                    >
                      {t.is_active ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                      className="p-1 text-zinc-400 hover:text-violet-600 rounded transition-colors"
                      title="Edit Profile"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 font-extrabold text-sm overflow-hidden shrink-0 aspect-square min-w-[40px] min-h-[40px]">
                    {t.photo ? (
                      <img src={t.photo} alt={t.full_name} className="w-full h-full object-cover shrink-0 aspect-square" />
                    ) : (
                      (t.full_name || t.name || "T").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-zinc-800 text-sm">{t.full_name || t.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">ID: {t.employee_id || "—"}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <div className="flex justify-between"><span>Email:</span><span className="font-bold text-zinc-700">{t.email}</span></div>
                  <div className="flex justify-between"><span>Phone:</span><span className="font-bold text-zinc-700">{t.phone || "—"}</span></div>
                  <div className="flex justify-between"><span>Qualification:</span><span className="font-bold text-zinc-700">{t.qualification || "—"}</span></div>
                </div>

                <div className="mt-6 flex flex-col gap-2.5 pt-4 border-t border-zinc-100">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/teachers/profile/${t.id}`);
                      }}
                      className="py-2 px-3 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[9px] cursor-pointer shadow-sm"
                    >
                      <FaEye className="w-2.5 h-2.5" />
                      VIEW
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(t);
                      }}
                      className="py-2 px-3 bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[9px] cursor-pointer shadow-sm"
                    >
                      <FaEdit className="w-2.5 h-2.5" />
                      EDIT
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(t);
                      }}
                      className="py-2 px-3 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[9px] cursor-pointer shadow-sm"
                    >
                      <FaCheckCircle className="w-2.5 h-2.5" />
                      {t.is_active ? "INACTIVE" : "ACTIVE"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeacher(t);
                      }}
                      className="py-2 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[9px] cursor-pointer shadow-sm"
                    >
                      <FaTrash className="w-2.5 h-2.5" />
                      DELETE
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImpersonateTeacher(t.id);
                    }}
                    className="w-full py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[9px] cursor-pointer shadow-sm animate-pulse"
                  >
                    <FaSignInAlt className="w-2.5 h-2.5" />
                    LOGIN
                  </button>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaChalkboardTeacher className="text-violet-500" />
                {editingTeacherId ? "Modify Teacher Profile" : "Create New Teacher Record"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-zinc-600 font-semibold">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">First Name *</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              {/* Auto Generate ID Section */}
              <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={autoGenerateId} 
                    onChange={(e) => setAutoGenerateId(e.target.checked)} 
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-zinc-800">Auto-generate Employee ID</span>
                </label>
                {autoGenerateId ? (
                  <p className="text-[10px] text-zinc-500 font-bold">Next ID: <span className="text-violet-600">{meta?.preview_employee_id || "—"}</span></p>
                ) : (
                  <div className="space-y-1 pt-1 max-w-xs">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block">Employee ID *</label>
                    <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required={!autoGenerateId} placeholder="e.g. TCH-46465-0008" className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Login Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: password123" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Teacher Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Qualification</label>
                  <input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="B.Ed, M.Sc..." className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Specialization</label>
                  <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Mathematics, Science..." className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Total Experience</label>
                  <input type="text" value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} placeholder="e.g. 5 years" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Joining Date</label>
                  <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Previous Schools (kis kis school mein kaam kiya)</label>
                <textarea rows="2" value={previousSchools} onChange={(e) => setPreviousSchools(e.target.value)} placeholder="School name, city, years — ek line mein ek school" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Salary</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white">
                    <option value="">— Select Gender —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Address</label>
                <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none"></textarea>
              </div>

              {/* Bank Details */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h4 className="text-[10px] font-extrabold text-zinc-800 uppercase block tracking-wider">Bank Details (Salary / Payroll)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">Account Holder Name</label>
                    <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="As per bank passbook" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">Bank Name</label>
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. SBI, HDFC" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">Account Number</label>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Bank account number" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">IFSC Code</label>
                    <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="E.G. SBIN0001234" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">Account Type</label>
                    <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white">
                      <option value="">— Select —</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 block">PAN Number</label>
                    <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="E.G. ABCDE1234F" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white" />
                  </div>
                </div>
              </div>

              {/* Documents Checklist */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h4 className="text-[10px] font-extrabold text-zinc-800 uppercase block tracking-wider">Documents (PDF / JPG / PNG)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-505 block">Aadhaar Card</label>
                    <input type="file" onChange={(e) => setAadhaarFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-505 block">PAN Card</label>
                    <input type="file" onChange={(e) => setPanFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-zinc-505 block">Qualification Certificate</label>
                    <input type="file" onChange={(e) => setCertFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm">
                  {submitting ? "Saving..." : "Save Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewTeacher && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewTeacher(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up text-left flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 font-extrabold text-sm overflow-hidden shrink-0 aspect-square min-w-[48px] min-h-[48px]">
                  {previewTeacher.photo ? (
                    <img src={previewTeacher.photo} alt={previewTeacher.full_name || previewTeacher.name} className="w-full h-full object-cover shrink-0 aspect-square" />
                  ) : (
                    (previewTeacher.full_name || previewTeacher.name || "T").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-800 text-sm leading-normal">{previewTeacher.full_name || previewTeacher.name}</h3>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">ID: {previewTeacher.employee_id || "—"}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">{previewTeacher.email}</span>
                  </div>
                  <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                    previewTeacher.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  }`}>
                    {previewTeacher.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPreviewTeacher(null)} 
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs text-zinc-600 font-semibold">
              
              {/* Professional Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Professional Details</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Qualification</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.qualification || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Specialization</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.specialization || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Joining Date</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.joiningDate || previewTeacher.joining_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Salary</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.salary || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Phone</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.phone || previewTeacher.mobile || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Gender</span>
                    <span className="text-zinc-700 font-extrabold capitalize">{previewTeacher.gender || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.date_of_birth || previewTeacher.dob || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Address</h4>
                <p className="text-zinc-700 font-bold">{previewTeacher.address || "Not set"}</p>
              </div>

              {/* Bank Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Bank Details</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Account Holder</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.account_holder_name || previewTeacher.bank_details?.account_holder || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Bank Name</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.bank_name || previewTeacher.bank_details?.bank_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Account Number</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.account_number || previewTeacher.bank_details?.account_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">IFSC Code</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.ifsc_code || previewTeacher.bank_details?.ifsc_code || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Account Type</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.account_type || previewTeacher.bank_details?.account_type || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">PAN Number</span>
                    <span className="text-zinc-700 font-extrabold">{previewTeacher.pan_number || previewTeacher.bank_details?.pan_number || "—"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-2 shrink-0">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <button
                  onClick={() => {
                    setPreviewTeacher(null);
                    router.push(`/admin/teachers/profile/${previewTeacher.id}`);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm min-w-[80px]"
                >
                  <FaEye className="w-3.5 h-3.5" />
                  VIEW
                </button>
                <button
                  onClick={() => {
                    setPreviewTeacher(null);
                    handleOpenEdit(previewTeacher);
                  }}
                  className="flex-1 py-2 px-3 bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm min-w-[80px]"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  EDIT
                </button>
                <button
                  onClick={() => {
                    handleToggleStatus(previewTeacher);
                    setPreviewTeacher(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
                  }}
                  className="flex-1 py-2 px-3 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm min-w-[90px]"
                >
                  <FaCheckCircle className="w-3.5 h-3.5" />
                  {previewTeacher.is_active ? "INACTIVE" : "ACTIVE"}
                </button>
                <button
                  onClick={() => handleDeleteTeacher(previewTeacher)}
                  className="flex-1 py-2 px-3 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm min-w-[80px]"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  DELETE
                </button>
                <button
                  onClick={() => handleImpersonateTeacher(previewTeacher.id)}
                  className="flex-1 py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm min-w-[80px]"
                >
                  <FaSignInAlt className="w-3.5 h-3.5" />
                  LOGIN
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleOpenFeatures(previewTeacher)}
                  className="py-2 px-4 bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-105 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
                >
                  <FaFolder className="w-3.5 h-3.5" />
                  FEATURES
                </button>
                <button
                  onClick={() => window.open(`https://erp.trishpay.in/school-admin/teachers/${previewTeacher.id}/id-card?theme=classic`, '_blank')}
                  className="py-2 px-4 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-105 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
                >
                  <FaIdCard className="w-3.5 h-3.5" />
                  ID CARD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delegated Features Modal */}
      {featureEditingTeacher && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in"
          onClick={() => setFeatureEditingTeacher(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFolder className="text-violet-500 animate-pulse" />
                Delegate Features: {featureEditingTeacher.full_name || featureEditingTeacher.name}
              </h3>
              <button onClick={() => setFeatureEditingTeacher(null)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveFeatures} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider">Granted Features Checklist</span>
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar p-1">
                  {(meta?.delegable_features || []).map((feature) => {
                    const isChecked = assignedFeatures.includes(feature.key);
                    return (
                      <label key={feature.key} className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-zinc-100/50 transition-colors cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedFeatures((prev) => [...prev, feature.key]);
                            } else {
                              setAssignedFeatures((prev) => prev.filter((k) => k !== feature.key));
                            }
                          }}
                          className="mt-0.5 w-4 h-4 accent-violet-600 rounded cursor-pointer shrink-0"
                        />
                        <div>
                          <span className="text-xs font-bold text-zinc-800 block leading-tight">{feature.label}</span>
                          {feature.builtin && (
                            <span className="text-[8px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block mt-1 border border-zinc-300">
                              Built-in Module
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setFeatureEditingTeacher(null)} 
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingFeatures} 
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  {savingFeatures ? "Saving..." : "Save Delegate Rights"}
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

export default function TeacherTeachersManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><PageLoader /></div>}>
      <TeacherManagementContent />
    </Suspense>
  );
}
