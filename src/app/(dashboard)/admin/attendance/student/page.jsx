"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import AttendanceFilters from "@/features/attendance/components/AttendanceFilters";
import AttendanceSummary from "@/features/attendance/components/AttendanceSummary";
import AttendanceTable from "@/features/attendance/components/AttendanceTable";
import {
  fetchAttendanceRecord,
  saveAttendanceRecord
} from "@/features/attendance/redux/attendanceThunk";
import { fetchStudentsByClass } from "@/features/students/redux/studentThunk";
import { resetCurrentRecord } from "@/features/attendance/redux/attendanceSlice";
import PageLoader from "@/components/common/PageLoader";
import { FaCalendarTimes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function MarkAttendancePage() {
  const dispatch = useDispatch();
  
  const getTodayDateStr = () => {
    return new Date().toISOString().split("T")[0];
  };

  // State Management
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [selectedClass, setSelectedClass] = useState("12");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedStream, setSelectedStream] = useState("Science");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Redux Selectors
  const { currentRecord, isAlreadyMarked, loading, error } = useSelector(
    (state) => state.attendance
  );
  const studentsLoading = useSelector((state) => state.students.loading);

  // Clear current session on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCurrentRecord());
    };
  }, [dispatch]);

  // Load students & attendance record when filters are fully set
  useEffect(() => {
    if (selectedClass && selectedSection) {
      // Load student list for this class
      dispatch(fetchStudentsByClass(selectedClass));
      // Load attendance record for this class, section, stream & date
      dispatch(
        fetchAttendanceRecord({
          date: selectedDate,
          className: selectedClass,
          section: selectedSection,
          stream: selectedStream
        })
      );
      setSaveSuccess(false);
    } else {
      dispatch(resetCurrentRecord());
    }
  }, [selectedDate, selectedClass, selectedSection, selectedStream, dispatch]);

  const handleSaveAttendance = async () => {
    if (!currentRecord) return;
    try {
      const action = await dispatch(saveAttendanceRecord(currentRecord));
      if (saveAttendanceRecord.fulfilled.match(action)) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
    }
  };

  const isFilterSelected = selectedClass && selectedSection;

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Attendance"
        subtitle="Manage daily student attendance rosters"
      />

      <div className="space-y-6">
        {/* Top Filter Panel */}
        <AttendanceFilters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          selectedStream={selectedStream}
          setSelectedStream={setSelectedStream}
        />

        {/* Action Panel */}
        {isFilterSelected ? (
          <>
            {loading || studentsLoading ? (
              <PageLoader />
            ) : (
              <>
                {/* 1. Statistics Summary */}
                {currentRecord && currentRecord.records && (
                  <AttendanceSummary records={currentRecord.records} />
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

                {/* 4. Student Roster Table */}
                {currentRecord && currentRecord.records && (
                  <AttendanceTable records={currentRecord.records} />
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
          </>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-100">
              <FaCalendarTimes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-700">No Class & Section Selected</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Please select a Class and Section in the filters above to load the student attendance roster.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
