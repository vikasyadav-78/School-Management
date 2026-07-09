import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import { USE_MOCK } from "@/constants";
import * as mockService from "./attendance.mock";

export const getRecord = async (date, className, section, targetType = "student", stream = "") => {
  if (USE_MOCK) {
    return mockService.fetchRecord(date, className, section, targetType, stream);
  }
  const response = await api.get(ENDPOINTS.ATTENDANCE.BASE, {
    params: { date, className, section, targetType, stream }
  });
  return response.data;
};

export const saveRecord = async (data) => {
  if (USE_MOCK) {
    return mockService.saveRecord(data);
  }
  const response = await api.post(ENDPOINTS.ATTENDANCE.BASE, data);
  return response.data;
};

export const getReport = async (className, section, startDate, endDate, studentName, targetType = "student", stream = "") => {
  if (USE_MOCK) {
    return mockService.fetchReport(className, section, startDate, endDate, studentName, targetType, stream);
  }
  const response = await api.get(`${ENDPOINTS.ATTENDANCE.BASE}/report`, {
    params: { className, section, startDate, endDate, studentName, targetType, stream }
  });
  return response.data;
};

export const getStudentSummary = async (studentId) => {
  if (USE_MOCK) {
    return mockService.fetchStudentSummary(studentId);
  }
  const response = await api.get(`${ENDPOINTS.ATTENDANCE.BASE}/student/${studentId}/summary`);
  return response.data;
};
