"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaUserGraduate, FaExchangeAlt, FaHistory, FaCheckCircle,
  FaChevronLeft, FaSearch, FaTimes, FaUserCheck, FaArrowRight, FaUndo
} from "react-icons/fa";
import {
  getStudentAllocation,
  assignStudentsToSection,
  transferStudents,
  bulkAssignStudents,
  bulkTransferStudents,
  getStudentTransfers
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function StudentAllocationPage() {
  const [activeTab, setActiveTab] = useState("workspace"); // "workspace" | "history"
  const [loading, setLoading] = useState(true);
  const [allocationData, setAllocationData] = useState({ classes: [], students: [], recent_transfers: [] });
  const [selectedClass, setSelectedClass] = useState(null); // class object

  // Workspace filter states
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [allocationFilter, setAllocationFilter] = useState("all"); // "all" | "allocated" | "unallocated"
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [modalTargetClassId, setModalTargetClassId] = useState("");
  const [modalTargetSectionId, setModalTargetSectionId] = useState("");
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [singleTargetStudent, setSingleTargetStudent] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // History State
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyClassFilter, setHistoryClassFilter] = useState("all");

  // Load Initial Overview
  const loadOverview = async (classId = null) => {
    try {
      setLoading(true);
      const data = await getStudentAllocation(classId ? { from_class_id: classId } : {});
      setAllocationData(data.data || data || { classes: [], students: [], recent_transfers: [] });
      setSelectedStudentIds([]);
    } catch (err) {
      toast.error("Failed to load student allocation info: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  // Fetch history when history tab is activated
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = {};
      if (historyClassFilter !== "all") {
        params.school_class_id = historyClassFilter;
      }
      const data = await getStudentTransfers(params);
      setTransferHistory(data.transfers || data.data || data || []);
    } catch (err) {
      toast.error("Failed to load transfer history: " + (err.message || err));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, historyClassFilter]);

  // Source Class selection handler
  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setSelectedSectionId("all");
    setAllocationFilter("all");
    setStudentSearchQuery("");
    loadOverview(cls.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    loadOverview();
  };

  // List of target sections depending on selected target class inside modals
  const targetClassSections = useMemo(() => {
    if (!modalTargetClassId) return [];
    const cls = allocationData.classes.find(c => c.id === modalTargetClassId);
    return cls?.sections || [];
  }, [modalTargetClassId, allocationData.classes]);

  // Filtered students for selected workspace class
  const filteredStudents = useMemo(() => {
    let list = allocationData.students || [];

    // Filter by Section dropdown
    if (selectedSectionId !== "all") {
      list = list.filter(s => s.section_id === selectedSectionId);
    }

    // Filter by allocation state
    if (allocationFilter === "allocated") {
      list = list.filter(s => !!s.section_id);
    } else if (allocationFilter === "unallocated") {
      list = list.filter(s => !s.section_id);
    }

    // Filter by search query
    const query = studentSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(query) ||
        s.student_id?.toLowerCase().includes(query) ||
        s.admission_no?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [allocationData.students, selectedSectionId, allocationFilter, studentSearchQuery]);

  // Handle single check
  const handleSelectStudentToggle = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAllToggle = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    const allSelected = allFilteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // Triggers transfer modal for single student
  const openSingleTransfer = (student) => {
    setSingleTargetStudent(student);
    setIsBulkAction(false);
    setModalTargetClassId(student.school_class_id || selectedClass?.id || "");
    setModalTargetSectionId("");
    setIsTransferModalOpen(true);
  };

  // Triggers assign modal for single student
  const openSingleAssign = (student) => {
    setSingleTargetStudent(student);
    setIsBulkAction(false);
    setModalTargetClassId(student.school_class_id || selectedClass?.id || "");
    setModalTargetSectionId("");
    setIsAssignModalOpen(true);
  };

  // Triggers bulk actions
  const openBulkTransfer = () => {
    if (selectedStudentIds.length === 0) return;

    // Validate that all selected students belong to the same class
    const selectedStudents = (allocationData.students || []).filter(s => selectedStudentIds.includes(s.id));
    const classIds = [...new Set(selectedStudents.map(s => s.school_class_id).filter(Boolean))];
    if (classIds.length > 1) {
      toast.error("Please select students from the same class to change their section.");
      return;
    }

    const currentClassId = classIds[0] || selectedClass?.id || "";
    if (!currentClassId) {
      toast.error("Unable to determine student class.");
      return;
    }

    setIsBulkAction(true);
    setSingleTargetStudent(null);
    setModalTargetClassId(currentClassId);
    setModalTargetSectionId("");
    setIsTransferModalOpen(true);
  };

  const openBulkAssign = () => {
    if (selectedStudentIds.length === 0) return;
    setIsBulkAction(true);
    setSingleTargetStudent(null);
    setModalTargetClassId(selectedClass?.id || "");
    setModalTargetSectionId("");
    setIsAssignModalOpen(true);
  };

  // Submit transfer handler (Change Section)
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!modalTargetSectionId) {
      toast.error("Please select target Section.");
      return;
    }

    setModalSubmitting(true);
    try {
      const studentIds = isBulkAction ? selectedStudentIds : [singleTargetStudent.id];
      const payload = {
        student_ids: studentIds,
        to_section_id: modalTargetSectionId
      };

      const res = await transferStudents(payload);
      if (res && res.success === false) {
        throw new Error(res.message || "Failed to change section.");
      }
      
      toast.success(res?.message || `Successfully changed section for ${studentIds.length} student(s).`);

      setIsTransferModalOpen(false);
      setSelectedStudentIds([]);
      loadOverview(selectedClass?.id);
    } catch (err) {
      toast.error(err.message || "Failed to change section.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit allocation handler (Move to Class & Section)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!modalTargetClassId || !modalTargetSectionId) {
      toast.error("Please select destination Class and Section.");
      return;
    }

    setModalSubmitting(true);
    try {
      const selectedStudents = isBulkAction 
        ? (allocationData.students || []).filter(s => selectedStudentIds.includes(s.id))
        : [singleTargetStudent];

      const allocatedIds = selectedStudents.filter(s => s.section_id).map(s => s.id);
      const unallocatedIds = selectedStudents.filter(s => !s.section_id).map(s => s.id);

      if (allocatedIds.length > 0) {
        const transferPayload = {
          student_ids: allocatedIds,
          to_class_id: modalTargetClassId,
          to_school_class_id: modalTargetClassId,
          school_class_id: modalTargetClassId,
          to_section_id: modalTargetSectionId,
          section_id: modalTargetSectionId
        };
        const res = await transferStudents(transferPayload);
        if (res && res.success === false) {
          throw new Error(res.message || "Failed to transfer allocated students.");
        }
      }

      if (unallocatedIds.length > 0) {
        const assignPayload = {
          student_ids: unallocatedIds,
          school_class_id: modalTargetClassId,
          section_id: modalTargetSectionId
        };
        const res = await assignStudentsToSection(assignPayload);
        if (res && res.success === false) {
          throw new Error(res.message || "Failed to assign unallocated students.");
        }
      }

      toast.success(`Successfully moved ${selectedStudents.length} student(s) to target class & section.`);

      setIsAssignModalOpen(false);
      setSelectedStudentIds([]);
      loadOverview(selectedClass?.id);
    } catch (err) {
      toast.error(err.message || "Failed to move students.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    let list = transferHistory;
    const query = historySearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(h =>
        h.student_name?.toLowerCase().includes(query) ||
        h.from_class?.toLowerCase().includes(query) ||
        h.to_class?.toLowerCase().includes(query) ||
        h.by?.toLowerCase().includes(query)
      );
    }
    return list;
  }, [transferHistory, historySearchQuery]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Allocation & Transfer"
        subtitle="Manage student classroom assignations, transfers, and track transfer history."
      />

      {/* Tabs Layout */}
      <div className="flex border-b border-zinc-200 gap-6 mb-6">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeTab === "workspace"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <FaUserGraduate /> Allocation Workspace
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${activeTab === "history"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <FaHistory /> Transfer Log History
        </button>
      </div>

      {loading && activeTab === "workspace" ? (
        <div className="py-12"><PageLoader /></div>
      ) : activeTab === "workspace" ? (
        <div>
          {/* Class Select Mode */}
          {!selectedClass ? (
            <div className="space-y-6">
              <div className="bg-white p-4 border border-zinc-200 shadow-sm rounded-2xl">
                <h2 className="text-zinc-800 font-extrabold text-sm mb-1">Select Source Class</h2>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Choose a classroom to manage its roster list</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...(allocationData.classes || [])].sort((a, b) => {
                  const getNumericVal = (name) => {
                    if (!name) return 999;
                    const match = String(name).match(/\d+/);
                    return match ? parseInt(match[0], 10) : 999;
                  };
                  return getNumericVal(a.name) - getNumericVal(b.name);
                }).map((cls) => {
                  const formatClassName = (name) => {
                    if (!name) return "";
                    const match = name.match(/class\s*-?\s*(\d+)/i);
                    if (match) {
                      return `Class ${match[1]}`;
                    }
                    return name;
                  };

                  return (
                    <div
                      key={cls.id}
                      className="bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all rounded-2xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-zinc-800 font-black text-base">{formatClassName(cls.name)}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Sections: {cls.sections?.map(s => s.name).join(", ") || "None"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                        <span className="text-[12px] bg-zinc-100 font-extrabold text-zinc-600 px-2.5 py-2 rounded-lg">
                          {cls.students_count} Enrolled
                        </span>
                        <button
                          onClick={() => handleSelectClass(cls)}
                          className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[12px] font-black transition-all cursor-pointer"
                        >
                          Manage Roster
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Selected Workspace Mode */
            <div className="space-y-6">
              {/* Back Link & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 border border-zinc-200 shadow-sm rounded-2xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToClasses}
                    className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-500 hover:text-zinc-700 cursor-pointer"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                  <div>
                    <h2 className="text-zinc-800 font-black text-base">{selectedClass.name} Workspace</h2>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      Class Roster • Manage student allocations
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Roster */}
                  <div className="relative w-full sm:w-60">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                      <FaSearch className="w-3 h-3" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-xl text-[11px] font-semibold outline-none focus:border-violet-500 bg-zinc-50 focus:bg-white text-black"
                    />
                  </div>

                  {/* Filter Sections */}
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 bg-white outline-none cursor-pointer"
                  >
                    <option value="all">All Sections</option>
                    {selectedClass.sections?.map(sec => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>

                  {/* Allocation State Filter */}
                  <select
                    value={allocationFilter}
                    onChange={(e) => setAllocationFilter(e.target.value)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 bg-white outline-none cursor-pointer"
                  >
                    <option value="all">All Allocation States</option>
                    <option value="allocated">Allocated Only</option>
                    <option value="unallocated">Unallocated Only</option>
                  </select>
                </div>
              </div>

              {/* Roster Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                {filteredStudents.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      title="No students found"
                      desc="No students matched your filter criteria in this class. Try adjusting filters or select a different class."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider select-none">
                          <th className="px-6 py-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id))}
                              onChange={handleSelectAllToggle}
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Student ID</th>
                          <th className="px-6 py-4">Admission No</th>
                          <th className="px-6 py-4">Roll No</th>
                          <th className="px-6 py-4">Section</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => handleSelectStudentToggle(student.id)}
                                className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 font-bold text-zinc-800">{student.full_name}</td>
                            <td className="px-6 py-4 text-zinc-500">{student.student_id}</td>
                            <td className="px-6 py-4 text-zinc-500">{student.admission_no}</td>
                            <td className="px-6 py-4 font-extrabold text-zinc-800">{student.roll_no || "—"}</td>
                            <td className="px-6 py-4">
                              {student.section_name ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-violet-50 text-violet-600 border border-violet-100">
                                  Section {student.section_name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-zinc-100 text-zinc-600">
                                  Unallocated
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {student.section_id ? (
                                <button
                                  onClick={() => openSingleTransfer(student)}
                                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                                >
                                  <FaExchangeAlt className="w-2.5 h-2.5" /> Change Section
                                </button>
                              ) : (
                                <button
                                  onClick={() => openSingleAssign(student)}
                                  className="px-3 py-1.5 bg-violet-50 border border-violet-100 text-violet-600 hover:bg-violet-100 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                                >
                                  <FaUserCheck className="w-2.5 h-2.5" /> Move to Class & Section
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sticky bottom Bulk Actions bar */}
              {selectedStudentIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center justify-between gap-8 z-40 border border-zinc-800 w-auto animate-scale-up">
                  <div className="flex flex-col text-left shrink-0">
                    <span className="text-xs font-black">{selectedStudentIds.length} Students Selected</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Execute batch class actions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openBulkTransfer}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                    >
                      <FaExchangeAlt className="w-3 h-3" /> Change Section
                    </button>
                    <button
                      onClick={openBulkAssign}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                    >
                      <FaUserCheck className="w-3 h-3" /> Move to Class & Section
                    </button>
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* History Log Tab */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 border border-zinc-200 shadow-sm rounded-2xl">
            <div>
              <h2 className="text-zinc-800 font-extrabold text-sm">Transfer History Logs</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Track student transfers and allocation edits</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search History */}
              <div className="relative w-full sm:w-60">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                  <FaSearch className="w-3 h-3" />
                </span>
                <input
                  type="text"
                  placeholder="Search name, class or admin..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-xl text-[11px] font-semibold outline-none focus:border-violet-500 bg-zinc-50 focus:bg-white text-black"
                />
              </div>

              {/* Class Filter */}
              <select
                value={historyClassFilter}
                onChange={(e) => setHistoryClassFilter(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 bg-white outline-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {[...(allocationData.classes || [])].sort((a, b) => {
                  const getNumericVal = (name) => {
                    if (!name) return 999;
                    const match = String(name).match(/\d+/);
                    return match ? parseInt(match[0], 10) : 999;
                  };
                  return getNumericVal(a.name) - getNumericVal(b.name);
                }).map(cls => {
                  const formatClassName = (name) => {
                    if (!name) return "";
                    const match = name.match(/class\s*-?\s*(\d+)/i);
                    if (match) return `Class ${match[1]}`;
                    return name;
                  };
                  return (
                    <option key={cls.id} value={cls.id}>{formatClassName(cls.name)}</option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* History Listing */}
          {historyLoading ? (
            <div className="py-12"><PageLoader /></div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-zinc-200">
              <EmptyState
                title="No transfers logged"
                desc="No transfer actions were found in this index. Run a transfer in the workspace tab to log entries."
              />
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4">Transfer Date</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">From Class/Section</th>
                      <th className="px-6 py-4 text-center w-12"><FaArrowRight className="text-zinc-400" /></th>
                      <th className="px-6 py-4">To Class/Section</th>
                      <th className="px-6 py-4">Action By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs font-semibold text-zinc-700">
                    {filteredHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-zinc-500">
                          {new Date(log.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-800">{log.student_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-extrabold text-[10px]">
                            {log.from_class} - {log.from_section}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <FaArrowRight className="text-zinc-300 w-3 h-3 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100 font-extrabold text-[10px]">
                            {log.to_class} - {log.to_section}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 font-bold">{log.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Change Section Dialog Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                <FaExchangeAlt className="text-violet-500" /> Change Section
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Targeting Students</span>
                <span className="text-zinc-800 font-extrabold text-[11px] block mt-0.5">
                  {isBulkAction
                    ? `${selectedStudentIds.length} students currently selected`
                    : singleTargetStudent?.full_name
                  }
                </span>
              </div>

              {/* Current Class Static Display */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Current Class</label>
                <div className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-700 font-bold text-[12px] select-none">
                  {(() => {
                    const currentClassObj = allocationData.classes.find(c => c.id === modalTargetClassId);
                    return currentClassObj ? (
                      currentClassObj.name.match(/class\s*-?\s*(\d+)/i)
                        ? `Class ${currentClassObj.name.match(/class\s*-?\s*(\d+)/i)[1]}`
                        : currentClassObj.name
                    ) : selectedClass?.name || "Current Class";
                  })()}
                </div>
              </div>

              {/* Destination Section Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">New Section</label>
                <select
                  required
                  disabled={!modalTargetClassId}
                  value={modalTargetSectionId}
                  onChange={(e) => setModalTargetSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none text-zinc-700 font-semibold disabled:opacity-50"
                >
                  <option value="">Select Target Section</option>
                  {targetClassSections.map(sec => (
                    <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? "Changing..." : "Change Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move to Class & Section Dialog Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                <FaUserCheck className="text-violet-500" /> Move to Class & Section
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Targeting Students</span>
                <span className="text-zinc-800 font-extrabold text-[11px] block mt-0.5">
                  {isBulkAction
                    ? `${selectedStudentIds.length} students currently selected`
                    : singleTargetStudent?.full_name
                  }
                </span>
              </div>

              {/* Destination Class Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Destination Class</label>
                <select
                  required
                  value={modalTargetClassId}
                  onChange={(e) => {
                    setModalTargetClassId(e.target.value);
                    setModalTargetSectionId("");
                  }}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none text-zinc-700 font-semibold"
                >
                  <option value="">Select Destination Class</option>
                  {[...(allocationData.classes || [])].sort((a, b) => {
                    const getNumericVal = (name) => {
                      if (!name) return 999;
                      const match = String(name).match(/\d+/);
                      return match ? parseInt(match[0], 10) : 999;
                    };
                    return getNumericVal(a.name) - getNumericVal(b.name);
                  }).map(cls => {
                    const formatClassName = (name) => {
                      if (!name) return "";
                      const match = name.match(/class\s*-?\s*(\d+)/i);
                      if (match) return `Class ${match[1]}`;
                      return name;
                    };
                    return (
                      <option key={cls.id} value={cls.id}>{formatClassName(cls.name)}</option>
                    );
                  })}
                </select>
              </div>

              {/* Destination Section Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Destination Section</label>
                <select
                  required
                  disabled={!modalTargetClassId}
                  value={modalTargetSectionId}
                  onChange={(e) => setModalTargetSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none text-zinc-700 font-semibold disabled:opacity-50"
                >
                  <option value="">Select Destination Section</option>
                  {targetClassSections.map(sec => (
                    <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? "Moving..." : "Move Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
