import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./module.mock";
import { USE_MOCK } from "@/constants";

export const getList = async (params) => {
  if (USE_MOCK) {
    return mockService.fetchAll(params);
  }
  const response = await api.get(ENDPOINTS.STUDENTS.BASE, { params });
  return response.data;
};

export const getById = async (id) => {
  if (USE_MOCK) {
    return mockService.fetchById(id);
  }
  const response = await api.get(ENDPOINTS.STUDENTS.DETAIL(id));
  return response.data;
};

export const createItem = async (data) => {
  if (USE_MOCK) {
    return mockService.create(data);
  }
  const response = await api.post(ENDPOINTS.STUDENTS.BASE, data);
  return response.data;
};

export const updateItem = async (id, data) => {
  if (USE_MOCK) {
    return mockService.update(id, data);
  }
  const response = await api.put(ENDPOINTS.STUDENTS.DETAIL(id), data);
  return response.data;
};

export const deleteItem = async (id) => {
  if (USE_MOCK) {
    return mockService.remove(id);
  }
  const response = await api.delete(ENDPOINTS.STUDENTS.DETAIL(id));
  return response.data;
};

export const getStudentsByClass = async (className) => {
  if (USE_MOCK) {
    return mockService.fetchByClass(className);
  }
  const response = await api.get(`${ENDPOINTS.STUDENTS.BASE}/class/${className}`);
  return response.data;
};

export const getStudentProfile = async () => {
  const response = await api.get("/student/profile");
  return response.data;
};

export const getStudentAttendance = async () => {
  const response = await api.get("/student/attendance");
  return response.data;
};

export const getStudentLeaves = async () => {
  const response = await api.get("/student/leaves");
  return response.data;
};

export const getStudentTimetable = async () => {
  const response = await api.get("/student/timetable");
  return response.data;
};

export const getStudentFees = async () => {
  const response = await api.get("/student/fees");
  return response.data;
};

export const changeStudentPassword = async (payload) => {
  const response = await api.post("/student/change-password", payload);
  return response.data;
};

export const getStudentHolidays = async () => {
  const response = await api.get("/student/holidays");
  return response.data;
};

export const getStudentHolidayDetail = async (id) => {
  const response = await api.get(`/student/holidays/${id}`);
  return response.data;
};

export const getStudentHomework = async (tab) => {
  const response = await api.get("/student/homework", { params: { tab } });
  return response.data;
};

export const getStudentHomeworkDetail = async (id) => {
  const response = await api.get(`/student/homework/${id}`);
  return response.data;
};

export const submitStudentHomework = async ({ id, formData, onUploadProgress }) => {
  const response = await api.post(`/student/homework/${id}/submit`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress
  });
  return response.data;
};

export const getStudentClassNotesSubjects = async () => {
  const response = await api.get("/student/class-notes/subjects");
  return response.data;
};

export const getStudentClassNotes = async () => {
  const response = await api.get("/student/class-notes");
  return response.data;
};

export const getStudentClassNotesDetail = async (id) => {
  const response = await api.get(`/student/class-notes/${id}`);
  return response.data;
};

export const getStudentExamSchedule = async () => {
  const response = await api.get("/student/exam-schedule");
  return response.data;
};

export const getStudentResults = async (examId) => {
  const params = examId ? { exam_id: examId } : {};
  const response = await api.get("/student/results", { params });
  return response.data;
};

export const getStudentReportCards = async () => {
  const response = await api.get("/student/report-cards");
  return response.data;
};

export const getStudentReportCardDetail = async (examId) => {
  const response = await api.get(`/student/report-cards/${examId}`);
  return response.data;
};

export const getStudentAdmitCards = async () => {
  const response = await api.get("/student/admit-cards");
  return response.data;
};

export const getStudentAdmitCardDetail = async (examId) => {
  const response = await api.get(`/student/admit-cards/${examId}`);
  return response.data;
};
