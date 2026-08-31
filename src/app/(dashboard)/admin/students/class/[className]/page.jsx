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
import { FaSearch, FaArrowLeft, FaEnvelope, FaPhone, FaUserCircle, FaMapMarkerAlt, FaFileAlt, FaEdit, FaTrash, FaTimes, FaDownload, FaUpload, FaFileExcel } from "react-icons/fa";
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
import { getList, downloadImportTemplate, importStudents } from "@/features/students/services/module.service";

export default function ClassDetailsPage() {
  const dialog = useAppDialog();
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { className } = params;
  const isStreamClass = className.includes("11") || className.includes("12");

  const { list: students, loading, meta, pagination } = useSelector((state) => state.students);

  // Set default selectedSection to "A" as requested
  
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Bulk Import & Export States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  const handleDownloadTemplate = async () => {
    try {
      toast.loading("Downloading template...", { id: "download-template" });
      const blob = await downloadImportTemplate();
      
      if (blob.type === "application/json") {
        const text = await blob.text();
        let errObj = {};
        try {
          errObj = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Failed to parse JSON error blob", e);
        }
        throw new Error(errObj.message || "Failed to download template.");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Template downloaded successfully!", { id: "download-template" });
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to download template.";
      
      try {
        if (err instanceof Blob) {
          const text = await err.text();
          const errObj = JSON.parse(text);
          errorMsg = errObj.message || errorMsg;
        } else if (err && err.response && err.response.data instanceof Blob) {
          const text = await err.response.data.text();
          const errObj = JSON.parse(text);
          errorMsg = errObj.message || errorMsg;
        } else if (err && err.message) {
          errorMsg = err.message;
        }
      } catch (e) {
        console.error("Failed to parse error blob", e);
      }
      
      toast.error(errorMsg, { id: "download-template" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Please select a valid Excel file (.xlsx)");
        return;
      }
      setSelectedFile(file);
      setImportErrors([]);
      setImportSuccessMessage("");
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to import.");
      return;
    }

    try {
      setUploading(true);
      setImportErrors([]);
      setImportSuccessMessage("");
      toast.loading("Importing students...", { id: "import-students" });

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await importStudents(formData);
      
      if (res.success) {
        toast.success(res.message || "Students imported successfully!", { id: "import-students" });
        setImportSuccessMessage(res.message || "Students imported successfully!");
        setSelectedFile(null);
        
        // Refresh list
        if (school_class_id) {
          dispatch(fetchStudentsList({
            school_class_id,
            section_id: selectedSection || undefined,
            search: searchQuery || undefined,
            page: currentPage,
            per_page: pageSize
          }));
        }

        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccessMessage("");
        }, 1500);
      } else {
        toast.error(res.message || "Failed to import students.", { id: "import-students" });
        if (res.errors) {
          const errs = Object.values(res.errors).flat();
          setImportErrors(errs);
        } else if (res.failures) {
          const errs = res.failures.map(f => `Row ${f.row}: ${f.errors.join(", ")}`);
          setImportErrors(errs);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to import students.", { id: "import-students" });
      const data = err.response?.data;
      if (data?.errors) {
        const errs = Object.values(data.errors).flat();
        setImportErrors(errs);
      } else if (data?.failures) {
        const errs = data.failures.map(f => `Row ${f.row}: ${f.errors.join(", ")}`);
        setImportErrors(errs);
      } else if (data?.message) {
        setImportErrors([data.message]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: "export-students" });

      // Fetch all students (up to 10000) for the active filters
      const res = await getList({
        school_class_id,
        section_id: selectedSection || undefined,
        search: searchQuery || undefined,
        per_page: 10000
      });

      const studentsToExport = res.students || res.data?.students || res.data || [];

      if (studentsToExport.length === 0) {
        toast.error("No student data available to export.", { id: "export-students" });
        return;
      }

      if (format === "excel") {
        const XLSX = await import("xlsx");
        
        const worksheetData = [
          ["Name", "Student ID", "Phone", "Admission Number", "Class", "Academic Year", "QR Code", "QR Link"]
        ];

        const apiBase = process.env.NEXT_PUBLIC_BASE_URL || "";
        const baseUrl = apiBase.replace(/\/api$/, "");

        studentsToExport.forEach(s => {
          worksheetData.push([
            s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
            s.student_id || "—",
            s.phone || s.guardian_phone || "—",
            s.admission_no || "—",
            s.class || className || "—",
            s.academic_year || "—",
            s.qr_code || "—",
            s.qr_url || (baseUrl ? `${baseUrl}/qr/student/${s.qr_code || s.id}` : "")
          ]);
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        const maxLen = worksheetData[0].map((_, colIdx) => 
          Math.max(...worksheetData.map(row => String(row[colIdx] || "").length))
        );
        worksheet["!cols"] = maxLen.map(len => ({ wch: Math.max(len + 3, 10) }));

        studentsToExport.forEach((s, idx) => {
          const rowIdx = idx + 2; 
          const url = s.qr_url || (baseUrl ? `${baseUrl}/qr/student/${s.qr_code || s.id}` : "");
          worksheet[`H${rowIdx}`] = {
            f: `HYPERLINK("${url}", "${url}")`,
            v: url
          };
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, `Students Class ${className}`);
        XLSX.writeFile(workbook, `Students_Class_${className}_Export.xlsx`);
        toast.success("Excel exported successfully!", { id: "export-students" });
      } else if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF("l", "mm", "a4");
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Students List - Class ${className}`, 14, 15);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Academic Year: ${studentsToExport[0]?.academic_year || "N/A"} | Exported: ${new Date().toLocaleDateString()}`, 14, 21);

        const tableBody = [];
        
        studentsToExport.forEach(s => {
          tableBody.push([
            s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
            s.student_id || "—",
            s.phone || s.guardian_phone || "—",
            s.admission_no || "—",
            s.class || className || "—",
            s.academic_year || "—",
            s.qr_image || "" 
          ]);
        });

        autoTable(doc, {
          startY: 26,
          head: [["Name", "Student ID", "Phone", "Admission No", "Class", "Academic Year", "QR Code"]],
          body: tableBody,
          theme: "grid",
          headStyles: { fillColor: [79, 70, 229], halign: "center", valign: "middle" },
          styles: { fontSize: 9, halign: "center", valign: "middle" },
          columnStyles: {
            0: { halign: "left" }, 
            6: { cellWidth: 20, minCellHeight: 20 } 
          },
          didDrawCell: function (data) {
            if (data.column.index === 6 && data.cell.section === "body") {
              const qrImage = data.cell.raw; 
              if (qrImage && qrImage.startsWith("data:image")) {
                doc.addImage(qrImage, "PNG", data.cell.x + 4, data.cell.y + 2, 12, 12);
              }
            }
          }
        });

        doc.save(`Students_Class_${className}_Export.pdf`);
        toast.success("PDF exported successfully!", { id: "export-students" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to export: " + (err.message || err), { id: "export-students" });
    }
  };

  // Fetch Meta on mount
  useEffect(() => {
    if (!meta) {
      dispatch(fetchStudentsMeta());
    }
  }, [dispatch, meta]);

  // Find class ID
  const classObj = useMemo(() => {
    if (!meta || !meta.classes) return null;
    const searchName = String(className).replace(/class\s*-?/i, '').trim();
    return meta.classes.find(c => String(c.name).replace(/class\s*-?/i, '').trim() === searchName);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider"> Students List </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Bulk Import
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              PDF
            </button>
          </div>
        </div>
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
                  {isStreamClass && (
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      Stream
                    </th>
                  )}
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
                      {isStreamClass && (
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                          {student.stream || "—"}
                        </td>
                      )}
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

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileExcel className="text-emerald-500 w-4 h-4" />
                Import Students from Excel
              </h3>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportErrors([]); setImportSuccessMessage(""); setSelectedFile(null); }} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs text-zinc-600 font-semibold">
              
              {/* Info Alert */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2">
                <p className="text-[11px] text-zinc-600 leading-relaxed font-semibold">
                  Use our sample template to format your student records correctly. Columns like <code className="text-violet-600 bg-violet-50 px-1 py-0.5 rounded font-mono font-bold">first_name</code> are mandatory. Ensure the class names match existing records.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  <FaDownload className="w-2.5 h-2.5" /> Download Excel Template
                </button>
              </div>

              {/* File Dropzone / Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Select Excel File (.xlsx) *</label>
                <div className="relative border-2 border-dashed border-zinc-200 hover:border-violet-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/20">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <FaUpload className="w-6 h-6 text-zinc-450 mx-auto" />
                    <p className="text-zinc-550 font-bold text-[11px]">
                      {selectedFile ? selectedFile.name : "Drag & drop file or click to browse"}
                    </p>
                    {selectedFile && (
                      <p className="text-[10px] text-zinc-400">
                        File Size: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Error Reports */}
              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[11px] rounded-xl font-bold">
                  {importSuccessMessage}
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-500 uppercase block">Validation Failures / Errors ({importErrors.length})</label>
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl max-h-36 overflow-y-auto custom-scrollbar space-y-1.5">
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="text-rose-600 text-[10px] font-bold leading-normal flex items-start gap-1">
                        <span className="shrink-0">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportErrors([]); setImportSuccessMessage(""); setSelectedFile(null); }}
                  className="px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:bg-zinc-250 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  {uploading ? "Importing..." : "Import Students"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
