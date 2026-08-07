"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaUser, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getStudentMarksDetail, saveStudentMarks } from "@/features/admin/services/marks.service";
import { toast } from "sonner";

export default function StudentMarksEntryPage({ params }) {
  const { examId, studentId } = use(params);
  const router = useRouter();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [marksState, setMarksState] = useState([]); // Array of { schedule_id, theory_max, practical_max, internal_max, total_max, theory_marks, practical_marks, internal_marks, is_absent, subject_name }
  const [remarks, setRemarks] = useState("");
  const [validationErrors, setValidationErrors] = useState({}); // schedule_id -> { theory_marks, ... }
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentMarksDetail(examId, studentId);
      setDetail(data);

      setRemarks(data.summary?.remarks || "");

      // Initialize marks array
      if (data.schedules) {
        setMarksState(
          data.schedules.map(sch => {
            const m = sch.marks || {};
            return {
              schedule_id: sch.id,
              subject_name: sch.subject,
              theory_max: sch.theory_max,
              practical_max: sch.practical_max,
              internal_max: sch.internal_max,
              total_max: sch.total_max,
              theory_marks: m.theory_marks !== null && m.theory_marks !== undefined ? m.theory_marks : "",
              practical_marks: m.practical_marks !== null && m.practical_marks !== undefined ? m.practical_marks : "",
              internal_marks: m.internal_marks !== null && m.internal_marks !== undefined ? m.internal_marks : "",
              is_absent: !!m.is_absent
            };
          })
        );
      }
      setValidationErrors({});
    } catch (err) {
      setError(err.message || "Failed to load student marks details");
      toast.error(err.message || "Failed to load student marks details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId && studentId) {
      loadData();
    }
  }, [examId, studentId]);

  const handleMarkChange = (idx, field, value) => {
    setMarksState(prev => {
      const updated = [...prev];
      const row = { ...updated[idx] };

      if (field === "is_absent") {
        row.is_absent = value;
        if (value) {
          row.theory_marks = "";
          row.practical_marks = "";
          row.internal_marks = "";
        }
      } else {
        row[field] = value;
      }

      updated[idx] = row;
      validateField(row.schedule_id, row, field, row[field]);
      return updated;
    });
  };

  const validateField = (scheduleId, row, field, value) => {
    let isValid = true;
    let errorMsg = "";

    if (value === "") return true;

    const numericVal = Number(value);
    if (isNaN(numericVal) || numericVal < 0) {
      isValid = false;
      errorMsg = "Must be positive";
    } else {
      if (field === "theory_marks" && numericVal > (row.theory_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max theory (${row.theory_max})`;
      }
      if (field === "practical_marks" && numericVal > (row.practical_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max practical (${row.practical_max})`;
      }
      if (field === "internal_marks" && numericVal > (row.internal_max || 0)) {
        isValid = false;
        errorMsg = `Exceeds max internal (${row.internal_max})`;
      }
    }

    setValidationErrors(prev => {
      const scheduleErrs = { ...prev[scheduleId] };
      if (!isValid) {
        scheduleErrs[field] = errorMsg;
      } else {
        delete scheduleErrs[field];
      }

      const copy = { ...prev };
      if (Object.keys(scheduleErrs).length === 0) {
        delete copy[scheduleId];
      } else {
        copy[scheduleId] = scheduleErrs;
      }
      return copy;
    });

    return isValid;
  };

  const handleSave = async () => {
    let hasErrors = false;
    marksState.forEach(row => {
      if (!row.is_absent) {
        const vTheory = validateField(row.schedule_id, row, "theory_marks", row.theory_marks);
        const vPractical = validateField(row.schedule_id, row, "practical_marks", row.practical_marks);
        const vInternal = validateField(row.schedule_id, row, "internal_marks", row.internal_marks);
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
        remarks: remarks || null,
        marks: marksState.map(m => ({
          schedule_id: m.schedule_id,
          theory_marks: m.is_absent || m.theory_marks === "" ? null : Number(m.theory_marks),
          practical_marks: m.is_absent || m.practical_marks === "" ? null : Number(m.practical_marks),
          internal_marks: m.is_absent || m.internal_marks === "" ? null : Number(m.internal_marks),
          is_absent: m.is_absent
        }))
      };

      await saveStudentMarks(examId, studentId, payload);
      toast.success("Student marks updated successfully!");
      loadData(); // Silent refresh
    } catch (err) {
      toast.error(err.message || "Failed to save student marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !detail) {
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
          Failed to load student details: {error}
        </div>
      </DashboardLayout>
    );
  }

  const { student, summary } = detail || {};

  return (
    <DashboardLayout>
      <PageHeader
        title={`Student Marks Entry — ${student?.full_name}`}
        subtitle={`Exam: ${detail?.exam?.name} | Complete subject-wise grade details.`}
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <FaArrowLeft className="mr-1.5" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-zinc-700 font-semibold">
        {/* Left Side: Student Info & Marks Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            {student?.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.full_name}
                className="w-20 h-20 rounded-full object-cover border-2 border-violet-100 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center border-2 border-violet-100 shadow-sm">
                <FaUser className="w-8 h-8" />
              </div>
            )}
            <h3 className="font-extrabold text-zinc-800 text-sm mt-4">{student?.full_name}</h3>
            <p className="text-zinc-400 font-semibold text-[10px] mt-0.5">{student?.student_id}</p>
            <div className="mt-4 pt-4 border-t border-zinc-100 w-full grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Class</span>
                <span className="text-zinc-700">{student?.class} ({student?.section})</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">Roll No</span>
                <span className="text-zinc-700">#{student?.roll_no}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              Performance Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  summary?.status?.toLowerCase() === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {summary?.status || "Fail"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Marks</span>
                <span className="text-zinc-800">{summary?.total_obtained || 0}/{summary?.total_max || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Percentage</span>
                <span className="text-zinc-800">{summary?.percentage || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Grade</span>
                <span className="text-violet-600 font-bold">{summary?.grade || "F"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Subjects Editable list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              Marks Entry Table
            </h4>
            <div className="space-y-4">
              {marksState.map((row, idx) => {
                const errs = validationErrors[row.schedule_id] || {};
                const theoryNum = row.is_absent ? 0 : Number(row.theory_marks) || 0;
                const practicalNum = row.is_absent ? 0 : Number(row.practical_marks) || 0;
                const internalNum = row.is_absent ? 0 : Number(row.internal_marks) || 0;
                const totalObtained = theoryNum + practicalNum + internalNum;

                return (
                  <div
                    key={row.schedule_id}
                    className="p-4 bg-zinc-50/55 border border-zinc-150 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-extrabold text-zinc-800 text-xs uppercase tracking-wider">
                        {row.subject_name}
                      </h5>
                      <div className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.is_absent}
                          onChange={(e) => handleMarkChange(idx, "is_absent", e.target.checked)}
                          id={`absent-${row.schedule_id}`}
                          className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor={`absent-${row.schedule_id}`} className="text-[10px] text-zinc-400 select-none cursor-pointer">
                          Mark Absent
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1">Theory ({row.theory_max})</label>
                        <input
                          type="number"
                          value={row.theory_marks}
                          onChange={(e) => handleMarkChange(idx, "theory_marks", e.target.value)}
                          disabled={row.is_absent}
                          className="w-full px-2 py-1.5 border border-zinc-200 rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500"
                        />
                        {errs.theory_marks && (
                          <span className="text-[9px] text-rose-500 font-bold mt-1 block">{errs.theory_marks}</span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1">Practical ({row.practical_max})</label>
                        <input
                          type="number"
                          value={row.practical_marks}
                          onChange={(e) => handleMarkChange(idx, "practical_marks", e.target.value)}
                          disabled={row.is_absent}
                          className="w-full px-2 py-1.5 border border-zinc-200 rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500"
                        />
                        {errs.practical_marks && (
                          <span className="text-[9px] text-rose-500 font-bold mt-1 block">{errs.practical_marks}</span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold block mb-1">Internal ({row.internal_max})</label>
                        <input
                          type="number"
                          value={row.internal_marks}
                          onChange={(e) => handleMarkChange(idx, "internal_marks", e.target.value)}
                          disabled={row.is_absent}
                          className="w-full px-2 py-1.5 border border-zinc-200 rounded-lg outline-none font-semibold text-xs text-black bg-white focus:border-violet-500"
                        />
                        {errs.internal_marks && (
                          <span className="text-[9px] text-rose-500 font-bold mt-1 block">{errs.internal_marks}</span>
                        )}
                      </div>
                      <div className="flex flex-col justify-end">
                        <span className="text-[10px] text-zinc-400 font-bold block mb-1">Obtained Total</span>
                        <span className="h-[30px] flex items-center font-bold text-zinc-900">
                          {row.is_absent ? (
                            <span className="text-zinc-400 italic">Absent</span>
                          ) : (
                            `${totalObtained}/${row.total_max}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Needs academic attention on practicals"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black bg-white focus:border-violet-500 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-100">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <FaSave className="mr-1.5" /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
