import { createSlice } from "@reduxjs/toolkit";
import {
  fetchStudentsList,
  fetchStudentsById,
  addStudentsItem,
  updateStudentsItem,
  deleteStudentsItem,
  fetchStudentsByClass,
  fetchStudentProfile,
  fetchStudentAttendance,
  fetchStudentLeaves,
  applyStudentLeave,
  fetchStudentTimetable,
  fetchStudentFees,
  changeStudentPassword,
  fetchStudentHolidays,
  fetchStudentHolidayDetail,
  fetchStudentHomework,
  fetchStudentHomeworkDetail,
  submitStudentHomework,
  fetchStudentClassNotesSubjects,
  fetchStudentClassNotes,
  fetchStudentClassNotesDetail,
  fetchStudentExamSchedule,
  fetchStudentResults,
  fetchStudentReportCards,
  fetchStudentReportCardDetail,
  fetchStudentAdmitCards,
  fetchStudentAdmitCardDetail
} from "./studentThunk";

const initialState = {
  list: [],
  classSummaries: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, limit: 10, total: 0 },
  profile: null,
  attendance: null,
  leaves: null,
  timetable: null,
  fees: null,
  holidays: null,
  holidayDetail: null,
  loadingHolidayDetail: false,
  homework: null,
  homeworkDetail: null,
  loadingHomeworkDetail: false,
  submittingHomework: false,
  classNotesSubjects: null,
  classNotes: null,
  classNotesDetail: null,
  loadingClassNotesDetail: false,
  examSchedule: null,
  examResults: null,
  reportCards: null,
  reportCardDetail: null,
  loadingReportCardDetail: false,
  admitCards: null,
  admitCardDetail: null,
  loadingAdmitCardDetail: false
};

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = action.payload;
    },
    clearSelected(state) {
      state.selectedItem = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch List (Returns Class Summaries for class dashboard)
      .addCase(fetchStudentsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsList.fulfilled, (state, action) => {
        state.loading = false;
        state.classSummaries = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchStudentsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch By Class (Loads students inside the selected class details page)
      .addCase(fetchStudentsByClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsByClass.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
      })
      .addCase(fetchStudentsByClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch By Id
      .addCase(fetchStudentsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload.data;
      })
      .addCase(fetchStudentsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item
      .addCase(addStudentsItem.fulfilled, (state, action) => {
        state.list = [action.payload.data, ...state.list];
      })
      // Update Item
      .addCase(updateStudentsItem.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.list = state.list.map((item) => (item.id === updated.id ? updated : item));
        if (state.selectedItem && state.selectedItem.id === updated.id) {
          state.selectedItem = updated;
        }
      })
      // Delete Item
      .addCase(deleteStudentsItem.fulfilled, (state, action) => {
        const deleted = action.payload.data;
        state.list = state.list.filter((item) => item.id !== deleted.id);
      })
      // Student profile cases
      .addCase(fetchStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.user || action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student attendance cases
      .addCase(fetchStudentAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(fetchStudentAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student leaves cases
      .addCase(fetchStudentLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchStudentLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student apply leave cases
      .addCase(applyStudentLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyStudentLeave.fulfilled, (state, action) => {
        state.loading = false;
        if (state.leaves) {
          const newLeave = action.payload.leave || action.payload;
          const records = [newLeave, ...(state.leaves.leaves || [])];
          state.leaves = {
            ...state.leaves,
            leaves: records,
            summary: {
              total: records.length,
              pending: records.filter(r => r.status?.toLowerCase() === "pending").length,
              approved: records.filter(r => r.status?.toLowerCase() === "approved").length,
              rejected: records.filter(r => r.status?.toLowerCase() === "rejected").length
            }
          };
        }
      })
      .addCase(applyStudentLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student timetable cases
      .addCase(fetchStudentTimetable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.timetable = action.payload;
      })
      .addCase(fetchStudentTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student fees cases
      .addCase(fetchStudentFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.loading = false;
        state.fees = action.payload;
      })
      .addCase(fetchStudentFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student change password cases
      .addCase(changeStudentPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeStudentPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeStudentPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student holidays cases
      .addCase(fetchStudentHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload;
      })
      .addCase(fetchStudentHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student holiday detail cases
      .addCase(fetchStudentHolidayDetail.pending, (state) => {
        state.loadingHolidayDetail = true;
        state.error = null;
      })
      .addCase(fetchStudentHolidayDetail.fulfilled, (state, action) => {
        state.loadingHolidayDetail = false;
        state.holidayDetail = action.payload;
      })
      .addCase(fetchStudentHolidayDetail.rejected, (state, action) => {
        state.loadingHolidayDetail = false;
        state.error = action.payload;
      })
      // Student homework list cases
      .addCase(fetchStudentHomework.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentHomework.fulfilled, (state, action) => {
        state.loading = false;
        state.homework = action.payload;
      })
      .addCase(fetchStudentHomework.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student homework detail cases
      .addCase(fetchStudentHomeworkDetail.pending, (state) => {
        state.loadingHomeworkDetail = true;
        state.error = null;
      })
      .addCase(fetchStudentHomeworkDetail.fulfilled, (state, action) => {
        state.loadingHomeworkDetail = false;
        state.homeworkDetail = action.payload;
      })
      .addCase(fetchStudentHomeworkDetail.rejected, (state, action) => {
        state.loadingHomeworkDetail = false;
        state.error = action.payload;
      })
      // Student submit homework cases
      .addCase(submitStudentHomework.pending, (state) => {
        state.submittingHomework = true;
        state.error = null;
      })
      .addCase(submitStudentHomework.fulfilled, (state) => {
        state.submittingHomework = false;
      })
      .addCase(submitStudentHomework.rejected, (state, action) => {
        state.submittingHomework = false;
        state.error = action.payload;
      })
      // Student class notes subjects cases
      .addCase(fetchStudentClassNotesSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentClassNotesSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.classNotesSubjects = action.payload;
      })
      .addCase(fetchStudentClassNotesSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student class notes list cases
      .addCase(fetchStudentClassNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentClassNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.classNotes = action.payload;
      })
      .addCase(fetchStudentClassNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Student class notes detail cases
      .addCase(fetchStudentClassNotesDetail.pending, (state) => {
        state.loadingClassNotesDetail = true;
        state.error = null;
      })
      .addCase(fetchStudentClassNotesDetail.fulfilled, (state, action) => {
        state.loadingClassNotesDetail = false;
        state.classNotesDetail = action.payload;
      })
      .addCase(fetchStudentClassNotesDetail.rejected, (state, action) => {
        state.loadingClassNotesDetail = false;
        state.error = action.payload;
      })
      // Exam Schedule
      .addCase(fetchStudentExamSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentExamSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.examSchedule = action.payload;
      })
      .addCase(fetchStudentExamSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Results
      .addCase(fetchStudentResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentResults.fulfilled, (state, action) => {
        state.loading = false;
        state.examResults = action.payload;
      })
      .addCase(fetchStudentResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report Cards
      .addCase(fetchStudentReportCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentReportCards.fulfilled, (state, action) => {
        state.loading = false;
        state.reportCards = action.payload;
      })
      .addCase(fetchStudentReportCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Report Card Detail
      .addCase(fetchStudentReportCardDetail.pending, (state) => {
        state.loadingReportCardDetail = true;
        state.error = null;
      })
      .addCase(fetchStudentReportCardDetail.fulfilled, (state, action) => {
        state.loadingReportCardDetail = false;
        state.reportCardDetail = action.payload;
      })
      .addCase(fetchStudentReportCardDetail.rejected, (state, action) => {
        state.loadingReportCardDetail = false;
        state.error = action.payload;
      })
      // Admit Cards
      .addCase(fetchStudentAdmitCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAdmitCards.fulfilled, (state, action) => {
        state.loading = false;
        state.admitCards = action.payload;
      })
      .addCase(fetchStudentAdmitCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admit Card Detail
      .addCase(fetchStudentAdmitCardDetail.pending, (state) => {
        state.loadingAdmitCardDetail = true;
        state.error = null;
      })
      .addCase(fetchStudentAdmitCardDetail.fulfilled, (state, action) => {
        state.loadingAdmitCardDetail = false;
        state.admitCardDetail = action.payload;
      })
      .addCase(fetchStudentAdmitCardDetail.rejected, (state, action) => {
        state.loadingAdmitCardDetail = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearSelected } = studentsSlice.actions;
export default studentsSlice.reducer;

export const selectTotalStudents = (state) => {
  const summaries = state.students?.classSummaries || [];
  return summaries.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
};

export const selectNewStudents = (state) => {
  const summaries = state.students?.classSummaries || [];
  return summaries.reduce((acc, c) => acc + (c.newStudents || 0), 0);
};
