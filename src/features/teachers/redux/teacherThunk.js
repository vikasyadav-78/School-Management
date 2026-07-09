import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/teacher.service";

export const fetchTeachersList = createAsyncThunk(
  "teachers/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      return await service.getList(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch list");
    }
  }
);

export const fetchTeachersById = createAsyncThunk(
  "teachers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getById(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch item");
    }
  }
);

export const addTeachersItem = createAsyncThunk(
  "teachers/addItem",
  async (data, { rejectWithValue }) => {
    try {
      return await service.createItem(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add item");
    }
  }
);

export const updateTeachersItem = createAsyncThunk(
  "teachers/updateItem",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await service.updateItem(id, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update item");
    }
  }
);

export const deleteTeachersItem = createAsyncThunk(
  "teachers/deleteItem",
  async (id, { rejectWithValue }) => {
    try {
      return await service.deleteItem(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete item");
    }
  }
);

export const fetchTeacherProfile = createAsyncThunk(
  "teachers/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getProfile();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch teacher profile");
    }
  }
);

export const fetchTeacherAttendanceClasses = createAsyncThunk(
  "teachers/fetchAttendanceClasses",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getAttendanceClasses();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch attendance classes");
    }
  }
);

export const fetchTeacherMyAttendance = createAsyncThunk(
  "teachers/fetchMyAttendance",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getMyAttendance();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch my attendance");
    }
  }
);

import { 
  getTeacherLeavesList, 
  createTeacherLeave 
} from "@/services/leave.service";

export const fetchTeacherLeaves = createAsyncThunk(
  "teachers/fetchLeaves",
  async (_, { rejectWithValue }) => {
    try {
      return await getTeacherLeavesList();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch leaves");
    }
  }
);

export const applyTeacherLeave = createAsyncThunk(
  "teachers/applyLeave",
  async (leaveData, { rejectWithValue }) => {
    try {
      return await createTeacherLeave(leaveData);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to submit leave request");
    }
  }
);

export const changeTeacherPassword = createAsyncThunk(
  "teachers/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await service.changeTeacherPassword(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to change password");
    }
  }
);
