import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";
import { USE_MOCK } from "@/constants";
import * as mockService from "./finance.mock";

// ================= STUDENTS FEES =================

export const getStudentFeeDetails = async (studentId) => {
  if (USE_MOCK) return mockService.fetchStudentFeeDetails(studentId);
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/student/${studentId}`);
  return response.data;
};

export const getClassStudentsFees = async (className) => {
  if (USE_MOCK) return mockService.fetchClassStudentsFees(className);
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/class/${className}`);
  return response.data;
};

export const getPendingFeesList = async (className = "") => {
  if (USE_MOCK) return mockService.fetchPendingFeesList(className);
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/pending`, { params: { className } });
  return response.data;
};

export const collectPayment = async (studentId, paymentData) => {
  if (USE_MOCK) return mockService.collectPayment(studentId, paymentData);
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/collect/${studentId}`, paymentData);
  return response.data;
};

export const getFeesReport = async (filters = {}) => {
  if (USE_MOCK) return mockService.fetchReports(filters);
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/reports/student`, { params: filters });
  return response.data;
};

export const getTotalCollection = async () => {
  if (USE_MOCK) return mockService.fetchTotalCollection();
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/total-collection`);
  return response.data;
};

// ================= TEACHER SALARIES =================

export const getTeacherSalaries = async (month) => {
  if (USE_MOCK) return mockService.fetchTeacherSalaries(month);
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/salaries`, { params: { month } });
  return response.data;
};

export const paySalary = async (recordId, paymentData) => {
  if (USE_MOCK) return mockService.paySalary(recordId, paymentData);
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/salaries/pay/${recordId}`, paymentData);
  return response.data;
};

export const getSalaryHistory = async () => {
  if (USE_MOCK) return mockService.fetchSalaryHistory();
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/salaries/history`);
  return response.data;
};

// ================= GENERAL FINANCE REPORTS (FIXED) =================

export const getFinanceReportSummary = async (params = {}) => {
  // Configured api instance ka use ho raha hai jisse base URL and tokens automatically attach ho sakein
  const response = await api.get("/admin/fees", { params });
  return response.data;
};

export const addExpense = async (expenseData) => {
  if (USE_MOCK) return mockService.addExpense(expenseData);
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/expenses`, expenseData);
  return response.data;
};