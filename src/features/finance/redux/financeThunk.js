import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/finance.service";

// ================= STUDENT FEES =================

export const fetchStudentFeeDetails = createAsyncThunk(
  "finance/fetchStudentDetails",
  async (studentId, { rejectWithValue }) => {
    try {
      return await service.getStudentFeeDetails(studentId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch student fees");
    }
  }
);

export const fetchClassStudentsFees = createAsyncThunk(
  "finance/fetchClassFees",
  async (className, { rejectWithValue }) => {
    try {
      return await service.getClassStudentsFees(className);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class fees");
    }
  }
);

export const fetchPendingFeesList = createAsyncThunk(
  "finance/fetchPending",
  async (className = "", { rejectWithValue }) => {
    try {
      return await service.getPendingFeesList(className);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch pending fees");
    }
  }
);

export const collectFeePayment = createAsyncThunk(
  "finance/collectPayment",
  async ({ studentId, paymentData }, { rejectWithValue }) => {
    try {
      return await service.collectPayment(studentId, paymentData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to collect payment");
    }
  }
);

export const fetchFeesReport = createAsyncThunk(
  "finance/fetchFeesReport",
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await service.getFeesReport(filters);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch student fees report");
    }
  }
);

export const fetchTotalCollection = createAsyncThunk(
  "finance/fetchTotalCollection",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getTotalCollection();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch total collection");
    }
  }
);

// ================= TEACHER SALARIES =================

export const fetchTeacherSalaries = createAsyncThunk(
  "finance/fetchSalaries",
  async (month, { rejectWithValue }) => {
    try {
      return await service.getTeacherSalaries(month);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch teacher salaries");
    }
  }
);

export const payTeacherSalary = createAsyncThunk(
  "finance/paySalary",
  async ({ recordId, paymentData }, { rejectWithValue }) => {
    try {
      return await service.paySalary(recordId, paymentData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to process salary payment");
    }
  }
);

export const fetchSalaryHistory = createAsyncThunk(
  "finance/fetchSalaryHistory",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getSalaryHistory();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch salary history");
    }
  }
);

// ================= GENERAL FINANCE REPORTS =================

export const fetchFinanceReportSummary = createAsyncThunk(
  "finance/fetchReportSummary",
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await service.getFinanceReportSummary(filters);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch financial report summary");
    }
  }
);

export const addSchoolExpense = createAsyncThunk(
  "finance/addExpense",
  async (expenseData, { rejectWithValue }) => {
    try {
      return await service.addExpense(expenseData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add school expense");
    }
  }
);
