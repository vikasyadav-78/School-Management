"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import {
  FaPlus, FaSearch, FaUserCheck, FaIdCard, FaEdit, FaEye, FaUsers, FaToggleOn, FaToggleOff, FaChevronRight, FaChalkboardTeacher, FaArrowLeft
} from "react-icons/fa";
import {
  getTeacherStudentsMeta,
  getTeacherStudents,
  toggleTeacherStudentStatus,
  getTeacherStudentIdCard,
  getTeacherClasses
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import { api } from "@/services/api";

export default function TeacherStudentsManagementPage() {
  const router = useRouter();
  const dialog = useAppDialog();

  const { user } = useSelector((state) => state.auth);
  const { profile: teacherProfile } = useSelector((state) => state.teachers || {});

  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Class Directory Search & Month filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [selectedClassView, setSelectedClassView] = useState(null);

  // Pagination & Filters (For Roster table)
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    current_page: 1,
    last_page: 1,
    per_page: 30
  });

  const checkPermission = (featureName, canManageKey) => {
    const checkValue = (obj) => {
      if (!obj) return false;
      if (obj[canManageKey] === true || obj[canManageKey] === "true" || obj[canManageKey] === 1 || obj[canManageKey] === "1" || obj[canManageKey] === "yes" || obj[canManageKey] === "active") return true;
      if (Array.isArray(obj.enabled_features) && obj.enabled_features.includes(featureName)) return true;
      if (obj.teacher && checkValue(obj.teacher)) return true;
      if (obj.teacher_profile && checkValue(obj.teacher_profile)) return true;
      if (obj.profile && checkValue(obj.profile)) return true;
      return false;
    };
    return checkValue(user) || checkValue(teacherProfile);
  };

  const loadMeta = async () => {
    try {
      const response = await getTeacherStudentsMeta();
      if (response.success) {
        setMeta(response);
      }
    } catch (error) {
      if (error?.status === 403 || error?.message?.includes("403")) {
        setForbidden(true);
      }
    }
  };

  const fetchStudents = async (currentPage = 1, showLoader = false) => {
    try {
      if (showLoader) setListLoading(true);
      const params = {
        page: currentPage,
        per_page: 30
      };
      if (search) params.search = search;
      if (classId) params.school_class_id = classId;
      if (sectionId) params.section_id = sectionId;
      if (academicYearId) params.academic_year_id = academicYearId;
      if (status) params.status = status;

      const response = await getTeacherStudents(params);
      if (response.success) {
        setStudents(response.students || []);
        setPagination({
          count: response.count || 0,
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 30
        });
      }
    } catch (error) {
      if (error?.status === 403 || error?.message?.includes("403")) {
        setForbidden(true);
      } else {
        toast.error(error.message || "Failed to load students");
      }
    } finally {
      if (showLoader) setListLoading(false);
    }
  };

  const initData = async () => {
    setLoading(true);
    // Client side permission check
    const hasPerm = checkPermission("students", "can_manage_students");
    if (!hasPerm) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    await loadMeta();
    try {
      const clsResponse = await getTeacherClasses();
      if (clsResponse.success) {
        setClassesList(clsResponse.classes || []);
      }
      
      const studsResponse = await getTeacherStudents({ per_page: 100 });
      if (studsResponse.success) {
        setAllStudents(studsResponse.students || []);
      }
    } catch (err) {
      console.error("Teacher students load meta/classes error:", err);
    }
    await fetchStudents(1);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [user, teacherProfile]);

  useEffect(() => {
    if (!loading && !forbidden) {
      fetchStudents(1, true);
    }
  }, [classId, sectionId, academicYearId, status]);

  useEffect(() => {
    if (!loading && !forbidden) {
      const timer = setTimeout(() => {
        fetchStudents(1, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPage(newPage);
      fetchStudents(newPage, true);
    }
  };

  const handleToggleStatus = async (studentId, studentName, currentStatus) => {
    const newStatusStr = currentStatus ? "deactivate" : "activate";
    const confirmed = await dialog.confirm({
      title: `${currentStatus ? "Deactivate" : "Activate"} Student`,
      message: `Are you sure you want to ${newStatusStr} student "${studentName}"?`,
      type: currentStatus ? "warning" : "info",
      confirmText: currentStatus ? "Deactivate" : "Activate"
    });

    if (confirmed) {
      try {
        const response = await toggleTeacherStudentStatus(studentId);
        if (response.success) {
          toast.success(response.message || `Student ${newStatusStr}d successfully`);
          fetchStudents(pagination.current_page);
          
          // Also reload summaries list
          const studsResponse = await getTeacherStudents({ per_page: 100 });
          if (studsResponse.success) {
            setAllStudents(studsResponse.students || []);
          }
        } else {
          toast.error(response.message || `Failed to ${newStatusStr} student`);
        }
      } catch (error) {
        toast.error(error.message || `Failed to ${newStatusStr} student`);
      }
    }
  };

  const handleOpenIdCard = async (studentId) => {
    try {
      const idCardMeta = await getTeacherStudentIdCard(studentId);
      const url = idCardMeta.print_url || idCardMeta.id_card_url || (idCardMeta.themes && idCardMeta.themes[0]?.url);
      if (!url) {
        toast.error("Print URL not found");
        return;
      }
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const response = await api.get(url);
        printWindow.document.write(response.data);
        printWindow.document.close();
      }
    } catch (error) {
      toast.error("Failed to load authenticated ID card: " + (error.message || error));
    }
  };

  // Process and sort classes natural alphanumeric ordering
  const classSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const [selYear, selMonth] = selectedMonth.split("-").map(Number);
    const targetMonthIndex = selMonth - 1;

    const getCreationDateFromId = (id) => {
      if (!id || typeof id !== "string") return null;
      const cleanId = id.replace(/-/g, "");
      if (cleanId.length < 12) return null;
      const hexTimestamp = cleanId.substring(0, 12);
      const ms = parseInt(hexTimestamp, 16);
      if (isNaN(ms) || ms < 1000000000000) return null;
      return new Date(ms);
    };

    const getStudentDate = (s) => {
      if (s.admission_date) return new Date(s.admission_date);
      return getCreationDateFromId(s.id);
    };

    const mappedSummaries = classesList.map((cls) => {
      const metaCls = meta?.classes?.find(mc => mc.id === cls.id);
      const sectionsList = metaCls?.sections?.map(s => s.name) || [];
      const classStudents = allStudents.filter(s => s.school_class_id === cls.id);

      const newCount = classStudents.filter(s => {
        const date = getStudentDate(s);
        return date && date.getMonth() === targetMonthIndex && date.getFullYear() === selYear;
      }).length;

      return {
        id: cls.id,
        className: cls.name,
        totalStudents: cls.students_count || 0,
        sections: sectionsList,
        classTeachers: cls.class_teacher || "—",
        newStudents: newCount,
        existingStudents: Math.max(0, (cls.students_count || 0) - newCount)
      };
    });

    if (!query) return mappedSummaries;

    return mappedSummaries.filter((cls) => {
      const clsNameStr = String(cls.className).toLowerCase();
      const fullLabel = `class ${clsNameStr}`;
      return clsNameStr.includes(query) || fullLabel.includes(query);
    });
  }, [classesList, allStudents, meta, searchQuery, selectedMonth]);

  if (loading) return <PageLoader />;

  if (forbidden) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
          <FaUserCheck className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-base font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-600 mt-2 text-sm leading-relaxed">
            You do not have permission to manage students. Please contact the school administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const monthFilter = (
    <div className="flex items-center gap-2">
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value || "2026-08")}
        className="px-4 py-2 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader
        title={selectedClassView ? `Students — Class ${selectedClassView.name}` : "Students Directory"}
        subtitle={selectedClassView ? `Viewing student roster for Class ${selectedClassView.name}` : "Manage student details, classes, and sections."}
        action={!selectedClassView ? monthFilter : null}
      />

      {/* Directory Grid View */}
      {!selectedClassView ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-800">Class Directory</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <FaSearch className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search classes..."
                  className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
                />
              </div>
              <Button
                onClick={() => router.push('/teacher/admin/students/add')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center shadow-md shadow-indigo-200 transition-all text-sm"
              >
                <FaPlus className="mr-2 text-xs" /> Add Student
              </Button>
            </div>
          </div>

          {classSummaries.length === 0 ? (
            <EmptyState
              title="No classes found"
              desc={`We couldn't find any classes matching "${searchQuery}".`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {classSummaries.map((cls) => (
                <div
                  key={cls.className}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-zinc-800 text-base">Class {cls.className}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                        Sections: {cls.sections && cls.sections.length > 0 ? cls.sections.join(", ") : "—"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {cls.sections?.length || 0} {cls.sections?.length === 1 ? "Section" : "Sections"}
                    </span>
                  </div>

                  <div className="border-t border-b border-zinc-100 py-3.5 space-y-2.5 text-xs text-zinc-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-zinc-400" />
                        <span className="font-semibold text-zinc-500">Total Students</span>
                      </div>
                      <span className="font-bold text-zinc-800">{cls.totalStudents}</span>
                    </div>
                    <div className="border-t border-zinc-100/50"></div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaUserCheck className="text-emerald-500" />
                        <span className="font-semibold text-zinc-500">New Students</span>
                      </div>
                      <span className="font-bold text-emerald-600">+{cls.newStudents}</span>
                    </div>
                    <div className="border-t border-zinc-100/50"></div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] text-zinc-400 font-extrabold">E</span>
                        <span className="font-semibold text-zinc-500">Existing Students</span>
                      </div>
                      <span className="font-bold text-zinc-700">{cls.existingStudents}</span>
                    </div>
                    <div className="border-t border-zinc-100/50"></div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaChalkboardTeacher className="text-zinc-400" />
                        <span className="font-semibold text-zinc-500">Class Teacher</span>
                      </div>
                      <span className="font-bold text-zinc-800">{cls.classTeachers}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClassView({ id: cls.id, name: cls.className });
                      setClassId(cls.id);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
                  >
                    View Students
                    <FaChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Roster Table List View */
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <button
              onClick={() => {
                setSelectedClassView(null);
                setClassId("");
                setSectionId("");
              }}
              className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
            >
              <FaArrowLeft className="w-3 h-3" /> Back to Directory
            </button>
            <Button
              onClick={() => router.push('/teacher/admin/students/add')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center shadow-md shadow-indigo-200 transition-all text-sm"
            >
              <FaPlus className="mr-2 text-xs" /> Add Student
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-zinc-800 placeholder-zinc-400 bg-white"
              />
            </div>

            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-zinc-700 bg-white"
            >
              <option value="">All Sections</option>
              {meta?.classes?.find(c => c.id === classId)?.sections?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-zinc-700 bg-white"
            >
              <option value="">All Academic Years</option>
              {meta?.academic_years?.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-zinc-700 bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 relative">
            {listLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <PageLoader size="sm" />
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200">
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">Student</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">Class Info</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">IDs</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">Guardian</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-zinc-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {students.length > 0 ? students.map(student => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img src={student.photo} alt={student.full_name} className="w-10 h-10 rounded-full object-cover bg-zinc-100 border border-zinc-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100/70 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200/50 text-sm">
                            {student.first_name?.charAt(0) || student.full_name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-900 text-sm">
                            {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—'}
                          </div>
                          <div className="text-xs text-zinc-500 capitalize">
                            {student.gender || "—"} • {student.date_of_birth_label || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-medium text-zinc-800">Class {student.class || "—"}{student.stream ? ` (${student.stream})` : ""}</div>
                      <div className="text-xs text-zinc-500">Sec {student.section || "—"} • Roll: {student.roll_no || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-mono font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 inline-block mb-1">
                        {student.admission_no || "—"}
                      </div>
                      <div className="text-xs text-zinc-500">ID: {student.student_id || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm text-zinc-800 font-medium">{student.father_name || student.mother_name || "—"}</div>
                      <div className="text-xs text-zinc-500">{student.guardian_phone || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${student.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/teacher/admin/students/profile/${student.id}`)}
                          className="p-2 text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-zinc-200/60 bg-white"
                          title="View Profile"
                        >
                          <FaEye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/admin/students/edit/${student.id}`)}
                          className="p-2 text-zinc-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-zinc-200/60 bg-white"
                          title="Edit Student"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenIdCard(student.id)}
                          className="p-2 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-zinc-200/60 bg-white"
                          title="ID Card"
                        >
                          <FaIdCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id, student.full_name, student.is_active)}
                          className={`p-2 rounded-lg transition-colors border border-zinc-200/60 bg-white ${student.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-600 hover:bg-rose-50"}`}
                          title={student.is_active ? "Deactivate" : "Activate"}
                        >
                          {student.is_active ? <FaToggleOn className="w-4 h-4 text-emerald-600" /> : <FaToggleOff className="w-4 h-4 text-rose-500" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="py-12">
                      <EmptyState
                        icon={FaUsers}
                        title="No Students Found"
                        message="No students match your current filters, or none have been added yet."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-medium">
                Showing page <span className="font-semibold text-zinc-700">{pagination.current_page}</span> of <span className="font-semibold text-zinc-700">{pagination.last_page}</span> ({pagination.count} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.current_page === 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}