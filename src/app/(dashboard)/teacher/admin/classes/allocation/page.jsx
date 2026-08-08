"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaUserGraduate, FaExchangeAlt, FaChevronLeft, FaSearch, 
  FaTimes, FaUserCheck, FaArrowRight
} from "react-icons/fa";
import { 
  getTeacherClasses,
  getTeacherClassDetail,
  getTeacherStudents,
  assignTeacherStudentsToSection,
  transferTeacherStudents,
  bulkAssignTeacherStudents,
  bulkTransferTeacherStudents
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherStudentAllocationPage() {
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
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
  const [modalSections, setModalSections] = useState([]);

  // Load classes overview
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getTeacherClasses();
      setClassesList(data.classes || data.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("Failed to load classes info: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Load detailed class roster
  const loadClassRoster = async (classId) => {
    try {
      setLoading(true);
      const [detailRes, studentsRes] = await Promise.all([
        getTeacherClassDetail(classId),
        getTeacherStudents({ school_class_id: classId })
      ]);
      
      const detailed = detailRes.class || detailRes.data || detailRes;
      setSelectedClass(detailed);
      
      const sts = studentsRes.students || studentsRes.data || (Array.isArray(studentsRes) ? studentsRes : []);
      setStudentsList(sts);
      setSelectedStudentIds([]);
    } catch (err) {
      toast.error("Failed to load class roster: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Source Class selection handler
  const handleSelectClass = (cls) => {
    setSelectedSectionId("all");
    setAllocationFilter("all");
    setStudentSearchQuery("");
    loadClassRoster(cls.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setStudentsList([]);
    loadClasses();
  };

  // List of target sections depending on selected target class inside modals
  const targetClassSections = modalSections;

  const handleModalClassChange = async (classId) => {
    setModalTargetClassId(classId);
    setModalTargetSectionId("");
    setModalSections([]);
    if (!classId) return;
    try {
      const data = await getTeacherClassDetail(classId);
      const cls = data.class || data.data || data;
      setModalSections(cls.sections || []);
    } catch (err) {
      toast.error("Failed to load target sections: " + (err.message || err));
    }
  };

  const preloadModalSections = async (classId) => {
    setModalSections([]);
    if (!classId) return;
    try {
      const data = await getTeacherClassDetail(classId);
      const cls = data.class || data.data || data;
      setModalSections(cls.sections || []);
    } catch (err) {
      console.warn("Preload error:", err);
    }
  };

  // Filtered students for selected workspace class
  const filteredStudents = useMemo(() => {
    let list = studentsList;

    // Filter by Section dropdown
    if (selectedSectionId !== "all") {
      list = list.filter(s => s.section_id === selectedSectionId || s.section === selectedSectionId);
    }

    // Filter by allocation state
    if (allocationFilter === "allocated") {
      list = list.filter(s => !!s.section_id || !!s.section);
    } else if (allocationFilter === "unallocated") {
      list = list.filter(s => !s.section_id && !s.section);
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
  }, [studentsList, selectedSectionId, allocationFilter, studentSearchQuery]);

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
    const clsId = student.school_class_id || "";
    setModalTargetClassId(clsId);
    setModalTargetSectionId("");
    setIsTransferModalOpen(true);
    preloadModalSections(clsId);
  };

  // Triggers assign modal for single student
  const openSingleAssign = (student) => {
    setSingleTargetStudent(student);
    setIsBulkAction(false);
    const clsId = student.school_class_id || "";
    setModalTargetClassId(clsId);
    setModalTargetSectionId("");
    setIsAssignModalOpen(true);
    preloadModalSections(clsId);
  };

  // Triggers bulk actions
  const openBulkTransfer = () => {
    if (selectedStudentIds.length === 0) return;
    setIsBulkAction(true);
    setSingleTargetStudent(null);
    const clsId = selectedClass?.id || "";
    setModalTargetClassId(clsId);
    setModalTargetSectionId("");
    setIsTransferModalOpen(true);
    preloadModalSections(clsId);
  };

  const openBulkAssign = () => {
    if (selectedStudentIds.length === 0) return;
    setIsBulkAction(true);
    setSingleTargetStudent(null);
    const clsId = selectedClass?.id || "";
    setModalTargetClassId(clsId);
    setModalTargetSectionId("");
    setIsAssignModalOpen(true);
    preloadModalSections(clsId);
  };

  // Submit transfer handler
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!modalTargetClassId || !modalTargetSectionId) {
      toast.error("Please select target Class and Section.");
      return;
    }

    setModalSubmitting(true);
    try {
      const studentIds = isBulkAction ? selectedStudentIds : [singleTargetStudent.id];
      const payload = {
        student_ids: studentIds,
        school_class_id: modalTargetClassId,
        to_school_class_id: modalTargetClassId,
        to_class_id: modalTargetClassId,
        section_id: modalTargetSectionId,
        to_section_id: modalTargetSectionId
      };

      if (isBulkAction) {
        await bulkTransferTeacherStudents(payload);
        toast.success(`Successfully transferred ${studentIds.length} students.`);
      } else {
        await transferTeacherStudents(payload);
        toast.success(`Successfully transferred student ${singleTargetStudent.full_name}.`);
      }

      setIsTransferModalOpen(false);
      loadClassRoster(selectedClass?.id);
    } catch (err) {
      toast.error("Transfer failed: " + (err.message || err));
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit allocation handler
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!modalTargetClassId || !modalTargetSectionId) {
      toast.error("Please select Class and target Section.");
      return;
    }

    setModalSubmitting(true);
    try {
      const studentIds = isBulkAction ? selectedStudentIds : [singleTargetStudent.id];
      const payload = {
        student_ids: studentIds,
        school_class_id: modalTargetClassId,
        to_school_class_id: modalTargetClassId,
        to_class_id: modalTargetClassId,
        section_id: modalTargetSectionId,
        to_section_id: modalTargetSectionId
      };

      if (isBulkAction) {
        await bulkAssignTeacherStudents(payload);
        toast.success(`Successfully allocated ${studentIds.length} students.`);
      } else {
        await assignTeacherStudentsToSection(payload);
        toast.success(`Successfully allocated student ${singleTargetStudent.full_name}.`);
      }

      setIsAssignModalOpen(false);
      loadClassRoster(selectedClass?.id);
    } catch (err) {
      toast.error("Allocation failed: " + (err.message || err));
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader
          title="Student Allocation & Transfer"
          subtitle="Manage student classroom assignations and transfers between sections."
        />

      {loading && !selectedClass ? (
        <div className="py-12"><PageLoader /></div>
      ) : (
        <div>
          {/* Class Select Mode */}
          {!selectedClass ? (
            <div className="space-y-6">
              <div className="bg-white p-4 border border-zinc-200 shadow-sm rounded-2xl">
                <h2 className="text-zinc-800 font-extrabold text-sm mb-1">Select Source Class</h2>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Choose a classroom to manage its roster list</p>
              </div>

              {classesList.length === 0 ? (
                <EmptyState
                  title="No Classes Assigned"
                  desc="No classes were found under your roster directory."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classesList.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all rounded-2xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-zinc-800 font-black text-base">{cls.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          Sections: {cls.sections_count || cls.sections?.length || 0}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                        <span className="text-[10px] bg-zinc-100 font-extrabold text-zinc-600 px-2.5 py-1 rounded-lg">
                          {cls.students_count || 0} Enrolled
                        </span>
                        <button
                          onClick={() => handleSelectClass(cls)}
                          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                        >
                          Manage Roster
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-xl text-[10px] font-semibold outline-none focus:border-violet-500 bg-zinc-50 focus:bg-white text-black text-black"
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
                      <option key={sec.id} value={sec.id || sec.name}>Section {sec.name}</option>
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
                      desc="No students matched your filter criteria in this class."
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
                              {student.section || student.section_name ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-violet-50 text-violet-600 border border-violet-100">
                                  Section {student.section || student.section_name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-zinc-100 text-zinc-600">
                                  Unallocated
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {student.section_id || student.section ? (
                                <button
                                  onClick={() => openSingleTransfer(student)}
                                  className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <FaExchangeAlt className="w-2.5 h-2.5" /> Transfer
                                </button>
                              ) : (
                                <button
                                  onClick={() => openSingleAssign(student)}
                                  className="px-3 py-1.5 bg-violet-50 border border-violet-100 text-violet-600 hover:bg-violet-100 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <FaUserCheck className="w-2.5 h-2.5" /> Allocate
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
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center justify-between gap-8 z-40 border border-zinc-800 max-w-lg w-full animate-scale-up">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black">{selectedStudentIds.length} Students Selected</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Execute batch class actions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openBulkTransfer}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FaExchangeAlt className="w-3 h-3" /> Bulk Transfer
                    </button>
                    <button
                      onClick={openBulkAssign}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FaUserCheck className="w-3 h-3" /> Bulk Allocate
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
      )}

      {/* Transfer Dialog Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                <FaExchangeAlt className="text-violet-500" /> Student Transfer
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

              {/* Destination Class Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Destination Class</label>
                <select
                  required
                  value={modalTargetClassId}
                  onChange={(e) => handleModalClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none text-zinc-700 font-semibold"
                >
                  <option value="">Select Destination Class</option>
                  {classesList.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
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
                  {modalSubmitting ? "Processing..." : "Transfer Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign/Allocate Dialog Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                <FaUserCheck className="text-violet-500" /> Student Allocation
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

              {/* Class Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Class</label>
                <select
                  required
                  value={modalTargetClassId}
                  onChange={(e) => handleModalClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-white outline-none text-zinc-700 font-semibold"
                >
                  <option value="">Select Target Class</option>
                  {classesList.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination Section Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Allocation Section</label>
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
                  {modalSubmitting ? "Allocating..." : "Allocate Students"}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>
  );
}
