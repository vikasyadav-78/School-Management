import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";

export const getRecord = async (date, className, section, targetType = "student", stream = "") => {
  const response = await api.get(ENDPOINTS.ATTENDANCE.BASE, {
    params: { date, className, section, targetType, stream }
  });
  return response.data;
};

export const saveRecord = async (data) => {
  const response = await api.post(ENDPOINTS.ATTENDANCE.BASE, data);
  return response.data;
};

export const getReport = async (className, section, startDate, endDate, studentName, targetType = "student", stream = "") => {
  const response = await api.get(`${ENDPOINTS.ATTENDANCE.BASE}/report`, {
    params: { className, section, startDate, endDate, studentName, targetType, stream }
  });
  return response.data;
};

export const getStudentSummary = async (studentId) => {
  const response = await api.get(`${ENDPOINTS.ATTENDANCE.BASE}/student/${studentId}/summary`);
  return response.data;
};
