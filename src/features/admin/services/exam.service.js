import { api } from "@/services/api";

export const getExams = async (params = {}) => {
  const response = await api.get("/admin/exams", { params });
  return response.data;
};

export const getExamsMeta = async () => {
  const response = await api.get("/admin/exams/meta");
  return response.data;
};

export const createExam = async (data) => {
  const response = await api.post("/admin/exams", data);
  return response.data;
};

export const getExamById = async (id) => {
  const response = await api.get(`/admin/exams/${id}`);
  return response.data;
};

export const getExamClassSubjects = async (id, classId) => {
  const response = await api.get(`/admin/exams/${id}/class-subjects`, {
    params: { class_id: classId }
  });
  return response.data;
};

export const getExamSchedule = async (id) => {
  const response = await api.get(`/admin/exams/${id}/schedule`);
  return response.data;
};

export const addExamSchedule = async (id, payload) => {
  const response = await api.post(`/admin/exams/${id}/schedules`, payload);
  return response.data;
};

export const addExamSchedulesBulk = async (id, payload) => {
  const response = await api.post(`/admin/exams/${id}/schedules/bulk`, payload);
  return response.data;
};

export const deleteExamSchedule = async (id, scheduleId) => {
  const response = await api.delete(`/admin/exams/${id}/schedules/${scheduleId}`);
  return response.data;
};

export const deleteExamSchedulesBulk = async (id, payload) => {
  const response = await api.delete(`/admin/exams/${id}/schedules/bulk`, { data: payload });
  return response.data;
};

export const getExamAdmitCards = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/admit-cards`, { params });
  return response.data;
};

export const getExamAdmitCardDetail = async (id, studentId) => {
  const response = await api.get(`/admin/exams/${id}/admit-cards/${studentId}`);
  return response.data;
};

export const getExamResults = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/results`, { params });
  return response.data;
};

export const publishExam = async (id) => {
  const response = await api.post(`/admin/exams/${id}/publish`);
  return response.data;
};

export const deleteExam = async (id) => {
  const response = await api.delete(`/admin/exams/${id}`);
  return response.data;
};

export const getExamReportOverview = async (id) => {
  const response = await api.get(`/admin/exams/${id}/reports/overview`);
  return response.data;
};

export const getExamReportClassWise = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/reports/class-wise`, { params });
  return response.data;
};

export const getExamReportSubjectWise = async (id) => {
  const response = await api.get(`/admin/exams/${id}/reports/subject-wise`);
  return response.data;
};

export const getExamReportToppers = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/reports/toppers`, { params });
  return response.data;
};

export const getExamReportMeritList = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/reports/merit-list`, { params });
  return response.data;
};

export const getExamReportFailList = async (id, params = {}) => {
  const response = await api.get(`/admin/exams/${id}/reports/fail-list`, { params });
  return response.data;
};
