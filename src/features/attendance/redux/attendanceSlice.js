import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAttendanceRecord,
  saveAttendanceRecord,
  getAttendanceReport,
  getStudentSummary
} from "./attendanceThunk";

const initialState = {
  currentRecord: null,
  isAlreadyMarked: false,
  reportData: {
    studentStats: [],
    teacherStats: [],
    summary: {
      totalStudents: 0,
      totalTeachers: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      averagePercentage: 100
    }
  },
  studentSummary: null,
  loading: false,
  error: null
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    updateStudentStatus(state, action) {
      const { studentId, status } = action.payload;
      if (state.currentRecord && state.currentRecord.records) {
        state.currentRecord.records = state.currentRecord.records.map((rec) =>
          rec.studentId === studentId ? { ...rec, status } : rec
        );
      }
    },
    markAllPresent(state) {
      if (state.currentRecord && state.currentRecord.records) {
        state.currentRecord.records = state.currentRecord.records.map((rec) => ({
          ...rec,
          status: "Present"
        }));
      }
    },
    markAllAbsent(state) {
      if (state.currentRecord && state.currentRecord.records) {
        state.currentRecord.records = state.currentRecord.records.map((rec) => ({
          ...rec,
          status: "Absent"
        }));
      }
    },
    resetCurrentRecord(state) {
      state.currentRecord = null;
      state.isAlreadyMarked = false;
    },
    resetReportData(state) {
      state.reportData = initialState.reportData;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Attendance Record
      .addCase(fetchAttendanceRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecord = action.payload.data;
        state.isAlreadyMarked = action.payload.isAlreadyMarked;
      })
      .addCase(fetchAttendanceRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Attendance Record
      .addCase(saveAttendanceRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveAttendanceRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecord = action.payload.data;
        state.isAlreadyMarked = true;
      })
      .addCase(saveAttendanceRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Attendance Report
      .addCase(getAttendanceReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload.data;
      })
      .addCase(getAttendanceReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Student Profile Summary
      .addCase(getStudentSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStudentSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.studentSummary = action.payload.data;
      })
      .addCase(getStudentSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  updateStudentStatus,
  markAllPresent,
  markAllAbsent,
  resetCurrentRecord,
  resetReportData
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
