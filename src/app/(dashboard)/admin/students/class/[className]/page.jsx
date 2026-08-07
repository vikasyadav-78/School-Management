"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import { FaSearch, FaArrowLeft, FaEnvelope, FaPhone, FaUserCircle, FaMapMarkerAlt, FaFileAlt, FaEdit, FaTrash } from "react-icons/fa";
import { 
  fetchStudentsList, 
  deleteStudentsItem, 
  fetchStudentsMeta,
  toggleStudentStatus,
  assignStudentId
} from "@/features/students/redux/studentThunk";
import Pagination from "@/components/ui/Pagination";

import { useAppDialog } from "@/context/DialogContext";
import { impersonateStudentUser } from "@/features/auth/redux/moduleThunk";
import { toast } from "sonner";

export default function ClassDetailsPage() {
  const dialog = useAppDialog();
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { className } = params;

  const { list: students, loading, meta, pagination } = useSelector((state) => state.students);

  // Set default selectedSection to "A" as requested
  
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch Meta on mount
  useEffect(() => {
    if (!meta) {
      dispatch(fetchStudentsMeta());
    }
  }, [dispatch, meta]);

  // Find class ID
  const classObj = useMemo(() => {
    if (!meta || !meta.classes) return null;
    const searchName = String(className).replace(/class/i, '').trim();
    return meta.classes.find(c => String(c.name).replace(/class/i, '').trim() === searchName);
  }, [meta, className]);

  const school_class_id = classObj ? classObj.id : null;

  // Available sections
  const availableSections = useMemo(() => {
    if (!classObj || !classObj.sections) return [];
    return classObj.sections;
  }, [classObj]);

  // Fetch List when dependencies change
  useEffect(() => {
    if (school_class_id) {
      dispatch(fetchStudentsList({
        school_class_id,
        section_id: selectedSection || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        per_page: pageSize
      }));
    }
  }, [dispatch, school_class_id, selectedSection, searchQuery, currentPage]);

  const handleDelete = async (id, name) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Student",
      message: `Are you sure you want to delete student "${name}"?`,
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (isConfirmed) {
      dispatch(deleteStudentsItem(id));
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isConfirmed = await dialog.confirm({
      title: "Change Student Status",
      message: "Are you sure you want to change this student's status?",
      type: "warning",
      confirmText: "Yes, Continue",
      cancelText: "Cancel"
    });

    if (isConfirmed) {
      const resultAction = await dispatch(toggleStudentStatus(id));
      if (toggleStudentStatus.fulfilled.match(resultAction)) {
        toast.success(currentStatus ? "Student deactivated successfully." : "Student activated successfully.");
      } else {
        toast.error("Failed to update student status.");
      }
    }
  };

  const handleAssignId = async (id) => {
    dispatch(assignStudentId(id));
  };

  const handleImpersonate = async (studentId) => {
    try {
      const resultAction = await dispatch(impersonateStudentUser(studentId));
      if (impersonateStudentUser.fulfilled.match(resultAction)) {
        toast.success("Logged in as student successfully!");
        router.push("/student/dashboard");
      } else {
        toast.error(resultAction.payload || "Failed to login as student.");
      }
    } catch (err) {
      toast.error("Failed to login as student.");
    }
  };

  const renderStudentAvatar = (student) => {
    let img = student.photo || student.profileImage;
    if (img && typeof img === "object" && img.constructor && img.constructor.name === "FileList") {
      img = img[0];
    }
    if (img instanceof File || (img && typeof img === "object" && img.name && img.size)) {
      try {
        const objectUrl = URL.createObjectURL(img);
        return <img src={objectUrl} alt={student.full_name} className="w-full h-full object-cover rounded-full" />;
      } catch (e) {
        return <FaUserCircle className="text-zinc-300 w-full h-full" />;
      }
    }
    const hasImageString = img && typeof img === "string" && (
      img.includes("/") || img.includes(".") || img.length > 10
    );
    if (hasImageString) {
      return <img src={img} alt={student.full_name} className="w-full h-full object-cover rounded-full" />;
    }
    return <FaUserCircle className="text-zinc-300 w-full h-full" />;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`Class ${className} `}
        subtitle={`Roster listing and academic statistics for all sections of Class ${className}.`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/admin/students/add?class_id=${school_class_id || ""}&section_id=${selectedSection || ""}`}>
              <Button size="sm" className="whitespace-nowrap shadow-sm">
                Add Student
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button variant="outline" size="sm">
                <FaArrowLeft className="mr-1.5" /> Back to Directory
              </Button>
            </Link>
          </div>
        }
      />

      {/* Class Statistics Header Summary Row */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Class {className}</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Total Found: <span className="font-bold text-zinc-700">{pagination?.total || 0} Students</span>
            </p>
          </div>

          {/* Filtering Controls Container */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Section</span>
                <div className="flex flex-wrap gap-2">
                  <button
                      onClick={() => { setSelectedSection(""); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${selectedSection === ""
                          ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                    >
                      All Sections
                    </button>
                  {availableSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => { setSelectedSection(sec.id); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${String(selectedSection) === String(sec.id)
                          ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Student List Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider"> Students List </h3>
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, admission no..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <PageLoader />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          desc="We couldn't find any student records matching your filter or search input."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-150 text-left border-collapse">
              <thead className="bg-zinc-50/50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Roll No
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Photo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Class
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Section
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {students.map((student, idx) => {
                  const rollNo = String((currentPage - 1) * pageSize + idx + 1).padStart(2, "0");
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-zinc-50/40 transition-colors"
                    >
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-zinc-800">
                        {rollNo}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div
                          onClick={() => router.push(`/admin/students/profile/${student.id}`)}
                          className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shadow-inner overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 border border-zinc-100"
                        >
                          {renderStudentAvatar(student)}
                        </div>
                      </td>
                      <td
                        onClick={() => router.push(`/admin/students/profile/${student.id}`)}
                        className="px-6 py-4.5 whitespace-nowrap text-xs font-medium text-zinc-500 cursor-pointer hover:text-violet-600 transition-colors"
                      >
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.gender || "N/A"}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.class || "N/A"}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.section || "N/A"}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {student.is_active ? "Active" : "Inactive"}
                         </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-2">
                           <Link href={`/admin/students/profile/${student.id}`}>
                             <button
                               title="View Details"
                               className="bg-zinc-50 hover:bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-200 text-xs font-bold"
                             >
                               View
                             </button>
                           </Link>
                           <Link href={`/admin/students/edit/${student.id}`}>
                             <button
                               title="Edit Student"
                               className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-blue-200 text-xs font-bold"
                             >
                               Edit
                             </button>
                           </Link>
                            <div className="inline-flex items-center justify-center h-7">
                              <button
                                onClick={() => handleToggleStatus(student.id, student.is_active)}
                                title={student.is_active ? "Deactivate Student" : "Activate Student"}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  student.is_active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    student.is_active ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                           <button
                             onClick={() => handleDelete(student.id, student.full_name)}
                             title="Delete Student"
                             className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-red-200 text-xs font-bold"
                           >
                             Delete
                           </button>
                            <button
                              onClick={() => handleImpersonate(student.id)}
                              title="Login as Student"
                              className="bg-violet-50 hover:bg-violet-100 text-violet-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-violet-200 text-xs font-bold"
                            >
                              Login
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalCount={pagination?.total || 0}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
