import { createSlice } from "@reduxjs/toolkit";
import { loginUser, getCurrentUser, impersonateStudentUser, impersonateTeacherUser } from "./moduleThunk";
import { clearAuthCookies } from "@/utils/cookieSync";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  impersonated: false,
  impersonator: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.impersonated = false;
      state.impersonator = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("role");
        clearAuthCookies();
      }
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        
        let u = action.payload.user || action.payload.data?.user || action.payload.admin || action.payload.data?.admin || action.payload;
        if (u && typeof u === "object") {
          let role = action.payload.role || u.role || "admin";
          if (role === "school_admin") role = "admin";
          u = { ...u, role };
        }
        state.user = u;
        state.isAuthenticated = true;
        state.impersonated = false;
        state.impersonator = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        
        const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
        let u = action.payload.user || action.payload.data?.user || action.payload.admin || action.payload.data?.admin || action.payload;
        if (u && typeof u === "object") {
          let role = storedRole || u.role || "admin";
          if (role === "school_admin") role = "admin";
          u = { ...u, role };
        }
        state.user = u;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          clearAuthCookies();
        }
      })
      .addCase(impersonateStudentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(impersonateStudentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        let u = action.payload.student || action.payload.user || action.payload.data?.student || action.payload.data?.user || action.payload;
        if (u && typeof u === "object") {
          u = { ...u, role: "student" };
        }
        state.user = u;
        state.isAuthenticated = true;
        state.impersonated = true;
        state.impersonator = "admin";
      })
      .addCase(impersonateStudentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(impersonateTeacherUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(impersonateTeacherUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        let u = action.payload.teacher || action.payload.user || action.payload.data?.teacher || action.payload.data?.user || action.payload;
        if (u && typeof u === "object") {
          u = { ...u, role: "teacher" };
        }
        state.user = u;
        state.isAuthenticated = true;
        state.impersonated = true;
        state.impersonator = "admin";
      })
      .addCase(impersonateTeacherUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logoutUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
