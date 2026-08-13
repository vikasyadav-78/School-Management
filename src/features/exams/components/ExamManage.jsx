"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { FaTrash, FaPlus, FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import { getExamClassSubjects } from "@/features/admin/services/exam.service";
import {
  addScheduleItem,
  addSchedulesBulk,
  removeScheduleItem,
  removeSchedulesBulk,
  fetchExamById
} from "../redux/examThunk";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/tables/DataTable";
import Modal from "@/components/ui/Modal";
import { useAppDialog } from "@/context/DialogContext";

export default function ExamManage({ exam = {}, classes = [], schedules = [], onRefresh }) {
  const dispatch = useDispatch();
  const dialog = useAppDialog();

  // Class / Section / Subject states
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected schedules for bulk delete
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  // Modals state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Single Schedule Form state
  const [singleForm, setSingleForm] = useState({
    subject_id: "",
    exam_date: "",
    start_time: "09:00",
    end_time: "12:00",
    theory_max: 70,
    practical_max: 20,
    internal_max: 10,
    pass_marks: 33,
    room: "",
    exam_center: exam.exam_center || ""
  });

  // Bulk Schedules Forms state
  const [bulkSchedules, setBulkSchedules] = useState([]);

  // Find sections for selected class
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const sections = currentClass?.sections || [];

  // Load subjects when class changes
  useEffect(() => {
    if (selectedClassId) {
      const fetchSubjects = async () => {
        try {
          setLoadingSubjects(true);
          const data = await getExamClassSubjects(exam.id, selectedClassId);
          setSubjects(data.subjects || []);
        } catch (err) {
          toast.error("Failed to load subjects for class: " + (err.message || err));
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
      setSelectedSectionId("");
    } else {
      setSubjects([]);
      setSelectedSectionId("");
    }
  }, [selectedClassId, exam.id]);

  // Setup bulk schedules inputs when subjects/sections are selected
  useEffect(() => {
    if (subjects.length > 0 && selectedSectionId) {
      setBulkSchedules(
        subjects.map((sub) => ({
          subject_id: sub.id,
          subject_name: sub.name,
          exam_date: "",
          start_time: "09:00:00",
          end_time: "12:00:00",
          theory_max: 70,
          practical_max: 20,
          internal_max: 10,
          pass_marks: 33,
          room: "",
          exam_center: exam.exam_center || ""
        }))
      );
    } else {
      setBulkSchedules([]);
    }
  }, [subjects, selectedSectionId, exam.exam_center]);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId || !singleForm.subject_id || !singleForm.exam_date) {
      toast.error("Class, Section, Subject, and Exam Date are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        school_class_id: selectedClassId,
        section_id: selectedSectionId,
        ...singleForm,
        max_marks: Number(singleForm.theory_max) + Number(singleForm.practical_max) + Number(singleForm.internal_max)
      };

      await dispatch(addScheduleItem({ examId: exam.id, data: payload })).unwrap();
      toast.success("Schedule created successfully!");
      setIsSingleModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err || "Failed to create schedule");
    } finally {
      setSubmitting(false);
    }
  };

 const handleBulkSubmit = async (e) => {
  e.preventDefault();
  const filledSchedules = bulkSchedules.filter(
    (s) => s.exam_date && s.exam_date.trim() !== "" && s.start_time && s.end_time
  );

  if (filledSchedules.length === 0) {
    toast.error("Please fill Exam Date, Start Time & End Time for at least one subject.");
    return;
  }

  try {
    setSubmitting(true);
    
    const payload = {
      school_class_id: selectedClassId,
      section_id: selectedSectionId,
      schedules: filledSchedules.map((s) => ({
        subject_id: s.subject_id,
        exam_date: s.exam_date,
        start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
        end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
        theory_max: Number(s.theory_max || 0),
        practical_max: Number(s.practical_max || 0),
        internal_max: Number(s.internal_max || 0),
        pass_marks: Number(s.pass_marks || 0),
        room: s.room || "",
        exam_center: s.exam_center || "",
        max_marks: Number(s.theory_max || 0) + Number(s.practical_max || 0) + Number(s.internal_max || 0)
      }))
    };

    const res = await dispatch(addSchedulesBulk({ examId: exam.id, data: payload })).unwrap();
     
    if (res && res.success === false) {
      toast.warning(res.message || "No new schedules were created. Subjects might already exist.");
    } else {
      toast.success(`Schedules processed successfully!`);
      setIsBulkModalOpen(false);
      if (onRefresh) onRefresh();
    }
  } catch (err) { 
    const errorMessage = typeof err === "object" ? err.message : err;
    toast.error(errorMessage || "Failed to create bulk schedules");
  } finally {
    setSubmitting(false);
  }
};

  const handleDeleteSingle = async (row) => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Schedule",
      message: `Are you sure you want to delete the exam schedule for ${row.class} ${row.section} - ${row.subject}?`
    });

    if (confirmed) {
      try {
        await dispatch(removeScheduleItem({ examId: exam.id, scheduleId: row.id })).unwrap();
        toast.success("Schedule deleted successfully.");
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err || "Failed to delete schedule");
      }
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedSchedules.length === 0) return;

    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Selected Schedules",
      message: `Are you sure you want to delete the ${selectedSchedules.length} selected schedule(s)?`
    });

    if (confirmed) {
      try {
        await dispatch(
          removeSchedulesBulk({
            examId: exam.id,
            data: { schedule_ids: selectedSchedules }
          })
        ).unwrap();
        toast.success("Selected schedules deleted successfully.");
        setSelectedSchedules([]);
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err || "Failed to delete selected schedules");
      }
    }
  };

  const toggleSelectSchedule = (id) => {
    if (selectedSchedules.includes(id)) {
      setSelectedSchedules(selectedSchedules.filter((sid) => sid !== id));
    } else {
      setSelectedSchedules([...selectedSchedules, id]);
    }
  };

  const toggleSelectAll = (filteredData) => {
    const filteredIds = filteredData.map((d) => d.id);
    const allSelected = filteredIds.every((id) => selectedSchedules.includes(id));

    if (allSelected) {
      setSelectedSchedules(selectedSchedules.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedSchedules([...new Set([...selectedSchedules, ...filteredIds])]);
    }
  };

  // Filter schedules based on search term
  const filteredSchedules = schedules.filter((sch) => {
    const text = searchTerm.toLowerCase();
    return (
      sch.class?.toLowerCase().includes(text) ||
      sch.section?.toLowerCase().includes(text) ||
      sch.subject?.toLowerCase().includes(text) ||
      sch.room?.toLowerCase().includes(text)
    );
  });

  // Paginate filtered schedules
  const totalCount = filteredSchedules.length;
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={
            paginatedSchedules.length > 0 &&
            paginatedSchedules.every((s) => selectedSchedules.includes(s.id))
          }
          onChange={() => toggleSelectAll(paginatedSchedules)}
          className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
        />
      ),
      accessor: "select",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedSchedules.includes(row.id)}
          onChange={() => toggleSelectSchedule(row.id)}
          className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
        />
      )
    },
    { header: "Class", accessor: "class" },
    { header: "Section", accessor: "section" },
    { header: "Subject", accessor: "subject" },
    { header: "Date", accessor: "exam_date" },
    {
      header: "Time",
      accessor: "time",
      render: (row) => `${row.start_time?.slice(0, 5)} - ${row.end_time?.slice(0, 5)}`
    },
    { header: "Room", accessor: "room" },
    { header: "Max Marks", accessor: "max_marks" },
    { header: "Pass Marks", accessor: "pass_marks" }
  ];

  return (
    <div className="space-y-6">
      {/* Selection Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-extrabold text-zinc-800 text-sm mb-4">Select Class and Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={[
              { value: "", label: "Select Class" },
              ...classes.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          <Select
            label="Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            options={[
              { value: "", label: "Select Section" },
              ...sections.map((s) => ({ value: s.id, label: s.name }))
            ]}
            disabled={!selectedClassId}
          />
          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              className="flex-1 py-2.5 text-xs font-semibold"
              disabled={!selectedClassId || !selectedSectionId}
              onClick={() => setIsSingleModalOpen(true)}
            >
              <FaPlus className="mr-1.5" /> Add Schedule
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-2.5 text-xs font-semibold"
              disabled={!selectedClassId || !selectedSectionId || subjects.length === 0}
              onClick={() => setIsBulkModalOpen(true)}
            >
              <FaPlus className="mr-1.5" /> Bulk Create
            </Button>
          </div>
        </div>
      </div>

      {/* Table Frame */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
            />
          </div>
          {selectedSchedules.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteBulk}>
              <FaTrash className="mr-1.5" /> Delete Selected ({selectedSchedules.length})
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={paginatedSchedules}
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onDelete={handleDeleteSingle}
          emptyMessage="No schedules mapped to this exam yet."
        />
      </div>

      {/* Single Schedule Modal */}
      {isSingleModalOpen && (
        <Modal
          isOpen={isSingleModalOpen}
          onClose={() => setIsSingleModalOpen(false)}
          title={`Add Schedule - ${currentClass?.name} ${sections.find((s) => s.id === selectedSectionId)?.name}`}
        >
          <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs font-semibold text-zinc-700">
            <Select
              label="Subject"
              value={singleForm.subject_id}
              onChange={(e) => setSingleForm({ ...singleForm, subject_id: e.target.value })}
              options={[
                { value: "", label: "Select Subject" },
                ...subjects.map((sub) => ({ value: sub.id, label: sub.name }))
              ]}
              disabled={loadingSubjects}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Exam Date"
                type="date"
                value={singleForm.exam_date}
                onChange={(e) => setSingleForm({ ...singleForm, exam_date: e.target.value })}
              />
              <Input
                label="Room"
                placeholder="e.g. 101"
                value={singleForm.room}
                onChange={(e) => setSingleForm({ ...singleForm, room: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time" 
                value={singleForm.start_time}
                onChange={(e) => setSingleForm({ ...singleForm, start_time: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={singleForm.end_time}
                onChange={(e) => setSingleForm({ ...singleForm, end_time: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Input
                label="Theory Max"
                type="number"
                value={singleForm.theory_max}
                onChange={(e) => setSingleForm({ ...singleForm, theory_max: e.target.value })}
              />
              <Input
                label="Practical Max"
                type="number"
                value={singleForm.practical_max}
                onChange={(e) => setSingleForm({ ...singleForm, practical_max: e.target.value })}
              />
              <Input
                label="Internal Max"
                type="number"
                value={singleForm.internal_max}
                onChange={(e) => setSingleForm({ ...singleForm, internal_max: e.target.value })}
              />
              <Input
                label="Pass Marks"
                type="number"
                value={singleForm.pass_marks}
                onChange={(e) => setSingleForm({ ...singleForm, pass_marks: e.target.value })}
              />
            </div>

            <Input
              label="Exam Center"
              placeholder="same school"
              value={singleForm.exam_center}
              onChange={(e) => setSingleForm({ ...singleForm, exam_center: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSingleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                Save Schedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Schedules Modal */}
      {isBulkModalOpen && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title={`Bulk Create - ${currentClass?.name} ${sections.find((s) => s.id === selectedSectionId)?.name}`}
          size="lg"
        >
          <form onSubmit={handleBulkSubmit} className="space-y-4 text-[10px] font-semibold text-zinc-700">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Subject</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Date</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Start Time</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">End Time</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Theory</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Practical</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Internal</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Pass</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500 font-bold">Room</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-100">
                  {bulkSchedules.map((row, idx) => (
                    <tr key={row.subject_id}>
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-800 text-xs capitalize">{row.subject_name}</td>
                      <td className="px-1 py-1">
                        <input
                          type="date"
                          value={row.exam_date}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].exam_date = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[120px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="time"
                          value={row.start_time}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].start_time = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[90px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="time"
                          value={row.end_time}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].end_time = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[90px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.theory_max}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].theory_max = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[50px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.practical_max}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].practical_max = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[50px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.internal_max}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].internal_max = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[50px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.pass_marks}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].pass_marks = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[50px]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={row.room}
                          onChange={(e) => {
                            const newBulk = [...bulkSchedules];
                            newBulk[idx].room = e.target.value;
                            setBulkSchedules(newBulk);
                          }}
                          placeholder="e.g. 11"
                          className="px-2 py-1 border border-zinc-200 rounded-md outline-none focus:border-violet-500 text-xs w-[60px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                Save Schedules
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
