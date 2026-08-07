import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./module.mock";
import { USE_MOCK } from "@/constants";

export const getList = async (params) => {
  const response = await api.get("/admin/students", { params });
  return response.data;
};

export const getStudentsMeta = async () => {
  const response = await api.get("/admin/students/meta");
  return response.data;
};

export const getById = async (id) => {
  const response = await api.get(`/admin/students/${id}`);
  return response.data;
};

export const createItem = async (data) => {
  // Use multipart/form-data for uploads
  const response = await api.post("/admin/students", data, {
    headers: {
      "Content-Type": data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

export const updateItem = async (id, data) => {
  // Use POST for update as per requirement
  const response = await api.post(`/admin/students/${id}`, data, {
    headers: {
      "Content-Type": data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/admin/students/${id}`);
  return response.data;
};

export const toggleStudentStatus = async (id) => {
  const response = await api.post(`/admin/students/${id}/toggle-status`);
  return response.data;
};

export const assignStudentId = async (id) => {
  const response = await api.post(`/admin/students/${id}/assign-id`);
  return response.data;
};

export const getStudentIdCard = async (id) => {
  const response = await api.get(`/admin/students/${id}/id-card`);
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

// Student Online MCQ APIs
export const getStudentOnlineMcqExams = async (params = {}) => {
  const response = await api.get("/student/online-mcq", { params });
  return response.data;
};

export const getStudentOnlineMcqExamDetail = async (examId) => {
  const response = await api.get(`/student/online-mcq/${examId}`);
  return response.data;
};

export const startStudentOnlineMcqExam = async (examId) => {
  const response = await api.post(`/student/online-mcq/${examId}/start`);
  return response.data;
};

export const getStudentOnlineMcqAttempt = async (attemptId) => {
  const response = await api.get(`/student/online-mcq/attempts/${attemptId}`);
  return response.data;
};

export const saveStudentOnlineMcqAnswer = async (attemptId, payload) => {
  const response = await api.post(`/student/online-mcq/attempts/${attemptId}/answer`, payload);
  return response.data;
};

export const submitStudentOnlineMcqExam = async (attemptId, payload = {}) => {
  const response = await api.post(`/student/online-mcq/attempts/${attemptId}/submit`, payload);
  return response.data;
};

export const logStudentOnlineMcqEvent = async (attemptId, payload) => {
  const response = await api.post(`/student/online-mcq/attempts/${attemptId}/log`, payload);
  return response.data;
};

export const getStudentOnlineMcqResult = async (examId) => {
  const response = await api.get(`/student/online-mcq/${examId}/result`);
  return response.data;
};

export const downloadStudentOnlineMcqCertificate = async (examId) => {
  const response = await api.get(`/student/online-mcq/${examId}/certificate`);
  return response.data;
};

// Student Live Class APIs
export const getStudentLiveClasses = async (params = {}) => {
  const response = await api.get("/student/live-classes", { params });
  return response.data;
};

export const getStudentLiveClassDetail = async (id) => {
  const response = await api.get(`/student/live-classes/${id}`);
  return response.data;
};

export const joinStudentLiveClass = async (id) => {
  const response = await api.post(`/student/live-classes/${id}/join`);
  return response.data;
};

export const leaveStudentLiveClass = async (id) => {
  const response = await api.post(`/student/live-classes/${id}/leave`);
  return response.data;
};

export const sendStudentLiveClassChat = async (id, payload) => {
  const response = await api.post(`/student/live-classes/${id}/chat`, payload);
  return response.data;
};

export const raiseHandStudentLiveClass = async (id) => {
  const response = await api.post(`/student/live-classes/${id}/raise-hand`);
  return response.data;
};

export const getStudentLiveClassMessages = async (id) => {
  const response = await api.get(`/student/live-classes/${id}/messages`);
  return response.data;
};
