import { api } from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";

// ================= STUDENTS FEES =================

export const getStudentFeeDetails = async (studentId) => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/student/${studentId}`);
  return response.data;
};

export const getClassStudentsFees = async (className) => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/class/${className}`);
  return response.data;
};

export const getPendingFeesList = async (className = "") => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/pending`, { params: { className } });
  return response.data;
};

export const collectPayment = async (studentId, paymentData) => {
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/collect/${studentId}`, paymentData);
  return response.data;
};

export const getFeesReport = async (filters = {}) => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/reports/student`, { params: filters });
  return response.data;
};

export const getTotalCollection = async () => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/total-collection`);
  return response.data;
};

// ================= TEACHER SALARIES =================

export const getTeacherSalaries = async (month) => {
  const response = await api.get(`${ENDPOINTS.FINANCE.BASE}/salaries`, { params: { month } });
  return response.data;
};

export const paySalary = async (recordId, paymentData) => {
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/salaries/pay/${recordId}`, paymentData);
  return response.data;
};

export const getSalaryHistory = async () => {
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
  const response = await api.post(`${ENDPOINTS.FINANCE.BASE}/expenses`, expenseData);
  return response.data;
};