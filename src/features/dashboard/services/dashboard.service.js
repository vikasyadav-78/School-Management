import { api } from "@/services/api";
import * as mockService from "./dashboard.mock";
import { USE_MOCK } from "@/constants";

export const getStats = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, data: mockService.mockStats }), 300);
    });
  }
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getChartData = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, data: mockService.mockChartData }), 300);
    });
  }
  const response = await api.get("/dashboard/charts");
  return response.data;
};

export const getStudentList = async () => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, data: mockService.mockStudentList }), 300);
    });
  }
  const response = await api.get("/dashboard/students");
  return response.data;
};
