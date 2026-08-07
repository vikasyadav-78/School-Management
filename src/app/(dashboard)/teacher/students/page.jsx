"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaPlus, FaTimes, FaUser, FaBuilding, FaCalendarAlt, 
  FaEye, FaEdit, FaToggleOn, FaToggleOff, FaIdCard, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock
} from "react-icons/fa";
import { 
  getTeacherStudentsMeta, 
  getTeacherStudents, 
  addTeacherStudent, 
  getTeacherStudentDetail, 
  updateTeacherStudent, 
  toggleTeacherStudentStatus,
  getTeacherStudentIdCard 
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [apaarId, setApaarId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSectionId, setFormSectionId] = useState("");
  const [formAcademicYearId, setFormAcademicYearId] = useState("");
  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  // New document & ID fields
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [birthCertificateName, setBirthCertificateName] = useState("");
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [aadhaarCardName, setAadhaarCardName] = useState("");
  const [transferCertificate, setTransferCertificate] = useState(null);
  const [transferCertificateName, setTransferCertificateName] = useState("");

  const [existingBirthCertificate, setExistingBirthCertificate] = useState(null);
  const [existingAadhaarCard, setExistingAadhaarCard] = useState(null);
  const [existingTransferCertificate, setExistingTransferCertificate] = useState(null);

  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualAdmissionNo, setManualAdmissionNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [idCardData, setIdCardData] = useState(null);
  const [loadingIdCard, setLoadingIdCard] = useState(false);

  // 1. Fetch metadata on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const metaData = await getTeacherStudentsMeta();
        setMeta(metaData);
        
        if (metaData.classes && metaData.classes.length > 0) {
          setFormClassId(metaData.classes[0].id.toString());
          if (metaData.classes[0].sections && metaData.classes[0].sections.length > 0) {
            setFormSectionId(metaData.classes[0].sections[0].id.toString());
          }
        }
        if (metaData.current_academic_year_id) {
          setFormAcademicYearId(metaData.current_academic_year_id);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setForbidden(true);
        } else {
          toast.error("Failed to load students configurations: " + (err.message || err));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  // 2. Fetch students list with search and filters (server-side)
  const fetchStudentsList = useCallback(async () => {
    if (forbidden) return;
    try {
      setListLoading(true);
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedClassId !== "all") {
        params.school_class_id = selectedClassId;
      }
      if (selectedSectionId !== "all") {
        params.section_id = selectedSectionId;
      }
      const data = await getTeacherStudents(params);
      setStudents(data.students || data.data || data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        toast.error("Failed to load student list: " + (err.message || err));
      }
    } finally {
      setListLoading(false);
    }
  }, [forbidden, searchQuery, selectedClassId, selectedSectionId]);

  useEffect(() => {
    fetchStudentsList();
  }, [fetchStudentsList]);

  const handleClassChange = (classId) => {
    setFormClassId(classId);
    const cls = meta?.classes?.find(c => c.id.toString() === classId);
    if (cls?.sections && cls.sections.length > 0) {
      setFormSectionId(cls.sections[0].id.toString());
    } else {
      setFormSectionId("");
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setRollNo("");
    setApaarId("");
    if (meta?.classes && meta.classes.length > 0) {
      setFormClassId(meta.classes[0].id.toString());
      if (meta.classes[0].sections && meta.classes[0].sections.length > 0) {
        setFormSectionId(meta.classes[0].sections[0].id.toString());
      }
    }
    setFormAcademicYearId(meta?.current_academic_year_id || "");
    setGender("male");
    setDob("");
    setAdmissionDate("");
    setFatherName("");
    setMotherName("");
    setGuardianPhone("");
    setAddress("");
    setPhoto(null);
    setPhotoPreview("");
    setBirthCertificate(null);
    setBirthCertificateName("");
    setAadhaarCard(null);
    setAadhaarCardName("");
    setTransferCertificate(null);
    setTransferCertificateName("");
    setExistingBirthCertificate(null);
    setExistingAadhaarCard(null);
    setExistingTransferCertificate(null);
    setAutoGenerateId(true);
    setManualStudentId("");
    setManualAdmissionNo("");
    setEmail("");
    setPassword("");
    setIsActive(true);
    setFormError("");
    setEditingStudentId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = async (student) => {
    try {
      resetForm();
      setLoading(true);
      const detailData = await getTeacherStudentDetail(student.id);
      const s = detailData.student || detailData.data || detailData || student;
      
      setEditingStudentId(s.id);
      setFirstName(s.first_name || s.full_name?.split(" ")[0] || "");
      setLastName(s.last_name || s.full_name?.split(" ").slice(1).join(" ") || "");
      setRollNo(s.roll_no || "");
      setApaarId(s.apaar_id || "");
      setFormClassId(s.school_class_id || "");
      setFormSectionId(s.section_id || "");
      setFormAcademicYearId(s.academic_year_id || "");
      setGender(s.gender || "male");
      setDob(s.date_of_birth || "");
      setAdmissionDate(s.admission_date || "");
      setFatherName(s.father_name || "");
      setMotherName(s.mother_name || "");
      setGuardianPhone(s.guardian_phone || "");
      setAddress(s.address || "");
      setIsActive(!!s.is_active);
      setAutoGenerateId(false);
      setManualStudentId(s.student_id || "");
      setManualAdmissionNo(s.admission_no || "");
      if (s.photo) {
        setPhotoPreview(s.photo);
      }

      if (s.documents) {
        if (s.documents.birth_certificate) {
          setExistingBirthCertificate(s.documents.birth_certificate);
        }
        if (s.documents.aadhaar) {
          setExistingAadhaarCard(s.documents.aadhaar);
        }
        if (s.documents.transfer_certificate) {
          setExistingTransferCertificate(s.documents.transfer_certificate);
        }
      }

      setIsFormModalOpen(true);
    } catch (err) {
      toast.error("Failed to load student details for editing: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (student) => {
    try {
      const detailed = await getTeacherStudentDetail(student.id);
      const detailedStu = detailed.student || detailed.data || detailed;
      setActiveStudent(detailedStu);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load student details: " + (err.message || err));
    }
  };

  const handleViewIdCard = async (studentId) => {
    try {
      setLoadingIdCard(true);
      setIdCardData(null);
      setIsIdCardModalOpen(true);
      const data = await getTeacherStudentIdCard(studentId);
      setIdCardData(data.id_card || data.data || data);
    } catch (err) {
      toast.error("Failed to load ID card details: " + (err.message || err));
      setIsIdCardModalOpen(false);
    } finally {
      setLoadingIdCard(false);
    }
  };

  const handlePrintIdCard = (student) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let url = student.id_card_url || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/teacher/students/${student.id}/id-card?format=print`;
    if (token) {
      url += (url.includes("?") ? "&" : "?") + `token=${token}`;
    }
    window.open(url, "_blank");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo image size cannot exceed 2MB limit.");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (e, docSetter, nameSetter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Document size cannot exceed 5MB limit.");
        return;
      }
      docSetter(file);
      nameSetter(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim() || !formClassId || !formSectionId || !formAcademicYearId || !dob) {
      setFormError("First Name, Class, Section, Academic Year, and Date of Birth are required fields.");
      return;
    }

    // Validate DOB is in the past
    if (new Date(dob) >= new Date()) {
      setFormError("Date of Birth must be in the past (before today).");
      return;
    }

    // Manual ID validations
    if (!autoGenerateId && !editingStudentId) {
      if (!manualStudentId.trim() || !manualAdmissionNo.trim()) {
        setFormError("Student ID and Admission Number are required when Auto Generate is off.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      if (lastName.trim()) formData.append("last_name", lastName.trim());
      if (rollNo.trim()) formData.append("roll_no", rollNo.trim());
      if (apaarId.trim()) formData.append("apaar_id", apaarId.trim());
      formData.append("school_class_id", formClassId);
      formData.append("section_id", formSectionId);
      formData.append("academic_year_id", formAcademicYearId);
      formData.append("gender", gender);
      formData.append("date_of_birth", dob);
      if (admissionDate) formData.append("admission_date", admissionDate);
      if (fatherName.trim()) formData.append("father_name", fatherName.trim());
      if (motherName.trim()) formData.append("mother_name", motherName.trim());
      if (guardianPhone.trim()) formData.append("guardian_phone", guardianPhone.trim());
      if (address.trim()) formData.append("address", address.trim());
      formData.append("is_active", isActive ? "1" : "0");
      
      // Auto generate parameters (only on creation)
      if (!editingStudentId) {
        formData.append("auto_generate_id", autoGenerateId ? "true" : "false");
        if (!autoGenerateId) {
          formData.append("student_id", manualStudentId.trim());
          formData.append("admission_no", manualAdmissionNo.trim());
        }
        if (email.trim()) {
          formData.append("email", email.trim());
          if (password) formData.append("password", password);
        }
      }

      if (photo) {
        formData.append("photo", photo);
      }
      if (birthCertificate) {
        formData.append("birth_certificate", birthCertificate);
      }
      if (aadhaarCard) {
        formData.append("aadhaar_card", aadhaarCard);
      }
      if (transferCertificate) {
        formData.append("transfer_certificate", transferCertificate);
      }

      if (editingStudentId) {
        await updateTeacherStudent(editingStudentId, formData);
        toast.success("Student updated successfully!");
        // Re-fetch details immediately to update UI documents display
        try {
          const detailed = await getTeacherStudentDetail(editingStudentId);
          const updatedStu = detailed.student || detailed.data || detailed;
          if (activeStudent && activeStudent.id === editingStudentId) {
            setActiveStudent(updatedStu);
          }
        } catch (err) {
          console.error("Failed to re-fetch student details:", err);
        }
      } else {
        await addTeacherStudent(formData);
        toast.success("Student registered successfully!");
      }

      setIsFormModalOpen(false);
      fetchStudentsList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save student profile.");
      toast.error(err.response?.data?.message || err.message || "Failed to save student profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      await toggleTeacherStudentStatus(student.id);
      toast.success(`Toggled active status for ${student.full_name || student.first_name}`);
      fetchStudentsList();
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
          Students feature is not enabled for your account. Contact school admin.
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

  // Find sections for active class filter dropdown
  const filterClassObj = meta?.classes?.find(c => c.id.toString() === selectedClassId);
  const filterSections = filterClassObj?.sections || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Student Roster Manager"
          subtitle="Register new pupils, update profiles, toggle active status, and track admissions."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Student
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search students by name, ID, roll, admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Class</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId("all");
              }}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Classes</option>
              {meta?.classes?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Section</span>
            <select
              value={selectedSectionId}
              disabled={selectedClassId === "all"}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 focus:bg-white focus:border-violet-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="all">All Sections</option>
              {filterSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : students.length === 0 ? (
        <EmptyState 
          title="No Students Found"
          desc="Try adjusting your class/section filter dropdowns or typing a different search query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">ID / Admission</th>
                  <th className="px-6 py-4 whitespace-nowrap">Student Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Class & Section</th>
                  <th className="px-6 py-4 whitespace-nowrap">Gender</th>
                  <th className="px-6 py-4 whitespace-nowrap">Admission Date</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-500">
                      <div className="space-y-0.5">
                        <span className="block text-zinc-800 font-bold">{student.student_id}</span>
                        <span className="block text-[9px] text-zinc-400">Adm: {student.admission_no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img 
                            src={student.photo} 
                            alt={student.full_name} 
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs">
                            {(student.full_name || student.first_name || "S").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-zinc-800 block">{student.full_name || `${student.first_name} ${student.last_name || ""}`}</span>
                          <span className="text-[9px] text-zinc-400">Roll: {student.roll_no || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-800">
                      {student.class} - {student.section || "A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-zinc-500 font-semibold">
                      {student.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-semibold">
                      {student.admission_date || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                        student.is_active 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(student)}
                          className="bg-zinc-50 hover:bg-zinc-100 text-zinc-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                          title="View Details"
                        >
                          <FaEye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 hover:bg-violet-50 rounded-lg text-zinc-500 hover:text-violet-600 transition-colors"
                          title="Edit Student"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`p-1 rounded-lg transition-colors ${
                            student.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"
                          }`}
                          title={student.is_active ? "Deactivate" : "Activate"}
                        >
                          {student.is_active ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
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

      {/* Add / Edit Student Profile Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaUser className="text-violet-500" />
                {editingStudentId ? "Update Student Profile" : "Register New Student"}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold">
                  {formError}
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Personal Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">First Name *</label>
                    <input 
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Ramesh"
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
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold text-zinc-700 cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Date of Birth *</label>
                    <input 
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">APAAR ID</label>
                    <input 
                      type="text"
                      value={apaarId}
                      onChange={(e) => setApaarId(e.target.value)}
                      placeholder="e.g. 789456123652"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* ID Autogeneration Option (Only for Creation) */}
              {!editingStudentId && (
                <div className="space-y-3 pt-2 bg-zinc-50/50 p-4 rounded-xl border border-zinc-150">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="autoGenCheck"
                      checked={autoGenerateId}
                      onChange={(e) => setAutoGenerateId(e.target.checked)}
                      className="w-4 h-4 rounded text-violet-600 border-zinc-300 focus:ring-violet-500 cursor-pointer"
                    />
                    <label htmlFor="autoGenCheck" className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wide cursor-pointer select-none">
                      Auto-generate Student ID and Admission Number
                    </label>
                  </div>

                  {!autoGenerateId && (
                    <div className="grid grid-cols-2 gap-4 pt-2 animate-scale-up">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Manual Student ID *</label>
                        <input 
                          type="text"
                          required
                          value={manualStudentId}
                          onChange={(e) => setManualStudentId(e.target.value)}
                          placeholder="e.g. STU-SCH-0001"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Manual Admission No *</label>
                        <input 
                          type="text"
                          required
                          value={manualAdmissionNo}
                          onChange={(e) => setManualAdmissionNo(e.target.value)}
                          placeholder="e.g. ADM-SCH-2026-0001"
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Login Account Details (Optional) */}
              {!editingStudentId && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Optional Login Account</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Student Email</label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-3 text-zinc-400 w-3 h-3" />
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="student@school.com"
                          className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Student Password</label>
                      <div className="relative">
                        <FaLock className="absolute left-3 top-3 text-zinc-400 w-3 h-3" />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Enrollment */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Class Enrollment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">School Class *</label>
                    <select
                      value={formClassId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold text-zinc-700 cursor-pointer"
                    >
                      {meta?.classes?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section *</label>
                    <select
                      value={formSectionId}
                      onChange={(e) => setFormSectionId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold text-zinc-700 cursor-pointer"
                    >
                      {meta?.classes?.find(c => c.id.toString() === formClassId)?.sections?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      )) || <option value="">No sections configured</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Year *</label>
                    <select
                      value={formAcademicYearId}
                      onChange={(e) => setFormAcademicYearId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold text-zinc-700 cursor-pointer"
                    >
                      {meta?.academic_years?.map(y => (
                        <option key={y.id} value={y.id}>{y.name} {y.is_current ? "(Current)" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Roll No</label>
                    <input 
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Admission Date</label>
                    <input 
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Parent & Contact details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Parents & Contact information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Father Name</label>
                    <input 
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Father's Full Name"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Mother Name</label>
                    <input 
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Mother's Full Name"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Guardian Phone</label>
                    <input 
                      type="tel"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Address Description</label>
                  <textarea 
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential address..."
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                  />
                </div>
              </div>

              {/* Photo attachment & status */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Photo & Status</h4>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="relative group w-20 h-20 rounded-full bg-zinc-200 border border-zinc-300 overflow-hidden flex items-center justify-center shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaCamera className="w-6 h-6 text-zinc-400" />
                    )}
                    <label className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      Upload
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Attach ID Photo</span>
                    <p className="text-[9px] text-zinc-400 leading-normal">
                      PNG, JPG formats supported. Keep profile pictures clear (Max 2MB).
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
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Documents & Certificates (Max 5MB)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Birth Certificate */}
                  <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Birth Certificate</label>
                    <div className="flex flex-col gap-2">
                      <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                        <span>{birthCertificateName || existingBirthCertificate ? "Change File" : "Choose File"}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange(e, setBirthCertificate, setBirthCertificateName)} 
                          className="hidden" 
                        />
                      </label>
                      {birthCertificateName ? (
                        <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                          {birthCertificateName}
                        </span>
                      ) : existingBirthCertificate ? (
                        <div className="flex items-center justify-between mt-1 px-1 bg-emerald-50 rounded p-1 border border-emerald-100">
                          <span className="text-[9px] text-emerald-700 font-extrabold truncate max-w-[80px]">✔ {existingBirthCertificate.file_name || "Uploaded"}</span>
                          <a href={existingBirthCertificate.url} target="_blank" rel="noreferrer" className="text-[9px] text-violet-600 font-bold hover:underline">View</a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* Aadhaar Card */}
                  <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Aadhaar Card</label>
                    <div className="flex flex-col gap-2">
                      <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                        <span>{aadhaarCardName || existingAadhaarCard ? "Change File" : "Choose File"}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange(e, setAadhaarCard, setAadhaarCardName)} 
                          className="hidden" 
                        />
                      </label>
                      {aadhaarCardName ? (
                        <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                          {aadhaarCardName}
                        </span>
                      ) : existingAadhaarCard ? (
                        <div className="flex items-center justify-between mt-1 px-1 bg-emerald-50 rounded p-1 border border-emerald-100">
                          <span className="text-[9px] text-emerald-700 font-extrabold truncate max-w-[80px]">✔ {existingAadhaarCard.file_name || "Uploaded"}</span>
                          <a href={existingAadhaarCard.url} target="_blank" rel="noreferrer" className="text-[9px] text-violet-600 font-bold hover:underline">View</a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* Transfer Certificate */}
                  <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Transfer Certificate</label>
                    <div className="flex flex-col gap-2">
                      <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                        <span>{transferCertificateName || existingTransferCertificate ? "Change File" : "Choose File"}</span>
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange(e, setTransferCertificate, setTransferCertificateName)} 
                          className="hidden" 
                        />
                      </label>
                      {transferCertificateName ? (
                        <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                          {transferCertificateName}
                        </span>
                      ) : existingTransferCertificate ? (
                        <div className="flex items-center justify-between mt-1 px-1 bg-emerald-50 rounded p-1 border border-emerald-100">
                          <span className="text-[9px] text-emerald-700 font-extrabold truncate max-w-[80px]">✔ {existingTransferCertificate.file_name || "Uploaded"}</span>
                          <a href={existingTransferCertificate.url} target="_blank" rel="noreferrer" className="text-[9px] text-violet-600 font-bold hover:underline">View</a>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
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
                  {submitting ? "Saving Profile..." : (editingStudentId ? "Save Updates" : "Register Student")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Inspection Modal */}
      {isDetailModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaIdCard className="text-violet-500" />
                Student File Inspector
              </h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Header profile area */}
              <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                {activeStudent.photo ? (
                  <img 
                    src={activeStudent.photo} 
                    alt={activeStudent.full_name} 
                    className="w-14 h-14 rounded-full object-cover border border-zinc-200 shadow-sm" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-lg shadow-sm">
                    {(activeStudent.full_name || activeStudent.first_name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-extrabold text-zinc-800 leading-tight">
                    {activeStudent.full_name || `${activeStudent.first_name} ${activeStudent.last_name || ""}`}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                    <span>ID: {activeStudent.student_id}</span>
                    <span>•</span>
                    <span>Roll No: {activeStudent.roll_no || "N/A"}</span>
                  </div>
                </div>

                <div className="ml-auto">
                  <span className={`inline-flex px-2.5 py-0.5 text-[8px] font-extrabold rounded-lg border uppercase tracking-wider ${
                    activeStudent.is_active || activeStudent.is_active === undefined
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {(activeStudent.is_active || activeStudent.is_active === undefined) ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Data attributes list */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-zinc-600">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">APAAR ID</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.apaar_id || "Not Linked"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Admission Number</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.admission_no || "N/A"}</span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Class & Section</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.class || "class-1"} - {activeStudent.section || "A"}</span>
                </div>
                <div className="space-y-1 border-t border-zinc-100 pt-3">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Academic Session</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.academic_year || "2026-2027"}</span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Gender</span>
                  <span className="text-zinc-800 text-xs font-extrabold capitalize">{activeStudent.gender}</span>
                </div>
                <div className="space-y-1 border-t border-zinc-100 pt-3">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.date_of_birth_label || activeStudent.date_of_birth || "—"}</span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Father Name</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.father_name || "—"}</span>
                </div>
                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Mother Name</span>
                  <span className="text-zinc-800 text-xs font-extrabold">{activeStudent.mother_name || "—"}</span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Guardian Phone</span>
                  <span className="text-zinc-800 text-xs font-extrabold flex items-center gap-1.5">
                    <FaPhone className="text-zinc-400 w-3 h-3" />
                    {activeStudent.guardian_phone || "No contact configured"}
                  </span>
                </div>

                <div className="space-y-1 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Residential Address</span>
                  <span className="text-zinc-800 text-xs font-extrabold flex items-start gap-1.5 leading-relaxed">
                    <FaMapMarkerAlt className="text-zinc-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {activeStudent.address || "—"}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Uploaded Documents</span>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {/* Birth Certificate */}
                    <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-150">
                      <div className="space-y-0.5 max-w-[60%]">
                        <span className="font-bold text-zinc-700 text-[10px] block">Birth Certificate</span>
                        {activeStudent.documents?.birth_certificate && (
                          <span className="text-[9px] text-emerald-600 font-bold block truncate">✔ {activeStudent.documents.birth_certificate.file_name}</span>
                        )}
                      </div>
                      {activeStudent.documents?.birth_certificate ? (
                        <div className="flex gap-2 shrink-0">
                          <a href={activeStudent.documents.birth_certificate.url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 font-extrabold hover:underline">View</a>
                          <span className="text-zinc-300">|</span>
                          <a href={activeStudent.documents.birth_certificate.url} download className="text-[10px] text-violet-600 font-extrabold hover:underline">Download</a>
                        </div>
                      ) : (
                        <span className="text-zinc-450 text-[9px] font-bold uppercase shrink-0">Not Uploaded</span>
                      )}
                    </div>

                    {/* Aadhaar Card */}
                    <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-150">
                      <div className="space-y-0.5 max-w-[60%]">
                        <span className="font-bold text-zinc-700 text-[10px] block">Aadhaar Card</span>
                        {activeStudent.documents?.aadhaar && (
                          <span className="text-[9px] text-emerald-600 font-bold block truncate">✔ {activeStudent.documents.aadhaar.file_name}</span>
                        )}
                      </div>
                      {activeStudent.documents?.aadhaar ? (
                        <div className="flex gap-2 shrink-0">
                          <a href={activeStudent.documents.aadhaar.url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 font-extrabold hover:underline">View</a>
                          <span className="text-zinc-300">|</span>
                          <a href={activeStudent.documents.aadhaar.url} download className="text-[10px] text-violet-600 font-extrabold hover:underline">Download</a>
                        </div>
                      ) : (
                        <span className="text-zinc-450 text-[9px] font-bold uppercase shrink-0">Not Uploaded</span>
                      )}
                    </div>

                    {/* Transfer Certificate */}
                    <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-150">
                      <div className="space-y-0.5 max-w-[60%]">
                        <span className="font-bold text-zinc-700 text-[10px] block">Transfer Certificate</span>
                        {activeStudent.documents?.transfer_certificate && (
                          <span className="text-[9px] text-emerald-600 font-bold block truncate">✔ {activeStudent.documents.transfer_certificate.file_name}</span>
                        )}
                      </div>
                      {activeStudent.documents?.transfer_certificate ? (
                        <div className="flex gap-2 shrink-0">
                          <a href={activeStudent.documents.transfer_certificate.url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 font-extrabold hover:underline">View</a>
                          <span className="text-zinc-300">|</span>
                          <a href={activeStudent.documents.transfer_certificate.url} download className="text-[10px] text-violet-600 font-extrabold hover:underline">Download</a>
                        </div>
                      ) : (
                        <span className="text-zinc-450 text-[9px] font-bold uppercase shrink-0">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-zinc-100 pt-3 col-span-2">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Student ID Card</span>
                  <div className="flex items-center gap-3 mt-1 bg-zinc-50 border border-zinc-150 p-2.5 rounded-xl">
                    <FaIdCard className="text-violet-500 w-5 h-5 shrink-0" />
                    <div className="max-w-[55%]">
                      <span className="text-[10px] text-zinc-700 font-extrabold block">Generate Student Identity Card</span>
                      <span className="text-[8px] text-zinc-400 block mt-0.5">Direct preview or printable design versions generated from dynamic details records.</span>
                    </div>
                    <div className="ml-auto flex gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleViewIdCard(activeStudent.id)}
                        className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-lg hover:bg-zinc-50 transition-all text-[9px] uppercase cursor-pointer"
                      >
                        View
                      </button>
                      <button 
                        type="button"
                        onClick={() => handlePrintIdCard(activeStudent)}
                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-all text-[9px] uppercase cursor-pointer"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
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

      {/* Student ID Card Preview Modal */}
      {isIdCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaIdCard className="text-violet-500" />
                Identity Card Preview
              </h3>
              <button 
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-zinc-100/50">
              {loadingIdCard ? (
                <div className="w-[290px] h-[430px] bg-white rounded-2xl border border-zinc-200/60 shadow-lg p-6 flex flex-col items-center justify-between animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 mb-2 mx-auto"></div>
                  <div className="h-4 bg-zinc-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="w-20 h-20 rounded-full bg-zinc-200 mx-auto mb-4"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-3 bg-zinc-200 rounded w-2/3 mx-auto mb-2"></div>
                  <div className="h-3 bg-zinc-200 rounded w-2/3 mx-auto mb-4"></div>
                  <div className="w-16 h-16 bg-zinc-200 rounded-lg mx-auto"></div>
                </div>
              ) : idCardData ? (
                <div className="w-[290px] h-[430px] bg-white rounded-2xl border border-zinc-200 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  {/* Decorative Header Bar */}
                  <div className="bg-violet-600 px-4 py-3 text-center text-white shrink-0 relative">
                    <div className="flex items-center justify-center gap-1.5">
                      {idCardData.school_logo && (
                        <img src={idCardData.school_logo} alt="Logo" className="w-5 h-5 object-contain" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider block text-white select-none truncate max-w-[200px]">
                        {idCardData.school_name || "Tanishq Tour and Travels"}
                      </span>
                    </div>
                    <span className="text-[7px] text-violet-100 font-bold uppercase tracking-widest block mt-0.5">STUDENT IDENTITY CARD</span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col items-center justify-center text-center space-y-3">
                    {/* Photo */}
                    <div className="relative w-16 h-16 rounded-full bg-zinc-100 border-2 border-violet-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                      {idCardData.student_photo ? (
                        <img src={idCardData.student_photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <FaUser className="text-zinc-300 w-8 h-8" />
                      )}
                    </div>

                    {/* Name & Title */}
                    <div>
                      <h4 className="font-black text-zinc-800 text-xs tracking-tight">
                        {idCardData.student_name || "Vikas Yadav"}
                      </h4>
                      <span className="text-[7px] font-bold text-violet-600 uppercase tracking-widest mt-0.5 block">
                        Class {idCardData.class || "class-2"} - {idCardData.section || "B"}
                      </span>
                    </div>

                    {/* Key Attributes List */}
                    <div className="w-full space-y-1 text-[8px] text-zinc-500 font-bold px-2 pt-2 border-t border-zinc-100">
                      <div className="flex justify-between">
                        <span>STUDENT ID</span>
                        <span className="text-zinc-850 font-black">{idCardData.student_id || "STU-46465-0008"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ADMISSION NO</span>
                        <span className="text-zinc-850 font-black">{idCardData.admission_no || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROLL NO</span>
                        <span className="text-zinc-850 font-black">{idCardData.roll_no || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DATE OF BIRTH</span>
                        <span className="text-zinc-850 font-black">{idCardData.date_of_birth || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FATHER NAME</span>
                        <span className="text-zinc-850 font-black truncate max-w-[120px]">{idCardData.father_name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GUARDIAN PHONE</span>
                        <span className="text-zinc-850 font-black">{idCardData.guardian_phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with QR */}
                  <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                    <div className="text-left">
                      <span className="text-[6px] text-zinc-400 font-extrabold uppercase block">ACADEMIC SESSION</span>
                      <span className="text-[8px] text-zinc-700 font-black block">{idCardData.academic_year || "2026-2027"}</span>
                    </div>
                    {idCardData.qr_image ? (
                      <img src={idCardData.qr_image} alt="QR Code" className="w-8 h-8 object-contain animate-fade-in" />
                    ) : idCardData.qr_code && (
                      <div className="w-8 h-8 bg-zinc-200 rounded flex items-center justify-center text-[5px] text-zinc-500 font-bold">QR</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-zinc-450 font-bold">Failed to render preview.</div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Close
              </button>
              {idCardData && (
                <button
                  type="button"
                  onClick={() => handlePrintIdCard(activeStudent)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  Print Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
