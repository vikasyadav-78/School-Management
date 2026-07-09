import { createSlice } from "@reduxjs/toolkit";
import {
  fetchStudentFeeDetails,
  fetchClassStudentsFees,
  fetchPendingFeesList,
  collectFeePayment,
  fetchFeesReport,
  fetchTotalCollection,
  fetchTeacherSalaries,
  payTeacherSalary,
  fetchSalaryHistory,
  fetchFinanceReportSummary,
  addSchoolExpense
} from "./financeThunk";

const initialState = {
  // Student Fees
  studentFeeDetails: null,
  classFees: [],
  pendingFees: [],
  feesReport: {
    records: [],
    payments: [],
    summary: {
      totalCollection: 0,
      totalPending: 0,
      totalPaid: 0,
      studentsPaid: 0,
      studentsPending: 0
    }
  },
  totalCollection: 0,
  currentReceipt: null,

  // Teacher Salaries
  salariesList: [],
  salaryHistory: [],

  // General Finance Reports
  reportSummary: {
    summary: {
      totalCollection: 0,
      totalSalaries: 0,
      totalExpenses: 0,
      netBalance: 0
    },
    expensesList: [],
    expenseBreakdown: {},
    transactions: []
  },

  loading: false,
  error: null
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearCurrentReceipt(state) {
      state.currentReceipt = null;
    },
    resetFeeDetails(state) {
      state.studentFeeDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ================= STUDENT FEES =================
      .addCase(fetchStudentFeeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentFeeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.studentFeeDetails = action.payload.data;
      })
      .addCase(fetchStudentFeeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchClassStudentsFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassStudentsFees.fulfilled, (state, action) => {
        state.loading = false;
        state.classFees = action.payload.data;
      })
      .addCase(fetchClassStudentsFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPendingFeesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingFeesList.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingFees = action.payload.data;
      })
      .addCase(fetchPendingFeesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(collectFeePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(collectFeePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.studentFeeDetails = action.payload.data;
        state.currentReceipt = action.payload.receipt;
        // Increment collections live in state
        state.totalCollection += action.payload.receipt.amount;
        state.reportSummary.summary.totalCollection += action.payload.receipt.amount;
        state.reportSummary.summary.netBalance += action.payload.receipt.amount;
      })
      .addCase(collectFeePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFeesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.feesReport = action.payload.data;
      })
      .addCase(fetchFeesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchTotalCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.totalCollection = action.payload.data;
      })
      .addCase(fetchTotalCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= TEACHER SALARIES =================
      .addCase(fetchTeacherSalaries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherSalaries.fulfilled, (state, action) => {
        state.loading = false;
        state.salariesList = action.payload.data;
      })
      .addCase(fetchTeacherSalaries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(payTeacherSalary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(payTeacherSalary.fulfilled, (state, action) => {
        state.loading = false;
        const paidRecord = action.payload.data;
        // Update salaries list entry status
        const idx = state.salariesList.findIndex((s) => s.id === paidRecord.id);
        if (idx !== -1) {
          state.salariesList[idx] = paidRecord;
        }
        // Update general finance state live
        state.reportSummary.summary.totalSalaries += paidRecord.finalSalary;
        state.reportSummary.summary.totalExpenses += paidRecord.finalSalary;
        state.reportSummary.summary.netBalance -= paidRecord.finalSalary;
      })
      .addCase(payTeacherSalary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSalaryHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalaryHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.salaryHistory = action.payload.data;
      })
      .addCase(fetchSalaryHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= GENERAL FINANCE REPORTS =================
      .addCase(fetchFinanceReportSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinanceReportSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.reportSummary = action.payload.data;
      })
      .addCase(fetchFinanceReportSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addSchoolExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSchoolExpense.fulfilled, (state) => {
        state.loading = false;
        // Report state can be refetched by components
      })
      .addCase(addSchoolExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentReceipt, resetFeeDetails } = financeSlice.actions;

// Selectors
export const selectTotalCollection = (state) => state.finance.totalCollection;
export const selectReportSummary = (state) => state.finance.reportSummary;
export const selectSalariesList = (state) => state.finance.salariesList;
export const selectSalaryHistory = (state) => state.finance.salaryHistory;

export default financeSlice.reducer;
