import { api } from "./api";

/**
 * STUDENT LEAVES
 */
export const getStudentLeavesList = async () => {
  const response = await api.get("/student/leaves");
  return response.data;
};

export const createStudentLeave = async (leaveData) => {
  const response = await api.post("/student/leaves", leaveData);
  return response.data;
};

/**
 * TEACHER LEAVES
 */
export const getTeacherLeavesList = async (params) => {
  const response = await api.get("/teacher/leaves", { params });
  return response.data;
};

export const createTeacherLeave = async (leaveData) => {
  const response = await api.post("/teacher/leaves", leaveData);
  return response.data;
};
