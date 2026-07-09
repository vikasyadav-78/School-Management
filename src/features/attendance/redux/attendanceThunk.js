import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/attendance.service";

export const fetchAttendanceRecord = createAsyncThunk(
  "attendance/fetchRecord",
  async ({ date, className, section, targetType, stream }, { rejectWithValue }) => {
    try {
      return await service.getRecord(date, className, section, targetType, stream);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch record");
    }
  }
);

export const saveAttendanceRecord = createAsyncThunk(
  "attendance/saveRecord",
  async (recordData, { rejectWithValue }) => {
    try {
      return await service.saveRecord(recordData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save record");
    }
  }
);

export const getAttendanceReport = createAsyncThunk(
  "attendance/getReport",
  async ({ className, section, startDate, endDate, studentName, targetType, stream }, { rejectWithValue }) => {
    try {
      return await service.getReport(className, section, startDate, endDate, studentName, targetType, stream);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch report");
    }
  }
);

export const getStudentSummary = createAsyncThunk(
  "attendance/getStudentSummary",
  async (studentId, { rejectWithValue }) => {
    try {
      return await service.getStudentSummary(studentId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch student summary");
    }
  }
);
