import { api } from "@/services/api";

export const getStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getChartData = async () => {
  const response = await api.get("/dashboard/charts");
  return response.data;
};

export const getStudentList = async () => {
  const response = await api.get("/dashboard/students");
  return response.data;
};

export const getStaffList = async () => {
  const response = await api.get("/admin/staff");
  return response.data;
};

export const getAttendanceHistory = async (params = {}) => {
  const response = await api.get("/admin/attendance/history", { params });
  return response.data;
};

export const getExamsList = async () => {
  const response = await api.get("/admin/marks/exams");
  return response.data;
};

export const getClassMarks = async (examId, classId, sectionId) => {
  const response = await api.get(`/admin/marks/${examId}/class`, {
    params: { class_id: classId, section_id: sectionId }
  });
  return response.data;
};
