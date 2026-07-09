import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/module.service";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await service.login(credentials);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", credentials.role);
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

// export const getCurrentUser = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
//   try {
//     const role = localStorage.getItem("role");
//     return await service.getMe(role);
//   } catch (error) {
//     return rejectWithValue(error.message || "Failed to load session");
//   }
// }
// );


export const getCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const role = localStorage.getItem("role");

      console.log("ROLE FROM LOCALSTORAGE =", role);

      return await service.getMe(role);
    } catch (error) {
      console.log(error);

      return rejectWithValue(error.message || "Failed to load session");
    }
  }
);