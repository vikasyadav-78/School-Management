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

// ================= GENERAL FINANCE REPORTS (UPDATED) =================

export const fetchFinanceReportSummary = createAsyncThunk(
  "finance/fetchReportSummary",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await service.getFinanceReportSummary(filters);

      // Extract response arrays and stats safely
      const stats = response?.stats || response?.data?.stats || {};
      const payments = response?.payments || response?.data?.payments || [];

      // 1. Map API Payments to UI Transactions Table Structure
      const transformedTransactions = payments.map((p) => ({
        id: p.id,
        receiptNo: p.receipt_no || "N/A",
        description: `${p.student_name || "Guest / Unnamed"} - ${p.fee_name || "Fee"}`,
        category: p.fee_name || "General Fee",
        type: p.status === "paid" ? "Income" : "Outgoing",
        method: p.payment_method ? p.payment_method.toUpperCase() : "N/A",
        amount: p.paid_amount || p.amount || 0,
        dueAmount: p.due_amount || 0,
        date: p.paid_at 
          ? new Date(p.paid_at).toLocaleDateString() 
          : (p.due_date_label || "N/A"),
        status: p.status || "pending",
        studentName: p.student_name,
        rollNo: p.roll_no,
        className: p.class,
        section: p.section
      }));

      // 2. Build Category Breakdown dynamically
      const expenseBreakdown = payments.reduce((acc, p) => {
        const categoryName = p.fee_name || "Other Fees";
        acc[categoryName] = (acc[categoryName] || 0) + (p.paid_amount || 0);
        return acc;
      }, {});

      // 3. Return mapped object structure matching UI expectations
      return {
        summary: {
          totalCollection: stats.total_collected || stats.paid || 0,
          totalAssigned: stats.total_assigned || stats.assigned || 0,
          totalExpenses: stats.total_late_fee || 0,
          netBalance: stats.total_collected || 0,
          totalDue: stats.total_due || stats.due || 0,
          pendingCount: stats.pending_count || 0
        },
        expenseBreakdown,
        transactions: transformedTransactions
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch financial report summary");
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