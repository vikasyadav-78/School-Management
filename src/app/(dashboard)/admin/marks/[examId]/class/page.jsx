"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaEdit, FaTimesCircle, FaUser } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { getClassMarksRoster, saveClassMarks } from "@/features/admin/services/marks.service";
import { toast } from "sonner";

export default function ClassMarksEntryPage({ params }) {
  const { examId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("class_id");
  const sectionId = searchParams.get("section_id");

  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [studentMarksState, setStudentMarksState] = useState({}); // studentId -> { theory_marks, practical_marks, internal_marks, is_absent }
  const [validationErrors, setValidationErrors] = useState({}); // studentId -> { theory_marks, practical_marks, internal_marks }
  const [saving, setSaving] = useState(false);

  const loadRoster = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClassMarksRoster(examId, classId, sectionId);
      setRoster(data);

      // Default to first schedule if available
      if (data.schedules && data.schedules.length > 0) {
        setSelectedScheduleId(data.schedules[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load marks roster");
      toast.error(err.message || "Failed to load marks roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId && classId && sectionId) {
      loadRoster();
    }
  }, [examId, classId, sectionId]);

  // Find active schedule limits
  const activeSchedule = roster?.schedules?.find(s => s.id === selectedScheduleId);

  // Initialize student marks state when active schedule changes
  useEffect(() => {
    if (activeSchedule && roster?.students) {
      const initialMarks = {};
      roster.students.forEach(student => {
        const scheduleMarks = student.marks?.[selectedScheduleId] || {};
        initialMarks[student.id] = {
          theory_marks: scheduleMarks.theory_marks !== null && scheduleMarks.theory_marks !== undefined ? scheduleMarks.theory_marks : "",
          practical_marks: scheduleMarks.practical_marks !== null && scheduleMarks.practical_marks !== undefined ? scheduleMarks.practical_marks : "",
          internal_marks: scheduleMarks.internal_marks !== null && scheduleMarks.internal_marks !== undefined ? scheduleMarks.internal_marks : "",
          is_absent: !!scheduleMarks.is_absent
        };
      });
      setStudentMarksState(initialMarks);
      setValidationErrors({});
    }
  }, [selectedScheduleId, roster, activeSchedule]);

  const handleMarkChange = (studentId, field, value) => {
    setStudentMarksState(prev => {
      const updatedStudent = { ...prev[studentId] };

      if (field === "is_absent") {
        updatedStudent.is_absent = value;
        if (value) {
          // Reset marks when absent
          updatedStudent.theory_marks = "";
          updatedStudent.practical_marks = "";
          updatedStudent.internal_marks = "";
        }
      } else {
        updatedStudent[field] = value;
      }

      // Realtime validation
      validateField(studentId, field, updatedStudent[field]);

      return {
        ...prev,
        [studentId]: updatedStudent
      };
    });
  };

  const validateField = (studentId, field, value) => {
    if (!activeSchedule) return true;
    let isValid = true;
    let errorMsg = "";

    if (value === "") return true; // Empty marks is allowed

    const numericVal = Number(value);
    if (isNaN(numericVal) || numericVal < 0) {
      isValid = false;
      errorMsg = "Must be positive number";
    } else {
      if (field === "theory_marks" && numericVal > (activeSchedule.theory_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max theory (${activeSchedule.theory_max})`;
      }
      if (field === "practical_marks" && numericVal > (activeSchedule.practical_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max practical (${activeSchedule.practical_max})`;
      }
      if (field === "internal_marks" && numericVal > (activeSchedule.internal_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max internal (${activeSchedule.internal_max})`;
      }
    }

    setValidationErrors(prev => {
      const studentErrs = { ...prev[studentId] };
      if (!isValid) {
        studentErrs[field] = errorMsg;
      } else {
        delete studentErrs[field];
      }

      // If empty, clean student key entirely
      if (Object.keys(studentErrs).length === 0) {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      }

      return {
        ...prev,
        [studentId]: studentErrs
      };
    });

    return isValid;
  };

  const handleSave = async () => {
    // Run validation across all fields
    let hasErrors = false;
    roster.students.forEach(student => {
      const studentMarks = studentMarksState[student.id];
      if (studentMarks && !studentMarks.is_absent) {
        const vTheory = validateField(student.id, "theory_marks", studentMarks.theory_marks);
        const vPractical = validateField(student.id, "practical_marks", studentMarks.practical_marks);
        const vInternal = validateField(student.id, "internal_marks", studentMarks.internal_marks);
        if (!vTheory || !vPractical || !vInternal) {
          hasErrors = true;
        }
      }
    });

    if (hasErrors || Object.keys(validationErrors).length > 0) {
      toast.error("Please resolve validation errors before saving.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        class_id: classId,
        section_id: sectionId,
        schedule_id: selectedScheduleId,
        marks: Object.keys(studentMarksState).map(studentId => {
          const m = studentMarksState[studentId];
          return {
            student_id: studentId,
            theory_marks: m.is_absent || m.theory_marks === "" ? null : Number(m.theory_marks),
            practical_marks: m.is_absent || m.practical_marks === "" ? null : Number(m.practical_marks),
            internal_marks: m.is_absent || m.internal_marks === "" ? null : Number(m.internal_marks),
            is_absent: m.is_absent
          };
        })
      };

      await saveClassMarks(examId, payload);
      toast.success("Marks saved successfully!");
      loadRoster(); // Reload marks state silently
    } catch (err) {
      toast.error(err.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !roster) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
          Failed to load marks roster: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Marks Entry — ${roster.class?.name} (${roster.class?.section})`}
        subtitle={`Exam: ${roster.exam?.name} | Select subject schedule below to insert marks.`}
        action={
          <Link href="/admin/marks">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 text-xs text-zinc-700">
        {/* Subject Selector & Actions */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="w-full md:max-w-xs">
            <Select
              label="Subject Schedule"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              options={
                roster.schedules?.map(s => ({
                  value: s.id,
                  label: `${s.subject.toUpperCase()} (Max: T:${s.theory_max} P:${s.practical_max} I:${s.internal_max})`
                })) || []
              }
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            className="py-2.5 px-6 font-bold shadow-md self-start md:self-auto"
          >
            <FaSave className="mr-1.5" /> Save Changes
          </Button>
        </div>

        {/* Students Editable Grid */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-150 text-left font-semibold">
              <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 w-32">Theory Marks</th>
                  <th className="px-6 py-4 w-32">Practical Marks</th>
                  <th className="px-6 py-4 w-32">Internal Marks</th>
                  <th className="px-6 py-4 w-28">Total</th>
                  <th className="px-6 py-4 w-28">Absent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {(!roster.students || roster.students.length === 0) ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-zinc-400 font-medium">
                      No students enrolled in this class-section.
                    </td>
                  </tr>
                ) : (
                  roster.students.map(student => {
                    const marks = studentMarksState[student.id] || {
                      theory_marks: "",
                      practical_marks: "",
                      internal_marks: "",
                      is_absent: false
                    };

                    const errs = validationErrors[student.id] || {};

                    const theoryNum = marks.is_absent ? 0 : Number(marks.theory_marks) || 0;
                    const practicalNum = marks.is_absent ? 0 : Number(marks.practical_marks) || 0;
                    const internalNum = marks.is_absent ? 0 : Number(marks.internal_marks) || 0;
                    const computedTotal = theoryNum + practicalNum + internalNum;

                    return (
                      <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-bold">
                          #{student.roll_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={student.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-100"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                                <FaUser className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-zinc-800">{student.full_name}</p>
                              <p className="text-[10px] text-zinc-400 font-semibold">{student.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={marks.theory_marks}
                            onChange={(e) => handleMarkChange(student.id, "theory_marks", e.target.value)}
                            disabled={marks.is_absent}
                            placeholder={`Max ${activeSchedule?.theory_max || 0}`}
                            className={`w-24 px-2 py-1.5 border rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500 ${
                              errs.theory_marks ? "border-rose-500 focus:border-rose-500" : "border-zinc-200"
                            }`}
                          />
                          {errs.theory_marks && (
                            <span className="text-[9px] text-rose-500 font-bold block mt-1">
                              {errs.theory_marks}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={marks.practical_marks}
                            onChange={(e) => handleMarkChange(student.id, "practical_marks", e.target.value)}
                            disabled={marks.is_absent}
                            placeholder={`Max ${activeSchedule?.practical_max || 0}`}
                            className={`w-24 px-2 py-1.5 border rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500 ${
                              errs.practical_marks ? "border-rose-500 focus:border-rose-500" : "border-zinc-200"
                            }`}
                          />
                          {errs.practical_marks && (
                            <span className="text-[9px] text-rose-500 font-bold block mt-1">
                              {errs.practical_marks}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={marks.internal_marks}
                            onChange={(e) => handleMarkChange(student.id, "internal_marks", e.target.value)}
                            disabled={marks.is_absent}
                            placeholder={`Max ${activeSchedule?.internal_max || 0}`}
                            className={`w-24 px-2 py-1.5 border rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500 ${
                              errs.internal_marks ? "border-rose-500 focus:border-rose-500" : "border-zinc-200"
                            }`}
                          />
                          {errs.internal_marks && (
                            <span className="text-[9px] text-rose-500 font-bold block mt-1">
                              {errs.internal_marks}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-900">
                          {marks.is_absent ? (
                            <span className="text-zinc-400 font-semibold italic text-[10px]">Absent</span>
                          ) : (
                            `${computedTotal}/${activeSchedule?.total_max || 0}`
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={marks.is_absent}
                            onChange={(e) => handleMarkChange(student.id, "is_absent", e.target.checked)}
                            className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/admin/marks/${examId}/student/${student.id}`}>
                            <button
                              type="button"
                              className="inline-flex p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors font-bold text-[10px] items-center gap-1 cursor-pointer"
                              title="Edit all subjects for this student"
                            >
                              <FaEdit className="w-3.5 h-3.5" /> Full Entry
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
