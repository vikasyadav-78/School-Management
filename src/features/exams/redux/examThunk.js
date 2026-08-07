import { createAsyncThunk } from "@reduxjs/toolkit";
import * as service from "@/features/admin/services/exam.service";

export const fetchExamsList = createAsyncThunk(
  "exams/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      return await service.getExams(params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch exams list");
    }
  }
);

export const fetchExamsMeta = createAsyncThunk(
  "exams/fetchMeta",
  async (_, { rejectWithValue }) => {
    try {
      return await service.getExamsMeta();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch exams metadata");
    }
  }
);

export const fetchExamById = createAsyncThunk(
  "exams/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getExamById(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch exam detail");
    }
  }
);

export const createNewExam = createAsyncThunk(
  "exams/create",
  async (data, { rejectWithValue }) => {
    try {
      return await service.createExam(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create exam");
    }
  }
);

export const fetchExamSchedule = createAsyncThunk(
  "exams/fetchSchedule",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getExamSchedule(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch schedule");
    }
  }
);

export const addScheduleItem = createAsyncThunk(
  "exams/addSchedule",
  async ({ examId, data }, { rejectWithValue }) => {
    try {
      return await service.addExamSchedule(examId, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add schedule");
    }
  }
);

export const addSchedulesBulk = createAsyncThunk(
  "exams/addSchedulesBulk",
  async ({ examId, data }, { rejectWithValue }) => {
    try {
      return await service.addExamSchedulesBulk(examId, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add schedules bulk");
    }
  }
);

export const removeScheduleItem = createAsyncThunk(
  "exams/removeSchedule",
  async ({ examId, scheduleId }, { rejectWithValue }) => {
    try {
      await service.deleteExamSchedule(examId, scheduleId);
      return { scheduleId };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete schedule");
    }
  }
);

export const removeSchedulesBulk = createAsyncThunk(
  "exams/removeSchedulesBulk",
  async ({ examId, data }, { rejectWithValue }) => {
    try {
      return await service.deleteExamSchedulesBulk(examId, data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete bulk schedules");
    }
  }
);

export const fetchExamAdmitCards = createAsyncThunk(
  "exams/fetchAdmitCards",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamAdmitCards(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch admit cards");
    }
  }
);

export const fetchExamResults = createAsyncThunk(
  "exams/fetchResults",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamResults(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch exam results");
    }
  }
);

export const togglePublishExam = createAsyncThunk(
  "exams/togglePublish",
  async (id, { rejectWithValue }) => {
    try {
      return await service.publishExam(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle publish state");
    }
  }
);

export const removeExam = createAsyncThunk(
  "exams/delete",
  async (id, { rejectWithValue }) => {
    try {
      await service.deleteExam(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete exam");
    }
  }
);

export const fetchExamReportOverview = createAsyncThunk(
  "exams/fetchReportOverview",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getExamReportOverview(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch report overview");
    }
  }
);

export const fetchExamReportClassWise = createAsyncThunk(
  "exams/fetchReportClassWise",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamReportClassWise(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch class-wise report");
    }
  }
);

export const fetchExamReportSubjectWise = createAsyncThunk(
  "exams/fetchReportSubjectWise",
  async (id, { rejectWithValue }) => {
    try {
      return await service.getExamReportSubjectWise(id);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch subject-wise report");
    }
  }
);

export const fetchExamReportToppers = createAsyncThunk(
  "exams/fetchReportToppers",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamReportToppers(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch toppers report");
    }
  }
);

export const fetchExamReportMeritList = createAsyncThunk(
  "exams/fetchReportMeritList",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamReportMeritList(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch merit list");
    }
  }
);

export const fetchExamReportFailList = createAsyncThunk(
  "exams/fetchReportFailList",
  async ({ examId, params }, { rejectWithValue }) => {
    try {
      return await service.getExamReportFailList(examId, params);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch fail list");
    }
  }
);
