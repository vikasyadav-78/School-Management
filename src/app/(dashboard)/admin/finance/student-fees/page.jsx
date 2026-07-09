"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { fetchStudentsByClass } from "@/features/students/redux/studentThunk";
import { getMockStudents } from "@/features/students/services/module.mock";
import {
  fetchStudentFeeDetails,
  collectFeePayment,
  fetchPendingFeesList
} from "@/features/finance/redux/financeThunk";
import { clearCurrentReceipt, resetFeeDetails } from "@/features/finance/redux/financeSlice";
import FeeSummaryCard from "@/features/finance/components/FeeSummaryCard";
import FeeCollectionForm from "@/features/finance/components/FeeCollectionForm";
import FeeReceipt from "@/features/finance/components/FeeReceipt";
import PendingFeesTable from "@/features/finance/components/PendingFeesTable";
import FeeReports from "@/features/finance/components/FeeReports";
import Pagination from "@/components/ui/Pagination";
import { FaUserCircle, FaMoneyBillWave, FaClock, FaChartLine, FaSearch } from "react-icons/fa";

function StudentFeesContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryStudentId = searchParams.get("studentId");
  const queryClass = searchParams.get("class");

  // Local Tab state: 'collection' | 'pending' | 'reports'
  const [activeTab, setActiveTab] = useState("collection");

  // Selected Filter States for Collection Tab - Default to Class 12 Science
  const [selectedClass, setSelectedClass] = useState("12");
  const [selectedStream, setSelectedStream] = useState("Science");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selectors
  const allStudents = useSelector((state) => state.students.list) || [];
  const studentsLoading = useSelector((state) => state.students.loading);

  const {
    studentFeeDetails,
    currentReceipt,
    pendingFees,
    loading: financeLoading
  } = useSelector((state) => state.finance);

  const loading = studentsLoading || financeLoading;

  // Filter students locally by stream if class 11/12, or by section if class 1-10
  const students = allStudents.filter((s) => {
    if (selectedClass === "11" || selectedClass === "12") {
      return s.stream === selectedStream;
    } else {
      return s.section === selectedSection;
    }
  });

  // Filter students by search term
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.parentName && s.parentName.toLowerCase().includes(term))
    );
  });

  // Paginated students for current page display
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIdx, startIdx + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Initial load
  useEffect(() => {
    dispatch(fetchPendingFeesList());
  }, [dispatch]);

  // Sync state with query parameters if present
  useEffect(() => {
    if (queryClass) {
      setSelectedClass(queryClass);
      setActiveTab("collection");
    }
  }, [queryClass]);

  useEffect(() => {
    if (queryStudentId) {
      const mockStudents = getMockStudents() || [];
      const found = mockStudents.find((s) => s.id === queryStudentId);
      if (found) {
        if (found.stream) {
          setSelectedStream(found.stream);
        }
        if (found.section) {
          setSelectedSection(found.section);
        }
        setSelectedStudentId(queryStudentId);
        setActiveTab("collection");
      }
    }
  }, [queryStudentId]);

  // Load student list dynamically when Class is selected
  useEffect(() => {
    if (selectedClass) {
      dispatch(fetchStudentsByClass(selectedClass));
      if (selectedClass !== queryClass) {
        setSelectedStudentId("");
        dispatch(resetFeeDetails());
      }
    }
  }, [selectedClass, queryClass, dispatch]);

  // Load student fee details when student changes
  useEffect(() => {
    if (selectedStudentId) {
      dispatch(fetchStudentFeeDetails(selectedStudentId));
    } else {
      dispatch(resetFeeDetails());
    }
  }, [selectedStudentId, dispatch]);

  // Reset search term and page when filters change
  useEffect(() => {
    setSearchTerm("");
    setCurrentPage(1);
  }, [selectedClass, selectedStream, selectedSection]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleClassChange = (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    if (cls === "11" || cls === "12") {
      setSelectedStream("Science");
    } else {
      setSelectedSection("A");
    }
  };

  const handleCollectPayment = (paymentData) => {
    if (!selectedStudentId) return;
    dispatch(
      collectFeePayment({
        studentId: selectedStudentId,
        paymentData
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        // Refresh pending list
        dispatch(fetchPendingFeesList());
      }
    });
  };

  const handleCloseReceipt = () => {
    dispatch(clearCurrentReceipt());
    if (selectedStudentId) {
      dispatch(fetchStudentFeeDetails(selectedStudentId));
    }
  };

  const handleCollectFromPending = (rec) => {
    setSelectedClass(rec.className);
    
    // Look up the stream or section of the student
    const mockStudents = getMockStudents() || [];
    const found = mockStudents.find((s) => s.id === rec.studentId);
    if (found) {
      if (found.stream) {
        setSelectedStream(found.stream);
      }
      if (found.section) {
        setSelectedSection(found.section);
      }
    }

    dispatch(fetchStudentsByClass(rec.className)).then(() => {
      setSelectedStudentId(rec.studentId);
      setActiveTab("collection");
    });
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Headers */}
      <div className="flex border-b border-zinc-200 bg-white p-2 rounded-xl border shadow-sm">
        <button
          onClick={() => setActiveTab("collection")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "collection"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          <FaMoneyBillWave className="w-4 h-4" />
          <span>Fee Collection</span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "pending"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          <FaClock className="w-4 h-4" />
          <span>Pending Dues</span>
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "reports"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
          }`}
        >
          <FaChartLine className="w-4 h-4" />
          <span>Collection Reports</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "collection" && (
        <div className="space-y-6">
          {/* Class and Stream Selectors */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase">Class</label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
              >
                <option value="">Select Class</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Stream Selector for 11/12, Section Selector for 1-10 */}
            {(selectedClass === "11" || selectedClass === "12") ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase">Stream</label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
                >
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            )}
          </div>

          {/* Fee collection workspace */}
          {loading ? (
            <PageLoader />
          ) : (
            <>
              {studentFeeDetails ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-start">
                        <button
                          onClick={() => setSelectedStudentId("")}
                          className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          &larr; Back to Student List
                        </button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Student Profile Card & Summary */}
                        <div className="lg:col-span-1 space-y-6">
                          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-zinc-400">
                              <FaUserCircle className="w-14 h-14" />
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-800 text-sm">{studentFeeDetails.studentName}</h3>
                              <p className="text-[10px] text-zinc-400 font-semibold block mt-0.5">ID: {studentFeeDetails.studentId}</p>
                            </div>
                            <div className="border-t border-zinc-100 pt-4 w-full text-left space-y-2.5 text-xs font-medium text-zinc-600">
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Grade Class</span>
                                <span className="text-zinc-800 font-bold">Class {studentFeeDetails.className}</span>
                              </div>
                              {studentFeeDetails.stream ? (
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Stream</span>
                                  <span className="text-zinc-800 font-bold">{studentFeeDetails.stream}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Section</span>
                                  <span className="text-zinc-800 font-bold">{studentFeeDetails.section || "A"}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Parent Name</span>
                                <span className="text-zinc-800 font-bold">{studentFeeDetails.parentName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Mobile Number</span>
                                <span className="text-zinc-800 font-semibold">{studentFeeDetails.phone}</span>
                              </div>
                            </div>
                          </div>

                          <FeeSummaryCard details={studentFeeDetails} />
                        </div>

                        {/* Right: Payment collection form */}
                        <div className="lg:col-span-2">
                          <FeeCollectionForm
                            remainingAmount={studentFeeDetails.remainingAmount}
                            onSubmit={handleCollectPayment}
                            loading={financeLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Render students list like the student roster section instead of a dropdown option select */
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h3 className="text-xs font-bold text-zinc-700 uppercase">
                            Students in Class {selectedClass} {(selectedClass === "11" || selectedClass === "12") ? `- Stream: ${selectedStream}` : `- Section: ${selectedSection}`}
                          </h3>
                          <span className="text-[10px] font-bold text-zinc-400 mt-0.5 block">
                            {filteredStudents.length} {filteredStudents.length === 1 ? "Student" : "Students"} found
                          </span>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                            <FaSearch className="w-3.5 h-3.5 text-zinc-400" />
                          </span>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search name or ID..."
                            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-white focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border-spacing-0">
                          <thead>
                            <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              <th className="px-6 py-4 whitespace-nowrap">Roll No</th>
                              <th className="px-6 py-4 whitespace-nowrap">Photo</th>
                              <th className="px-6 py-4 whitespace-nowrap">Name</th>
                              <th className="px-6 py-4 whitespace-nowrap">Gender</th>
                              <th className="px-6 py-4 whitespace-nowrap">
                                {selectedClass === "11" || selectedClass === "12" ? "Stream" : "Section"}
                              </th>
                              <th className="px-6 py-4 whitespace-nowrap">Parent Name</th>
                              <th className="px-6 py-4 whitespace-nowrap">Phone</th>
                              <th className="px-6 py-4 text-center whitespace-nowrap">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
                            {paginatedStudents.map((s, index) => {
                              const rollNo = String((currentPage - 1) * pageSize + index + 1).padStart(2, "0");
                              return (
                                <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                                  <td className="px-6 py-3.5 font-bold text-zinc-800 whitespace-nowrap">{rollNo}</td>
                                  <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden">
                                      {s.profileImage ? (
                                        <img src={s.profileImage} alt={s.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <FaUserCircle className="w-7 h-7 text-zinc-300" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-3.5 whitespace-nowrap">
                                    <span className="font-bold text-zinc-800 block">{s.name}</span>
                                    <span className="text-[10px] text-zinc-400 block mt-0.5">{s.id}</span>
                                  </td>
                                  <td className="px-6 py-3.5 whitespace-nowrap">{s.gender || "Male"}</td>
                                  <td className="px-6 py-3.5 text-center font-bold text-zinc-700 whitespace-nowrap">
                                    {selectedClass === "11" || selectedClass === "12" ? s.stream : (s.section || "A")}
                                  </td>
                                  <td className="px-6 py-3.5 text-zinc-500 whitespace-nowrap">{s.parentName || "N/A"}</td>
                                  <td className="px-6 py-3.5 font-bold text-zinc-800 whitespace-nowrap">{s.phone}</td>
                                  <td className="px-6 py-3.5 whitespace-nowrap">
                                    <div className="flex justify-center">
                                      <button
                                        onClick={() => setSelectedStudentId(s.id)}
                                        className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-100 rounded-xl text-[10px] font-bold transition-all"
                                      >
                                        Collect Fee
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {filteredStudents.length === 0 && (
                              <tr>
                                <td colSpan="8" className="text-center py-12 text-zinc-400 font-medium">
                                  No students found matching your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Reusable Pagination */}
                      {filteredStudents.length > pageSize && (
                        <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
                          <Pagination
                            currentPage={currentPage}
                            totalCount={filteredStudents.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

      {activeTab === "pending" && (
        <PendingFeesTable
          records={pendingFees}
          onCollect={handleCollectFromPending}
        />
      )}

      {activeTab === "reports" && <FeeReports />}

      {/* Fee Receipt Modal Overlay */}
      {currentReceipt && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0">
          <div className="max-w-md w-full my-auto mx-auto">
            <FeeReceipt receipt={currentReceipt} onClear={handleCloseReceipt} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentFeesPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(resetFeeDetails());
      dispatch(clearCurrentReceipt());
    };
  }, [dispatch]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Fees"
        subtitle="Manage student fee allocations, collect payments, and analyze collections"
      />
      <Suspense fallback={<PageLoader />}>
        <StudentFeesContent />
      </Suspense>
    </DashboardLayout>
  );
}
