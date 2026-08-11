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
  fetchStudentAdmitCardDetail,
  fetchStudentsMeta,
  toggleStudentStatus,
  assignStudentId,
  fetchStudentIdCard
} from "./studentThunk";

const initialState = {
  list: [],
  classSummaries: [],
  meta: null,
  loadingMeta: false,
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
  loadingAdmitCardDetail: false,
  idCardData: null,
  loadingIdCard: false
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
        state.list = action.payload.students || action.payload.data || action.payload || [];
        state.pagination.total = action.payload.count || action.payload.meta?.total || action.payload.total || 0;
      })
      .addCase(fetchStudentsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch By Class
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
        state.selectedItem = action.payload.student || action.payload.data || action.payload;
      })
      .addCase(fetchStudentsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item
      .addCase(addStudentsItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStudentsItem.fulfilled, (state, action) => {
        state.loading = false;
        const newStudent = action.payload.student || action.payload.data || action.payload;
        if (newStudent) {
          state.list = [newStudent, ...state.list];
        }
      })
      .addCase(addStudentsItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Item
      .addCase(updateStudentsItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentsItem.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.student || action.payload.data || action.payload;
        if (updated) {
          state.list = state.list.map((item) => (item.id === updated.id ? updated : item));
          if (state.selectedItem && state.selectedItem.id === updated.id) {
            state.selectedItem = updated;
          }
        }
      })
      .addCase(updateStudentsItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Item
      .addCase(deleteStudentsItem.fulfilled, (state, action) => {
        // Backend API might return the deleted item or just {success: true}
        // Let's assume action.meta.arg contains the id
        const deletedId = action.meta.arg;
        state.list = state.list.filter((item) => item.id !== deletedId);
      })
      // Meta
      .addCase(fetchStudentsMeta.pending, (state) => {
        state.loadingMeta = true;
      })
      .addCase(fetchStudentsMeta.fulfilled, (state, action) => {
        state.loadingMeta = false;
        
        const { meta, classes, students } = action.payload;
        const metaData = meta?.data || meta || {};
        state.meta = metaData;

        const classesList = classes?.classes || classes?.data?.classes || [];
        const studentsList = students?.students || students?.data?.students || [];

        // Save student list in state
        state.list = studentsList;

        // Populate classSummaries for the admin/students page
        const getCreationDateFromId = (id) => {
          if (!id || typeof id !== "string") return null;
          const cleanId = id.replace(/-/g, "");
          if (cleanId.length < 12) return null;
          const hexTimestamp = cleanId.substring(0, 12);
          const ms = parseInt(hexTimestamp, 16);
          if (isNaN(ms) || ms < 1000000000000) return null;
          return new Date(ms);
        };

        const getStudentDate = (s) => {
          if (s.admission_date) return new Date(s.admission_date);
          return getCreationDateFromId(s.id);
        };

        const classSummaries = (metaData.classes || []).map(c => {
          // Find statistics from classes endpoint
          const classStats = classesList.find(cls => cls.id === c.id);
          
          // Calculate new/existing students from list
          const classStudents = studentsList.filter(s => s.school_class_id === c.id);
          
          // Default to August 2026 for initial load
          const newStudentsCount = classStudents.filter(s => {
            const date = getStudentDate(s);
            return date && date.getMonth() === 7 && date.getFullYear() === 2026;
          }).length;

          const totalCount = classStats ? classStats.students_count : classStudents.length;

          return {
            id: c.id,
            className: c.name.replace(/class\s*-?/i, '').trim() || c.name,
            originalName: c.name,
            sections: c.sections.map(s => s.name),
            sectionsData: c.sections,
            totalSections: c.sections.length || 0,
            isStreamBased: false,
            streams: [],
            totalStudents: totalCount,
            newStudents: newStudentsCount,
            existingStudents: Math.max(0, totalCount - newStudentsCount),
            classTeachers: classStats?.class_teacher || "Unassigned"
          };
        });
        state.classSummaries = classSummaries;
      })
      .addCase(fetchStudentsMeta.rejected, (state) => {
        state.loadingMeta = false;
      })
      // Toggle Status
      .addCase(toggleStudentStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          state.list = state.list.map((item) => (item.id === updated.id ? updated : item));
          if (state.selectedItem && state.selectedItem.id === updated.id) {
            state.selectedItem = updated;
          }
        }
      })
      // Assign ID
      .addCase(assignStudentId.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          state.list = state.list.map((item) => (item.id === updated.id ? updated : item));
          if (state.selectedItem && state.selectedItem.id === updated.id) {
            state.selectedItem = updated;
          }
        }
      })
      // Fetch ID Card
      .addCase(fetchStudentIdCard.pending, (state) => {
        state.loadingIdCard = true;
      })
      .addCase(fetchStudentIdCard.fulfilled, (state, action) => {
        state.loadingIdCard = false;
        state.idCardData = action.payload.data || action.payload;
      })
      .addCase(fetchStudentIdCard.rejected, (state) => {
        state.loadingIdCard = false;
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
