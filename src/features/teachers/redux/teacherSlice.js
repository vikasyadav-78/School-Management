import { createSlice } from "@reduxjs/toolkit";
import {
  fetchTeachersList,
  fetchTeachersById,
  addTeachersItem,
  updateTeachersItem,
  deleteTeachersItem,
  fetchTeacherProfile,
  fetchTeacherAttendanceClasses,
  fetchTeacherMyAttendance,
  fetchTeacherLeaves,
  applyTeacherLeave,
  changeTeacherPassword
} from "./teacherThunk";

const initialState = {
  list: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, limit: 10, total: 0 },
  profile: null,
  classes: [],
  myAttendance: null,
  leaves: null
};

const teachersSlice = createSlice({
  name: "teachers",
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
      // Fetch List
      .addCase(fetchTeachersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachersList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchTeachersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch By Id
      .addCase(fetchTeachersById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachersById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload.data;
      })
      .addCase(fetchTeachersById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item
      .addCase(addTeachersItem.fulfilled, (state, action) => {
        state.list = [action.payload.data, ...state.list];
      })
      // Update Item
      .addCase(updateTeachersItem.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.list = state.list.map((item) => (item.id === updated.id ? updated : item));
        if (state.selectedItem && state.selectedItem.id === updated.id) {
          state.selectedItem = updated;
        }
      })
      // Delete Item
      .addCase(deleteTeachersItem.fulfilled, (state, action) => {
        const deleted = action.payload.data;
        state.list = state.list.filter((item) => item.id !== deleted.id);
        if (state.selectedItem && state.selectedItem.id === deleted.id) {
          state.selectedItem = null;
        }
      })
      // Fetch Teacher Profile
      .addCase(fetchTeacherProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.user;
      })
      .addCase(fetchTeacherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Teacher Attendance Classes
      .addCase(fetchTeacherAttendanceClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendanceClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload.classes || [];
      })
      .addCase(fetchTeacherAttendanceClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Teacher My Attendance
      .addCase(fetchTeacherMyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.myAttendance = action.payload;
      })
      .addCase(fetchTeacherMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Teacher leaves cases
      .addCase(fetchTeacherLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchTeacherLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Teacher apply leave cases
      .addCase(applyTeacherLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyTeacherLeave.fulfilled, (state, action) => {
        state.loading = false;
        if (state.leaves) {
          const records = [action.payload, ...(state.leaves.records || [])];
          state.leaves = {
            records,
            stats: {
              total: records.length,
              pending: records.filter(r => r.status?.toLowerCase() === "pending").length,
              approved: records.filter(r => r.status?.toLowerCase() === "approved").length,
              rejected: records.filter(r => r.status?.toLowerCase() === "rejected").length
            }
          };
        }
      })
      .addCase(applyTeacherLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Teacher change password cases
      .addCase(changeTeacherPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeTeacherPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeTeacherPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearSelected } = teachersSlice.actions;
export default teachersSlice.reducer;

export const selectTotalTeachers = (state) => state.teachers?.list?.length || 0;
