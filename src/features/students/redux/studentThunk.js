import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "../services/module.service";

export const fetchStudentsList = createAsyncThunk(
  "students/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await service.getList(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch list");
    }
  }
);

export const fetchStudentsById = createAsyncThunk(
  "students/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      console.log("fetchStudentsById: id =", id);
      const res = await service.getById(id);
      console.log("fetchStudentsById success: res =", res);
      return res;
    } catch (error) {
      console.error("fetchStudentsById error:", error);
      return rejectWithValue(error.message || "Failed to fetch item");
    }
  }
);

export const addStudentsItem = createAsyncThunk(
  "students/addItem",
  async (data, { rejectWithValue }) => {
    try {
      return await service.createItem(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add item");
    }
  }
);

export const updateStudentsItem = createAsyncThunk(
  "students/updateItem",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await service.updateItem(id, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update item");
    }
  }
);

export const deleteStudentsItem = createAsyncThunk(
  "students/deleteItem",
  async (id, { rejectWithValue }) => {
    try {
      return await service.deleteItem(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete item");
    }
  }
);

export const fetchStudentsByClass = createAsyncThunk(
  "students/fetchByClass",
  async (className, { rejectWithValue }) => {
    try {
      // Create a mapper/transformer so we don't break existing components.
      // First, get meta to find the school_class_id matching className
      const meta = await service.getStudentsMeta();
      const clsNameStr = String(className).toLowerCase().replace(/class/i, '').trim();
      const matchedClass = (meta.classes || []).find(
        (c) => c.name.toLowerCase().replace(/class/i, '').trim() === clsNameStr
      );
      
      let params = {};
      if (matchedClass) {
        params.school_class_id = matchedClass.id;
      }
      
      const res = await service.getList(params);
      // The API returns { success: true, students: [...] }
      const data = res.students || res.data || res;
      return { data };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class students");
    }
  }
);

export const fetchStudentsMeta = createAsyncThunk(
  "students/fetchMeta",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentsMeta();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch meta");
    }
  }
);

export const toggleStudentStatus = createAsyncThunk(
  "students/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await service.toggleStudentStatus(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle status");
    }
  }
);

export const assignStudentId = createAsyncThunk(
  "students/assignId",
  async (id, { rejectWithValue }) => {
    try {
      return await service.assignStudentId(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to assign ID");
    }
  }
);

export const fetchStudentIdCard = createAsyncThunk(
  "students/fetchIdCard",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getStudentIdCard(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch ID card");
    }
  }
);

export const fetchStudentProfile = createAsyncThunk(
  "student/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentProfile();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch profile");
    }
  }
);

export const fetchStudentAttendance = createAsyncThunk(
  "student/fetchAttendance",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentAttendance();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch attendance");
    }
  }
);

import { 
  getStudentLeavesList, 
  createStudentLeave 
} from "@/services/leave.service";

export const fetchStudentLeaves = createAsyncThunk(
  "student/fetchLeaves",
  async (_, { rejectWithValue }) => {
    try {
      return await getStudentLeavesList();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch leaves");
    }
  }
);

export const applyStudentLeave = createAsyncThunk(
  "student/applyLeave",
  async (leaveData, { rejectWithValue }) => {
    try {
      return await createStudentLeave(leaveData);
    } catch (error) {
      const serverMsg = error.response?.data?.errors?.from_date?.[0] ||
                        error.response?.data?.errors?.to_date?.[0] ||
                        error.response?.data?.errors?.reason?.[0] ||
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to submit leave request";
      return rejectWithValue(serverMsg);
    }
  }
);

export const fetchStudentTimetable = createAsyncThunk(
  "student/fetchTimetable",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentTimetable();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch timetable");
    }
  }
);

export const fetchStudentFees = createAsyncThunk(
  "student/fetchFees",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentFees();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch fees");
    }
  }
);

export const changeStudentPassword = createAsyncThunk(
  "student/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await service.changeStudentPassword(payload);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to change password");
    }
  }
);

export const fetchStudentHolidays = createAsyncThunk(
  "student/fetchHolidays",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentHolidays();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch holidays");
    }
  }
);

export const fetchStudentHolidayDetail = createAsyncThunk(
  "student/fetchHolidayDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getStudentHolidayDetail(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch holiday details");
    }
  }
);

export const fetchStudentHomework = createAsyncThunk(
  "student/fetchHomework",
  async (tab, { rejectWithValue }) => {
    try {
      return await service.getStudentHomework(tab);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch homework list");
    }
  }
);

export const fetchStudentHomeworkDetail = createAsyncThunk(
  "student/fetchHomeworkDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getStudentHomeworkDetail(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch homework details");
    }
  }
);

export const submitStudentHomework = createAsyncThunk(
  "student/submitHomework",
  async ({ id, formData, onUploadProgress }, { rejectWithValue }) => {
    try {
      return await service.submitStudentHomework({ id, formData, onUploadProgress });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to submit homework");
    }
  }
);

export const fetchStudentClassNotesSubjects = createAsyncThunk(
  "student/fetchClassNotesSubjects",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentClassNotesSubjects();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class notes subjects");
    }
  }
);

export const fetchStudentClassNotes = createAsyncThunk(
  "student/fetchClassNotes",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentClassNotes();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class notes");
    }
  }
);

export const fetchStudentClassNotesDetail = createAsyncThunk(
  "student/fetchClassNotesDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getStudentClassNotesDetail(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class notes details");
    }
  }
);

export const fetchStudentExamSchedule = createAsyncThunk(
  "student/fetchExamSchedule",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentExamSchedule();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch exam schedule");
    }
  }
);

export const fetchStudentResults = createAsyncThunk(
  "student/fetchResults",
  async (examId, { rejectWithValue }) => {
    try {
      return await service.getStudentResults(examId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch results");
    }
  }
);

export const fetchStudentReportCards = createAsyncThunk(
  "student/fetchReportCards",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentReportCards();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch report cards");
    }
  }
);

export const fetchStudentReportCardDetail = createAsyncThunk(
  "student/fetchReportCardDetail",
  async (examId, { rejectWithValue }) => {
    try {
      return await service.getStudentReportCardDetail(examId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch report card details");
    }
  }
);

export const fetchStudentAdmitCards = createAsyncThunk(
  "student/fetchAdmitCards",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getStudentAdmitCards();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch admit cards");
    }
  }
);

export const fetchStudentAdmitCardDetail = createAsyncThunk(
  "student/fetchAdmitCardDetail",
  async (examId, { rejectWithValue }) => {
    try {
      return await service.getStudentAdmitCardDetail(examId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch admit card details");
    }
  }
);
