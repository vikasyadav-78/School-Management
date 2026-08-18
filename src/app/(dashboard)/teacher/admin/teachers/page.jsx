"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaPlus, FaTimes, FaChalkboardTeacher, FaEdit, FaToggleOn, FaToggleOff, FaIdCard,
  FaEye, FaCheckCircle, FaSignInAlt
} from "react-icons/fa";
import {
  getTeacherTeachersMeta,
  getTeacherTeachers,
  addTeacherTeacher,
  getTeacherTeacherDetail,
  updateTeacherTeacher,
  toggleTeacherTeacherStatus
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function TeacherTeachersManagementPage() {
  const [teachersList, setTeachersList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);

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

  // New Fields matching detailed response
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [totalExperience, setTotalExperience] = useState("");
  const [previousSchools, setPreviousSchools] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState("");
  const [panNumber, setPanNumber] = useState("");

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
    setGender("");
    setDob("");
    setAddress("");
    setTotalExperience("");
    setPreviousSchools("");
    setBankName("");
    setAccountHolderName("");
    setAccountNumber("");
    setIfscCode("");
    setAccountType("");
    setPanNumber("");
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
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
      setGender(teacherObj.gender || "");
      setDob(teacherObj.date_of_birth || "");
      setAddress(teacherObj.address || "");
      setTotalExperience(teacherObj.total_experience || "");
      setPreviousSchools(teacherObj.previous_schools || "");
      setBankName(teacherObj.bank_name || "");
      setAccountHolderName(teacherObj.account_holder_name || "");
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
      if (employeeId) formData.append("employee_id", employeeId.trim());
      if (phone) formData.append("phone", phone.trim());
      if (qualification) formData.append("qualification", qualification.trim());
      if (specialization) formData.append("specialization", specialization.trim());
      if (joiningDate) formData.append("joining_date", joiningDate);
      if (salary) formData.append("salary", salary);
      if (photoFile) formData.append("photo", photoFile);
      if (gender) formData.append("gender", gender);
      if (dob) formData.append("date_of_birth", dob);
      if (address) formData.append("address", address.trim());
      if (totalExperience) formData.append("total_experience", totalExperience);
      if (previousSchools) formData.append("previous_schools", previousSchools.trim());
      if (bankName) formData.append("bank_name", bankName.trim());
      if (accountHolderName) formData.append("account_holder_name", accountHolderName.trim());
      if (accountNumber) formData.append("account_number", accountNumber.trim());
      if (ifscCode) formData.append("ifsc_code", ifscCode.trim());
      if (accountType) formData.append("account_type", accountType);
      if (panNumber) formData.append("pan_number", panNumber.trim());

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

  const handleOpenIdCard = async (t) => {
    try {
      const url = t.id_card_url || `/api/teacher/teachers/${t.id}/id-card?format=print`;
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

  const handleToggleStatus = async (t) => {
    try {
      await toggleTeacherTeacherStatus(t.id);
      toast.success(`Toggled status for ${t.full_name || t.name}`);
      refreshList();
    } catch (err) {
      toast.error("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleViewProfile = async (t) => {
    try {
      const detailed = await getTeacherTeacherDetail(t.id);
      setViewingTeacher(detailed.teacher || detailed.data || detailed || t);
    } catch (err) {
      toast.error("Failed to load teacher details: " + (err.message || err));
    }
  };

  const handleMarkInactive = async (t) => {
    toast.info(`Marking ${t.full_name || t.name} as inactive`);
  };

  const handleLoginAsTeacher = (t) => {
    toast.info(`Login as ${t.full_name || t.name}`);
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

      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : teachersList.length === 0 ? (
        <EmptyState title="No Teachers Found" desc="Add faculty teachers to your school roster." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachersList.map((t) => (
            <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${t.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}>
                  {t.is_active ? "Active" : "Inactive"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`p-1.5 rounded-md transition-colors ${t.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                      }`}
                    title={t.is_active ? "Deactivate" : "Activate"}
                  >
                    {t.is_active ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 text-zinc-400 hover:text-violet-600 rounded-md hover:bg-violet-50 transition-colors"
                    title="Edit Profile"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-base overflow-hidden shrink-0">
                  {t.photo ? (
                    <img src={t.photo} alt={t.full_name} className="w-full h-full object-cover" />
                  ) : (
                    (t.full_name || t.name || "T").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-extrabold text-zinc-800 text-base leading-tight">{t.full_name || t.name}</h4>
                  <span className="text-[10px] text-zinc-400 font-medium">ID: {t.employee_id || "—"}</span>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-zinc-400">Email:</span>
                  <span className="font-semibold text-zinc-800">{t.email}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-zinc-400">Phone:</span>
                  <span className="font-semibold text-zinc-800">{t.phone || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-zinc-400">Qualification:</span>
                  <span className="font-semibold text-zinc-800">{t.qualification || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 border-t border-zinc-100 pt-3">
                <button
                  onClick={() => handleViewProfile(t)}
                  className="py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FaEye className="w-3 h-3" /> VIEW
                </button>
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FaEdit className="w-3 h-3" /> EDIT
                </button>
                <button
                  onClick={() => handleToggleStatus(t)}
                  className={`py-1.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${t.is_active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                >
                  <FaCheckCircle className="w-3 h-3" /> {t.is_active ? "DEACTIVATE" : "ACTIVATE"}
                </button>
                <button
                  onClick={() => handleOpenIdCard(t)}
                  className="py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FaIdCard className="w-3 h-3" /> ID CARD
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left flex flex-col max-h-[85vh]">

            {/* Sleek Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
              <h3 className="font-extrabold text-sm flex items-center gap-2 tracking-wide uppercase">
                <FaChalkboardTeacher className="w-4 h-4" />
                Teacher Profile Details
              </h3>
              <button
                onClick={() => setViewingTeacher(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Main Body with Clean Scrollbar */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-xs">

              {/* Profile Card Header */}
              <div className="flex items-center justify-between bg-violet-50/60 border border-violet-100 p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-violet-200 flex items-center justify-center text-violet-700 font-extrabold text-2xl overflow-hidden shrink-0 shadow-sm">
                    {viewingTeacher.photo ? (
                      <img src={viewingTeacher.photo} alt={viewingTeacher.full_name} className="w-full h-full object-cover" />
                    ) : (
                      (viewingTeacher.full_name || viewingTeacher.name || "T").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-base leading-tight">
                      {viewingTeacher.full_name || `${viewingTeacher.first_name || ""} ${viewingTeacher.last_name || ""}`}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1">
                      Employee ID: <span className="font-bold text-violet-700">{viewingTeacher.employee_id || "—"}</span>
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${viewingTeacher.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                  {viewingTeacher.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Personal Details */}
              <div>
                <h5 className="font-bold text-violet-600 uppercase tracking-wider text-[11px] mb-2.5">
                  Personal Details
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Gender</span>
                    <span className="text-zinc-800 font-bold capitalize">{viewingTeacher.gender || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Date of Birth</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.date_of_birth_label || viewingTeacher.date_of_birth || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">PAN Number</span>
                    <span className="text-zinc-800 font-bold uppercase">{viewingTeacher.pan_number || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div>
                <h5 className="font-bold text-violet-600 uppercase tracking-wider text-[11px] mb-2.5">
                  Contact Details
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Email Address</span>
                    <span className="text-zinc-800 font-bold break-all">{viewingTeacher.email || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Phone Number</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.phone || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl col-span-2">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Residential Address</span>
                    <span className="text-zinc-800 font-bold leading-relaxed">{viewingTeacher.address || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Academic & Experience */}
              <div>
                <h5 className="font-bold text-violet-600 uppercase tracking-wider text-[11px] mb-2.5">
                  Academic & Experience Profile
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Qualification</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.qualification || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Specialization</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.specialization || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Total Experience</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.total_experience || 0} Years</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl col-span-3">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Previous Schools</span>
                    <span className="text-zinc-800 font-bold leading-relaxed">{viewingTeacher.previous_schools || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Bank & Salary Details */}
              <div>
                <h5 className="font-bold text-violet-600 uppercase tracking-wider text-[11px] mb-2.5">
                  Bank Account & Salary Details
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Monthly Salary</span>
                    <span className="text-emerald-700 font-extrabold text-sm">₹{(viewingTeacher.salary || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Bank Name</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.bank_name || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Account Number</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.account_number || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">IFSC Code</span>
                    <span className="text-zinc-800 font-bold uppercase">{viewingTeacher.ifsc_code || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Account Type</span>
                    <span className="text-zinc-800 font-bold capitalize">{viewingTeacher.account_type || "—"}</span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-0.5">Account Holder</span>
                    <span className="text-zinc-800 font-bold">{viewingTeacher.account_holder_name || "—"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Button */}
            <div className="p-4 px-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setViewingTeacher(null)}
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}

              {/* SECTION: Personal Information */}
              <div className="border-b border-zinc-100 pb-2">
                <h4 className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider text-violet-600">Personal Details</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Password {editingTeacherId ? "(Optional)" : ""}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white cursor-pointer">
                    <option value="">Select Gender</option>
                    {meta?.genders?.map((g) => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    )) || (
                        <>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </>
                      )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Address</label>
                <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none" placeholder="Residential Address..." />
              </div>

              {/* SECTION: Professional Details */}
              <div className="border-b border-zinc-100 pb-2 pt-2">
                <h4 className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider text-violet-600">Professional Profile</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Employee ID</label>
                  <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Joining Date</label>
                  <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Qualification</label>
                  <input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc, B.Ed" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Specialization</label>
                  <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Mathematics" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Salary (Monthly)</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="30000" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Total Experience (Years)</label>
                  <input type="number" value={totalExperience} onChange={(e) => setTotalExperience(e.target.value)} placeholder="5" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Previous Schools & Experience</label>
                <textarea rows="2" value={previousSchools} onChange={(e) => setPreviousSchools(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none" placeholder="List former institutions and years of service..." />
              </div>

              {/* SECTION: Bank Account & Payment Details */}
              <div className="border-b border-zinc-100 pb-2 pt-2">
                <h4 className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider text-violet-600">Bank Account Details</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Account Holder Name</label>
                  <input type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="Account holder's full name" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Account Number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Bank Account Number" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">IFSC Code</label>
                  <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="IFSC Code" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Account Type</label>
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold bg-white cursor-pointer">
                    <option value="">Select Account Type</option>
                    {meta?.account_types?.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    )) || (
                        <>
                          <option value="savings">Savings</option>
                          <option value="current">Current</option>
                        </>
                      )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">PAN Card Number</label>
                  <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="Permanent Account Number" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              {/* SECTION: Photo Attachments */}
              <div className="border-b border-zinc-100 pb-2 pt-2">
                <h4 className="font-bold text-zinc-800 text-[10px] uppercase tracking-wider text-violet-600">Profile Attachments</h4>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Profile Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs">{submitting ? "Saving..." : "Save Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}