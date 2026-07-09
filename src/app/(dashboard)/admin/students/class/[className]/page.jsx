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
import { fetchStudentsByClass, deleteStudentsItem } from "@/features/students/redux/studentThunk";
import Pagination from "@/components/ui/Pagination";

export default function ClassDetailsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { className } = params;

  const { list: students, loading } = useSelector((state) => state.students);

  // Set default selectedSection to "A" as requested
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedStream, setSelectedStream] = useState("All Streams");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page to 1 whenever filters change to avoid showing empty screens
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSection, selectedStream, searchQuery]);

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      dispatch(deleteStudentsItem(id));
    }
  };

  const isStreamBased = className === "11" || className === "12";

  useEffect(() => {
    if (className) {
      dispatch(fetchStudentsByClass(className));
    }
  }, [dispatch, className]);

  // Available streams for this class
  const availableStreams = useMemo(() => {
    if (!isStreamBased) return [];
    const streams = Array.from(new Set(students.map((s) => s.stream).filter(Boolean))).sort();
    return ["All Streams", ...streams];
  }, [students, isStreamBased]);

  // Available sections for the selected stream
  const availableSections = useMemo(() => {
    let filteredForSections = students;
    if (isStreamBased && selectedStream !== "All Streams") {
      filteredForSections = students.filter((s) => s.stream === selectedStream);
    }
    const secs = Array.from(new Set(filteredForSections.map((s) => s.section))).sort();
    return ["All Sections", ...secs];
  }, [students, isStreamBased, selectedStream]);

  // Reset selected section if it becomes unavailable when changing stream
  useEffect(() => {
    if (!availableSections.includes(selectedSection)) {
      if (availableSections.includes("A")) {
        setSelectedSection("A");
      } else {
        setSelectedSection("All Sections");
      }
    }
  }, [availableSections, selectedSection]);

  // Real-time student filtering by stream, section and search query (name, admissionNo, parentName)
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Stream Filter (Only for Class 11 & 12)
      if (isStreamBased && selectedStream !== "All Streams" && student.stream !== selectedStream) {
        return false;
      }

      // 2. Section Filter (Only for Class 1 to 10)
      if (!isStreamBased && selectedSection !== "All Sections" && student.section !== selectedSection) {
        return false;
      }

      // 3. Search Query Filter
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const name = (student.name || "").toLowerCase();
      const admissionNo = (student.admissionNo || "").toLowerCase();
      const parentName = (student.parentName || "").toLowerCase();

      return (
        name.includes(query) ||
        admissionNo.includes(query) ||
        parentName.includes(query)
      );
    });
  }, [students, isStreamBased, selectedStream, selectedSection, searchQuery]);

  // Sort filtered students based on selection
  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Paginated students for current page display
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedStudents.slice(startIdx, startIdx + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <span className="inline-flex flex-col text-[8px] text-zinc-300 ml-1 select-none font-normal">
          <span className="leading-[1]">▲</span>
          <span className="leading-[1] mt-[-2px]">▼</span>
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <span className="text-[10px] text-violet-600 ml-1 select-none font-bold">▲</span>
    ) : (
      <span className="text-[10px] text-violet-600 ml-1 select-none font-bold">▼</span>
    );
  };

  const renderStudentAvatar = (student) => {
    let img = student.profileImage;
    if (img && typeof img === "object" && img.constructor && img.constructor.name === "FileList") {
      img = img[0];
    }
    if (img instanceof File || (img && typeof img === "object" && img.name && img.size)) {
      try {
        const objectUrl = URL.createObjectURL(img);
        return <img src={objectUrl} alt={student.name} className="w-full h-full object-cover rounded-full" />;
      } catch (e) {
        return <FaUserCircle className="text-zinc-300 w-full h-full" />;
      }
    }
    const hasImageString = img && typeof img === "string" && (
      img.includes("/") || img.includes(".") || img.length > 10
    );
    if (hasImageString) {
      return <img src={img} alt={student.name} className="w-full h-full object-cover rounded-full" />;
    }
    return <FaUserCircle className="text-zinc-300 w-full h-full" />;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`Class ${className} `}
        subtitle={`Roster listing and academic statistics for all sections of Class ${className}.`}
        action={
          <Link href="/admin/students">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      {/* Class Statistics Header Summary Row */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-800">Class {className}</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Total Enrolled: <span className="font-bold text-zinc-700">{students.length} Students</span>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isStreamBased ? (
                <>
                  {" "} Streams:{" "}
                  <span className="font-bold text-zinc-700">
                    {Array.from(new Set(students.map((s) => s.stream).filter(Boolean))).join(", ")}
                  </span>
                </>
              ) : (
                <>
                  {" "}| Sections:{" "}
                  <span className="font-bold text-zinc-700">
                    {Array.from(new Set(students.map((s) => s.section))).sort().join(", ")}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Filtering Controls Container */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
            {isStreamBased ? (
              /* Stream Filter (Only for Class 11 & 12) */
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stream</span>
                <div className="flex flex-wrap gap-2">
                  {availableStreams.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStream(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${selectedStream === st
                          ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Section Filter (Only for Class 1 to 10) */
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Section</span>
                <div className="flex flex-wrap gap-2">
                  {availableSections.map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedSection(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${selectedSection === sec
                          ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, admission no, parent name..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <PageLoader />
        </div>
      ) : filteredStudents.length === 0 ? (
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
                    Parents
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Address
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    DOB
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {paginatedStudents.map((student, idx) => {
                  const rollNo = String((currentPage - 1) * pageSize + idx + 1).padStart(2, "0");
                  const formattedDob = student.dob
                    ? student.dob.replace(/-/g, "/")
                    : "N/A";
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-zinc-50/40 transition-colors"
                    >
                      {/* Roll No Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-zinc-800">
                        {rollNo}
                      </td>

                      {/* Photo Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div
                          onClick={() => router.push(`/admin/students/profile/${student.id}`)}
                          className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center shadow-inner overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 border border-zinc-100"
                        >
                          {renderStudentAvatar(student)}
                        </div>
                      </td>

                      {/* Name Column */}
                      <td
                        onClick={() => router.push(`/admin/students/profile/${student.id}`)}
                        className="px-6 py-4.5 whitespace-nowrap text-xs font-medium text-zinc-500 cursor-pointer hover:text-violet-600 transition-colors"
                      >
                        {student.name}
                      </td>

                      {/* Gender Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.gender || "N/A"}
                      </td>

                      {/* Class Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        Class {student.className}
                      </td>

                      {/* Section Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.section}
                      </td>

                      {/* Parents Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.parentName || "N/A"}
                      </td>

                      {/* Address Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {student.address || "N/A"}
                      </td>

                      {/* DOB Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-zinc-500">
                        {formattedDob}
                      </td>

                      {/* Phone Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-zinc-800">
                        {student.phone ? student.phone.replace("+1 555-", "") : "N/A"}
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/students/profile/${student.id}`}>
                            <button
                              title="View Student Profile"
                              className="bg-violet-50 hover:bg-violet-100 text-violet-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-violet-200 text-xs font-bold"
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
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            title="Delete Student"
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-red-200 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination component */}
          <Pagination
            currentPage={currentPage}
            totalCount={sortedStudents.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
