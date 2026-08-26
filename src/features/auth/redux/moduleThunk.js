import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/module.service";
import { syncAuthCookies, clearAuthCookies } from "@/utils/cookieSync";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await service.login(credentials);
      const token = data.token || data.data?.token;
      let role = data.login_type || data.data?.login_type || credentials.role;
      if (role === "school_admin") role = "admin";
      
      if (typeof window !== "undefined") {
        if (token) localStorage.setItem("token", token);
        if (role) localStorage.setItem("role", role);
        syncAuthCookies(token, role);
      }
      return { ...data, token, role };
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const role = localStorage.getItem("role");
      console.log("ROLE FROM LOCALSTORAGE =", role);
      const data = await service.getMe(role);
      return data;
    } catch (error) {
      console.log(error);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        clearAuthCookies();
      }
      return rejectWithValue(error.message || "Failed to load session");
    }
  }
);

export const impersonateStudentUser = createAsyncThunk(
  "auth/impersonate",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await service.impersonateStudent(studentId);
      const token = data.token || data.data?.token;
      
      if (typeof window !== "undefined") {
        const currentToken = localStorage.getItem("token");
        if (currentToken) localStorage.setItem("admin_token", currentToken);
        if (token) localStorage.setItem("token", token);
        localStorage.setItem("role", "student");
        syncAuthCookies(token, "student", currentToken);
      }
      
      return { ...data, token, role: "student" };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to impersonate student");
    }
  }
);

export const impersonateTeacherUser = createAsyncThunk(
  "auth/impersonateTeacher",
  async (teacherId, { rejectWithValue }) => {
    try {
      const data = await service.impersonateTeacher(teacherId);
      const token = data.token || data.data?.token;
      
      if (typeof window !== "undefined") {
        const currentToken = localStorage.getItem("token");
        if (currentToken) localStorage.setItem("admin_token", currentToken);
        if (token) localStorage.setItem("token", token);
        localStorage.setItem("role", "teacher");
        syncAuthCookies(token, "teacher", currentToken);
      }
      
      return { ...data, token, role: "teacher" };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to impersonate teacher");
    }
  }
);