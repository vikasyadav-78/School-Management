"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import AttendanceSummary from "@/features/attendance/components/AttendanceSummary";
import TeacherAttendanceTable from "@/features/attendance/components/TeacherAttendanceTable";
import {
  fetchAttendanceRecord,
  saveAttendanceRecord
} from "@/features/attendance/redux/attendanceThunk";
import { fetchTeachersList } from "@/features/teachers/redux/teacherThunk";
import { resetCurrentRecord } from "@/features/attendance/redux/attendanceSlice";
import PageLoader from "@/components/common/PageLoader";
import { FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";

export default function TeacherAttendancePage() {
  const dispatch = useDispatch();

  const getTodayDateStr = () => {
    return new Date().toISOString().split("T")[0];
  };

  // State Management
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Redux Selectors
  const { currentRecord, isAlreadyMarked, loading: attendanceLoading, error } = useSelector(
    (state) => state.attendance
  );
  const teachersLoading = useSelector((state) => state.teachers.loading);
  const loading = attendanceLoading || teachersLoading;

  // Clear current session on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCurrentRecord());
    };
  }, [dispatch]);

  // Load teachers list on mount
  useEffect(() => {
    dispatch(fetchTeachersList());
  }, [dispatch]);

  // Load attendance record when date is updated
  useEffect(() => {
    dispatch(
      fetchAttendanceRecord({
        date: selectedDate,
        className: "",
        section: "",
        targetType: "teacher"
      })
    );
    setSaveSuccess(false);
  }, [selectedDate, dispatch]);

  const handleSaveAttendance = async () => {
    if (!currentRecord) return;
    try {
      const action = await dispatch(saveAttendanceRecord(currentRecord));
      if (saveAttendanceRecord.fulfilled.match(action)) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save teacher attendance:", err);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Teacher Attendance"
        subtitle="Manage daily faculty and staff attendance logs"
      />

      <div className="space-y-6">
        {/* Date Filter Panel */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full max-w-sm">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
            />
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <Link href="/admin/attendance">
              <Button variant="outline" className="text-xs py-2.5 px-4">
                <FaArrowLeft className="mr-1.5" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            {/* 1. Statistics Summary */}
            {currentRecord && currentRecord.records && (
              <AttendanceSummary records={currentRecord.records} totalLabel="Total Teachers" />
            )}

            {/* 2. Success Alert */}
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 text-xs font-semibold shadow-sm animate-fade-in">
                <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Attendance saved successfully. Database record updated.</span>
              </div>
            )}

            {/* 3. Duplicate Prevention Alert banner */}
            {isAlreadyMarked && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 text-xs font-semibold shadow-sm">
                <FaExclamationTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Attendance already marked for this date. You can update the record below.</span>
              </div>
            )}

            {/* 4. Teacher Roster Table */}
            {currentRecord && currentRecord.records && (
              <TeacherAttendanceTable records={currentRecord.records} />
            )}

            {/* 5. Bottom Save/Update Button */}
            {currentRecord && currentRecord.records && currentRecord.records.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveAttendance}
                  className={`px-8 py-3 rounded-xl font-bold text-xs shadow-md ${
                    isAlreadyMarked
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10"
                      : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/10"
                  }`}
                >
                  {isAlreadyMarked ? "Update Attendance" : "Save Attendance"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
