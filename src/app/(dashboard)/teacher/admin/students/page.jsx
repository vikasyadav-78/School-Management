"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaSearch, FaUserCheck, FaIdCard, FaEdit, FaEye, FaUsers, FaToggleOn, FaToggleOff
} from "react-icons/fa";
import { 
  getTeacherStudentsMeta,
  getTeacherStudents,
  toggleTeacherStudentStatus,
  getTeacherStudentIdCard
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherStudentsManagementPage() {
  const router = useRouter();
  const dialog = useAppDialog();

  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Pagination & Filters
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

  // ID Card Modal
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [idCardData, setIdCardData] = useState(null);
  const [idCardLoading, setIdCardLoading] = useState(false);

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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMeta();
      if (!forbidden) {
        await fetchStudents(1);
      }
      setLoading(false);
    };
    init();
  }, []); // Only run once on mount

  useEffect(() => {
    if (!loading && !forbidden) {
      fetchStudents(1, true);
    }
  }, [classId, sectionId, academicYearId, status]);

  // Debounce search
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
          fetchStudents(pagination.current_page); // refresh current page
        } else {
          toast.error(response.message || `Failed to ${newStatusStr} student`);
        }
      } catch (error) {
        toast.error(error.message || `Failed to ${newStatusStr} student`);
      }
    }
  };

  const handleOpenIdCard = async (studentId) => {
    setIdCardModalOpen(true);
    setIdCardLoading(true);
    setIdCardData(null);
    try {
      const response = await getTeacherStudentIdCard(studentId);
      if (response.success) {
        setIdCardData(response);
      } else {
        toast.error(response.message || "Failed to load ID card");
        setIdCardModalOpen(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load ID card");
      setIdCardModalOpen(false);
    } finally {
      setIdCardLoading(false);
    }
  };

  const handlePrintIdCard = (themeUrl) => {
    if (themeUrl) {
      window.open(themeUrl, '_blank');
    }
  };

  if (loading) return <PageLoader />;

  if (forbidden) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto">
          <FaUserCheck className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-600 mt-2 text-sm">
            You do not have permission to manage students. Please contact the school administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader 
        title="Students Management" 
        subtitle="Manage student details and records"
        action={
          <Button 
            onClick={() => router.push('/teacher/admin/students/add')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center shadow-sm"
          >
            <FaPlus className="mr-2" /> Add Student
          </Button>
        }
      />

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-zinc-200 shadow-sm space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>
          
          <select 
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId(""); // Reset section when class changes
            }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
          >
            <option value="">All Classes</option>
            {meta?.classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white disabled:bg-zinc-50"
          >
            <option value="">All Sections</option>
            {classId && meta?.classes?.find(c => c.id === classId)?.sections?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select 
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
          >
            <option value="">All Academic Years</option>
            {meta?.academic_years?.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>

          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 relative">
          {listLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <PageLoader size="sm" />
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Student</th>
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Class Info</th>
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">IDs</th>
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Guardian</th>
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {students.length > 0 ? students.map(student => (
                <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img src={student.photo} alt={student.full_name} className="w-10 h-10 rounded-full object-cover bg-zinc-100 border border-zinc-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                          {student.first_name?.charAt(0) || student.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-zinc-900 text-sm">{student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—'}</div>
                        <div className="text-xs text-zinc-500">{student.gender || "—"} • {student.date_of_birth_label || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-semibold text-zinc-900">Class {student.class || "—"}</div>
                    <div className="text-xs text-zinc-500">Sec {student.section || "—"} • Roll: {student.roll_no || "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded inline-block mb-1">
                      {student.admission_no || "—"}
                    </div>
                    <div className="text-xs text-zinc-500">ID: {student.student_id || "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-zinc-900">{student.father_name || student.mother_name || "—"}</div>
                    <div className="text-xs text-zinc-500">{student.guardian_phone || "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                      student.is_active 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => router.push(`/teacher/admin/students/profile/${student.id}`)}
                        className="!p-2 text-zinc-500 hover:text-indigo-600"
                        title="View Profile"
                      >
                        <FaEye />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => router.push(`/teacher/admin/students/edit/${student.id}`)}
                        className="!p-2 text-zinc-500 hover:text-amber-600"
                        title="Edit Student"
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleOpenIdCard(student.id)}
                        className="!p-2 text-zinc-500 hover:text-blue-600"
                        title="ID Card"
                      >
                        <FaIdCard />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleToggleStatus(student.id, student.full_name, student.is_active)}
                        className={`!p-2 ${student.is_active ? "text-zinc-500 hover:text-rose-600" : "text-rose-500 hover:text-emerald-600"}`}
                        title={student.is_active ? "Deactivate" : "Activate"}
                      >
                        {student.is_active ? <FaToggleOn className="w-4 h-4 text-emerald-500" /> : <FaToggleOff className="w-4 h-4 text-rose-500" />}
                      </Button>
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
            <span className="text-xs text-zinc-500">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.count} total)
            </span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ID Card Modal */}
      {idCardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-zinc-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <FaIdCard className="text-indigo-500" /> Student ID Card
              </h3>
              <button 
                onClick={() => setIdCardModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 -mr-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {idCardLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <PageLoader size="md" />
                  <p className="mt-4 text-sm text-zinc-500 font-medium">Generating ID Card...</p>
                </div>
              ) : idCardData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {idCardData.student?.photo ? (
                      <img src={idCardData.student.photo} alt="Student" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                        {idCardData.student?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-zinc-900">{idCardData.student?.full_name || "Unknown Student"}</h4>
                      <p className="text-sm text-zinc-500">ID: {idCardData.student?.student_id || "—"}</p>
                      <p className="text-xs text-zinc-500 mt-1">Class {idCardData.student?.class || "—"} • Section {idCardData.student?.section || "—"}</p>
                    </div>
                  </div>

                  {idCardData.themes && idCardData.themes.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-zinc-700">Select Print Theme</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {idCardData.themes.map(theme => (
                          <button
                            key={theme.key}
                            onClick={() => handlePrintIdCard(theme.url)}
                            className="flex flex-col items-start p-3 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left"
                          >
                            <span className="font-bold text-sm text-zinc-900">{theme.label}</span>
                            <span className="text-xs text-indigo-600 font-medium mt-1">Print →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!idCardData.themes || idCardData.themes.length === 0 ? (
                    <div className="pt-4 flex justify-end">
                      <Button onClick={() => handlePrintIdCard(idCardData.print_url || idCardData.id_card_url)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        Print ID Card
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-rose-500">Failed to load ID card data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
