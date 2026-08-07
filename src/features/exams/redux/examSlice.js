import { createSlice } from "@reduxjs/toolkit";
import {
  fetchExamsList,
  fetchExamsMeta,
  fetchExamById,
  createNewExam,
  fetchExamSchedule,
  addScheduleItem,
  addSchedulesBulk,
  removeScheduleItem,
  removeSchedulesBulk,
  fetchExamAdmitCards,
  fetchExamResults,
  togglePublishExam,
  removeExam,
  fetchExamReportOverview,
  fetchExamReportClassWise,
  fetchExamReportSubjectWise,
  fetchExamReportToppers,
  fetchExamReportMeritList,
  fetchExamReportFailList
} from "./examThunk";

const initialState = {
  list: [],
  meta: {
    academic_years: [],
    exam_types: [],
    classes: []
  },
  selectedItem: null,
  schedules: [],
  admitCards: {
    students: [],
    schedules: []
  },
  results: {
    rankings: []
  },
  reports: {
    overview: null,
    classWise: [],
    subjectWise: [],
    toppers: [],
    meritList: [],
    failList: []
  },
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0 },
  filters: {}
};

const examSlice = createSlice({
  name: "exams",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = action.payload;
    },
    clearSelected(state) {
      state.selectedItem = null;
      state.schedules = [];
      state.admitCards = { students: [], schedules: [] };
      state.results = { rankings: [] };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchExamsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamsList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.exams || action.payload.data || [];
        state.pagination.total = action.payload.count || action.payload.total || state.list.length;
      })
      .addCase(fetchExamsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Meta
      .addCase(fetchExamsMeta.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamsMeta.fulfilled, (state, action) => {
        state.loading = false;
        state.meta = {
          academic_years: action.payload.academic_years || [],
          exam_types: action.payload.exam_types || [],
          classes: action.payload.classes || []
        };
      })
      .addCase(fetchExamsMeta.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By Id
      .addCase(fetchExamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload.exam || action.payload.data || null;
        state.schedules = action.payload.exam?.schedules || action.payload.schedules || [];
      })
      .addCase(fetchExamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Exam
      .addCase(createNewExam.pending, (state) => {
        state.loading = true;
      })
      .addCase(createNewExam.fulfilled, (state, action) => {
        state.loading = false;
        const newExam = action.payload.exam || action.payload.data;
        if (newExam) {
          state.list = [newExam, ...state.list];
        }
      })
      .addCase(createNewExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Schedule
      .addCase(fetchExamSchedule.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload.schedules || [];
      })
      .addCase(fetchExamSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Schedule Item
      .addCase(addScheduleItem.fulfilled, (state, action) => {
        const newSchedule = action.payload.schedule || action.payload.data;
        if (newSchedule) {
          state.schedules = [...state.schedules, newSchedule];
        }
      })

      // Add Schedules Bulk
      .addCase(addSchedulesBulk.fulfilled, (state, action) => {
        const newSchedules = action.payload.schedules || action.payload.data || [];
        state.schedules = [...state.schedules, ...newSchedules];
      })

      // Remove Schedule Item
      .addCase(removeScheduleItem.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter(item => item.id !== action.payload.scheduleId);
      })

      // Remove Schedules Bulk
      .addCase(removeSchedulesBulk.fulfilled, (state, action) => {
        // Bulk delete responses might contain list of deleted schedule ids or we can just reload the schedules
        // To be safe, we let the component handle refresh, but here we can just clear matching schedule ids if provided
      })

      // Fetch Admit Cards
      .addCase(fetchExamAdmitCards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamAdmitCards.fulfilled, (state, action) => {
        state.loading = false;
        state.admitCards = {
          students: action.payload.students || [],
          schedules: action.payload.schedules || []
        };
      })
      .addCase(fetchExamAdmitCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Results
      .addCase(fetchExamResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExamResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = {
          rankings: action.payload.rankings || []
        };
      })
      .addCase(fetchExamResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Publish
      .addCase(togglePublishExam.fulfilled, (state, action) => {
        const updated = action.payload.exam || action.payload.data;
        if (updated) {
          state.list = state.list.map(item => item.id === updated.id ? updated : item);
          if (state.selectedItem && state.selectedItem.id === updated.id) {
            state.selectedItem = updated;
          }
        }
      })

      // Remove Exam
      .addCase(removeExam.fulfilled, (state, action) => {
        state.list = state.list.filter(item => item.id !== action.payload.id);
        if (state.selectedItem && state.selectedItem.id === action.payload.id) {
          state.selectedItem = null;
        }
      })

      // Fetch Report Overview
      .addCase(fetchExamReportOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.overview = action.payload.overview || null;
      })
      .addCase(fetchExamReportOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Report Class Wise
      .addCase(fetchExamReportClassWise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportClassWise.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.classWise = action.payload.report || action.payload.data || [];
      })
      .addCase(fetchExamReportClassWise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Report Subject Wise
      .addCase(fetchExamReportSubjectWise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportSubjectWise.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.subjectWise = action.payload.report || action.payload.data || [];
      })
      .addCase(fetchExamReportSubjectWise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Report Toppers
      .addCase(fetchExamReportToppers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportToppers.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.toppers = action.payload.toppers || action.payload.data || [];
      })
      .addCase(fetchExamReportToppers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Report Merit List
      .addCase(fetchExamReportMeritList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportMeritList.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.meritList = action.payload.students || action.payload.data || [];
      })
      .addCase(fetchExamReportMeritList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Report Fail List
      .addCase(fetchExamReportFailList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamReportFailList.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.failList = action.payload.students || action.payload.data || [];
      })
      .addCase(fetchExamReportFailList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearSelected } = examSlice.actions;
export default examSlice.reducer;
