import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import * as mockService from "./teacher.mock";
import { USE_MOCK } from "@/constants";

export const getList = async (params) => {
  if (USE_MOCK) {
    return mockService.fetchAll(params);
  }
  const response = await api.get(ENDPOINTS.TEACHERS.BASE, { params });
  return response.data;
};

export const getById = async (id) => {
  if (USE_MOCK) {
    return mockService.fetchById(id);
  }
  const response = await api.get(ENDPOINTS.TEACHERS.DETAIL(id));
  return response.data;
};

export const createItem = async (data) => {
  if (USE_MOCK) {
    return mockService.create(data);
  }
  const response = await api.post(ENDPOINTS.TEACHERS.BASE, data);
  return response.data;
};

export const updateItem = async (id, data) => {
  if (USE_MOCK) {
    return mockService.update(id, data);
  }
  const response = await api.put(ENDPOINTS.TEACHERS.DETAIL(id), data);
  return response.data;
};

export const deleteItem = async (id) => {
  if (USE_MOCK) {
    return mockService.remove(id);
  }
  const response = await api.delete(ENDPOINTS.TEACHERS.DETAIL(id));
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/teacher/profile");
  return response.data;
};

export const getAttendanceClasses = async () => {
  const response = await api.get("/teacher/attendance/classes");
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get("/teacher/my-attendance");
  return response.data;
};

export const changeTeacherPassword = async (payload) => {
  const response = await api.post("/teacher/change-password", payload);
  return response.data;
};

export const getAttendanceRoster = async (params) => {
  const response = await api.get("/teacher/attendance", { params });
  return response.data;
};

export const saveAttendanceRoster = async (data) => {
  const response = await api.post("/teacher/attendance", data);
  return response.data;
};

export const getAttendanceHistory = async (params) => {
  const response = await api.get("/teacher/attendance/history", { params });
  return response.data;
};

export const qrLookup = async (data) => {
  const response = await api.post("/teacher/attendance/qr-lookup", data);
  return response.data; 
};

export const qrMark = async (data) => {
  const response = await api.post("/teacher/attendance/qr-mark", data);
  return response.data;
};

export const quickQrScan = async (data) => {
  const response = await api.post("/attendance/qr-scan", data);
  return response.data;
};

