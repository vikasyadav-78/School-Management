"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaChalkboardTeacher, FaEdit, FaToggleOn, FaToggleOff, FaUser, FaPhone, FaGraduationCap
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

export default function TeacherTeachersManagementPage() {
  const [teachersList, setTeachersList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);

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
      toast.success(`Toggled status for ${t.full_name || t.name}`);
      refreshList();
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

      {/* Roster Listing Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : teachersList.length === 0 ? (
        <EmptyState title="No Teachers Found" desc="Add faculty teachers to your school roster." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachersList.map((t) => (
            <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                    t.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  }`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(t)}
                      className={`p-1 rounded transition-colors ${t.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"}`}
                      title={t.is_active ? "Deactivate" : "Activate"}
                    >
                      {t.is_active ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 text-zinc-400 hover:text-violet-600 rounded transition-colors"
                      title="Edit Profile"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaChalkboardTeacher className="text-violet-500" />
                {editingTeacherId ? "Modify Teacher Profile" : "Create New Teacher Record"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Employee ID</label>
                  <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Profile Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="w-full text-xs text-zinc-500" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
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
